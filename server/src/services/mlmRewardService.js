import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { ReferralReward } from '../models/ReferralReward.js';
import { ReferralRelationship } from '../models/ReferralRelationship.js';
import { Commission } from '../models/Commission.js';
import { Settings } from '../models/Settings.js';
import { Wallet } from '../models/Wallet.js';
import { Vendor } from '../models/Vendor.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { fairCoinService } from './fairCoinService.js';
import { superCoinService } from './superCoinService.js';
import { walletService } from './walletService.js';
import { notificationService } from './notificationService.js';

export const mlmRewardService = {
  async getMLMConfig() {
    const setting = await Settings.findOne({ key: 'MLM_COMMISSION_RATES' }) || await Settings.findOne({ key: 'MLM_CONFIG' });
    if (setting && setting.value) {
      if (Array.isArray(setting.value.levels)) return setting.value;
      if (Array.isArray(setting.value)) return { maxLevels: setting.value.length, levels: setting.value };
    }
    return {
      maxLevels: 9,
      levels: [
        { level: 1, percentage: 10, name: 'Level 1 (Direct)' },
        { level: 2, percentage: 5, name: 'Level 2' },
        { level: 3, percentage: 3, name: 'Level 3' },
        { level: 4, percentage: 2, name: 'Level 4' },
        { level: 5, percentage: 1, name: 'Level 5' },
        { level: 6, percentage: 1, name: 'Level 6' },
        { level: 7, percentage: 1, name: 'Level 7' },
        { level: 8, percentage: 1, name: 'Level 8' },
        { level: 9, percentage: 1, name: 'Level 9' },
      ],
    };
  },

  calculateLeadershipRank(directCount) {
    if (directCount >= 50) {
      return { rank: 'DIAMOND', title: 'Diamond Elite', multiplier: 1.5, badgeColor: '#eab308', nextRankAt: 100 };
    }
    if (directCount >= 15) {
      return { rank: 'GOLD', title: 'Gold Ambassador', multiplier: 1.25, badgeColor: '#fbbf24', nextRankAt: 50 };
    }
    if (directCount >= 5) {
      return { rank: 'SILVER', title: 'Silver Leader', multiplier: 1.1, badgeColor: '#94a3b8', nextRankAt: 15 };
    }
    return { rank: 'BRONZE', title: 'Bronze Partner', multiplier: 1.0, badgeColor: '#cd7f32', nextRankAt: 5 };
  },

  async getLeaderboard(limit = 10) {
    const leaderboard = await Referral.aggregate([
      { $match: { level: 1 } },
      { $group: { _id: '$userId', directCount: { $sum: 1 } } },
      { $sort: { directCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          referralCode: '$user.referralCode',
          fairCoinBalance: '$user.fairCoinBalance',
          directCount: 1,
        },
      },
    ]);

    return leaderboard;
  },

  async validateReferralCode(code, registeringRole = 'CUSTOMER') {
    if (!code || typeof code !== 'string' || !code.trim()) {
      return { valid: false, message: 'Referral code is required' };
    }

    const cleanCode = code.trim().toUpperCase();

    const referrer = await User.findOne({ referralCode: cleanCode }).select('name email role status referralCode');
    if (!referrer) {
      return { valid: false, message: 'Invalid referral ID. Please enter a valid referral code.' };
    }

    if (referrer.status === 'SUSPENDED' || referrer.status === 'BLOCKED') {
      return { valid: false, message: 'Referrer account is currently suspended or inactive.' };
    }

    // Role-separated referral tree rules:
    // Vendor codes can only refer Vendors. Customer codes can only refer Customers.
    const regRole = (registeringRole || 'CUSTOMER').toUpperCase();
    if (regRole === 'VENDOR' && referrer.role !== 'VENDOR') {
      return {
        valid: false,
        message: 'Invalid vendor referral code. Vendors can only be referred by an existing vendor.',
      };
    }

    if (regRole === 'CUSTOMER' && referrer.role === 'VENDOR') {
      return {
        valid: false,
        message: 'Invalid customer referral code. Customers can only be referred by existing customers.',
      };
    }

    // In a one-to-many tree, any referrer can refer unlimited direct members
    const directCount = await ReferralRelationship.countDocuments({
      referrerId: referrer._id,
      referralType: regRole === 'VENDOR' ? 'VENDOR' : 'CUSTOMER',
    });

    return {
      valid: true,
      referrerId: referrer._id,
      referrerName: referrer.name,
      referrerRole: referrer.role,
      referralCode: referrer.referralCode,
      directCount,
      message: `Referral code verified! Referred by ${referrer.name} (${referrer.role}).`,
    };
  },

  async processReferralRegistrationRewards(newUserId, referrerUserId) {
    if (!referrerUserId || !newUserId) return;
    if (newUserId.toString() === referrerUserId.toString()) {
      console.warn('[mlmRewardService] Self-referral prevented for user:', newUserId);
      return;
    }

    const newUser = await User.findById(newUserId);
    const referrer = await User.findById(referrerUserId);
    if (!newUser || !referrer) return;

    // Prevent circular referral relationships
    if (referrer.referralPath && referrer.referralPath.map(id => id.toString()).includes(newUserId.toString())) {
      console.warn('[mlmRewardService] Circular referral relationship prevented between', newUserId, 'and', referrerUserId);
      return;
    }

    // Prevent existing accounts from claiming a second referrer (at most one direct referrer)
    const existingRelationship = await ReferralRelationship.findOne({ referredUserId: newUserId });
    if (existingRelationship) {
      console.warn('[mlmRewardService] Account already has a direct referrer:', newUserId);
      return;
    }

    const isVendorTree = newUser.role === 'VENDOR' && referrer.role === 'VENDOR';
    const isCustomerTree = newUser.role === 'CUSTOMER' && referrer.role === 'CUSTOMER';

    if (!isVendorTree && !isCustomerTree) {
      console.warn('[mlmRewardService] Cross-type referral disallowed: newUser role', newUser.role, 'referrer role', referrer.role);
      return;
    }

    const referralType = isVendorTree ? 'VENDOR' : 'CUSTOMER';

    // 1. Maintain referralPath and referredBy on User
    newUser.referredBy = referrer._id;
    newUser.referralPath = [...(referrer.referralPath || []), referrer._id];
    await newUser.save();

    // 2. Backward compatibility: update Referral record
    await Referral.updateOne(
      { userId: referrer._id, referredUserId: newUser._id },
      { $set: { level: 1, status: 'ACTIVE' } },
      { upsert: true }
    );

    // 3. Customer Referral Tree: Award exactly 500 Super Coins to direct referring customer
    if (isCustomerTree) {
      // Deduplication check: Has a reward relationship already been created?
      const rel = await ReferralRelationship.create({
        referrerId: referrer._id,
        referredUserId: newUser._id,
        referralType: 'CUSTOMER',
        referralCode: referrer.referralCode,
        qualificationStatus: 'QUALIFIED',
        qualifiedAt: new Date(),
        superCoinsAwarded: 500,
      });

      // Credit 500 Super Coins to referring customer via existing Super Coins wallet
      try {
        const coinTx = await superCoinService.creditCoins({
          userId: referrer._id,
          amount: 500,
          type: 'REFERRAL_REWARD',
          source: 'DIRECT_CUSTOMER_REFERRAL',
          referenceId: rel._id.toString(),
          description: `Customer Referral Reward: 500 Super Coins for referring ${newUser.name || 'new customer'}`,
        });

        if (coinTx) {
          rel.rewardTransactionId = coinTx._id.toString();
          await rel.save();
        }
      } catch (coinErr) {
        console.error('[mlmRewardService] Failed to credit 500 Super Coins:', coinErr);
      }

      // Notify referring customer
      try {
        await notificationService.createNotification(
          {
            userId: referrer._id,
            title: '🎉 500 Super Coins Earned!',
            message: `${newUser.name || 'A new customer'} registered using your referral code. 500 Super Coins have been added to your wallet!`,
            type: 'REFERRAL_JOINED',
            link: '/account/referrals',
          },
          { dedupeKey: `${newUser._id.toString()}:CUSTOMER_REF_COINS` }
        );
      } catch (notifyErr) {
        console.error('[mlmRewardService] Failed to notify referring customer:', notifyErr);
      }
    }

    // 4. Vendor Referral Tree: Record relationship with PENDING qualification status
    if (isVendorTree) {
      await ReferralRelationship.create({
        referrerId: referrer._id,
        referredUserId: newUser._id,
        referralType: 'VENDOR',
        referralCode: referrer.referralCode,
        qualificationStatus: 'PENDING',
        commissionRate: 10, // Fixed 10% direct commission
        commissionStatus: 'NONE',
      });

      try {
        await notificationService.createNotification(
          {
            userId: referrer._id,
            title: '🤝 New Vendor Referred!',
            message: `${newUser.name || 'A new vendor'} registered using your referral link. You will earn a 10% direct referral commission when they purchase an eligible subscription plan!`,
            type: 'REFERRAL_JOINED',
            link: '/vendor/referrals',
          },
          { dedupeKey: `${newUser._id.toString()}:VENDOR_REF_JOIN` }
        );
      } catch (notifyErr) {
        console.error('[mlmRewardService] Failed to notify referring vendor:', notifyErr);
      }
    }
  },

  async processPurchaseCommission(buyerUserId, orderId, orderTotal) {
    const mlmConfig = await this.getMLMConfig();
    const upline = await this.getUpline(buyerUserId, mlmConfig.maxLevels || 3);

    for (const node of upline) {
      const levelConfig = mlmConfig.levels.find((l) => l.level === node.level);
      if (levelConfig && levelConfig.percentage > 0) {
        const commissionAmount = Math.round((orderTotal * levelConfig.percentage) / 100);

        if (commissionAmount > 0) {
          const commission = await Commission.create({
            orderId,
            type: 'MLM_UPLINE_COMMISSION',
            recipientUserId: node.user._id,
            orderAmount: orderTotal,
            commissionPercentage: levelConfig.percentage,
            commissionAmount,
            status: 'PAID',
          });

          try {
            await notificationService.createNotification({
              userId: node.user._id,
              title: 'Commission Earned',
              message: `You earned ₹${(commissionAmount / 100).toFixed(2)} from referred purchase.`,
              type: 'COMMISSION_EARNED',
              link: '/account/commissions'
            }, { dedupeKey: `${commission._id.toString()}:COMMISSION_EARNED` });
          } catch (err) {
            console.error('Failed to notify commission:', err);
          }

          await fairCoinService.creditCoins({
            userId: node.user._id,
            amount: commissionAmount,
            type: 'BONUS',
            source: `MLM_LEVEL_${node.level}_PURCHASE_COMMISSION`,
            referenceId: orderId.toString(),
            description: `Level ${node.level} commission reward on referred purchase`,
          });
        }
      }
    }
  },

  async processVendorSubscriptionCommission(vendorId, subscriptionId, subscriptionAmount, planName = '') {
    if (!subscriptionAmount || subscriptionAmount <= 0) return;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.userId) return;

    // Idempotency check: prevent duplicate commission on repeated payment callbacks
    const existingCommission = await Commission.findOne({
      subscriptionId,
      type: 'VENDOR_DIRECT_REFERRAL_COMMISSION',
    });
    if (existingCommission) {
      console.warn('[mlmRewardService] Commission already processed for subscription:', subscriptionId);
      return;
    }

    // Find direct vendor referral relationship
    let rel = await ReferralRelationship.findOne({
      referredUserId: vendor.userId,
      referralType: 'VENDOR',
    });

    // Fallback: If relationship is not yet created, check user's referredBy
    if (!rel) {
      const vendorUser = await User.findById(vendor.userId);
      if (vendorUser?.referredBy) {
        const refUser = await User.findById(vendorUser.referredBy);
        if (refUser && refUser.role === 'VENDOR') {
          rel = await ReferralRelationship.create({
            referrerId: refUser._id,
            referredUserId: vendorUser._id,
            referralType: 'VENDOR',
            referralCode: refUser.referralCode || 'VENDOR',
            qualificationStatus: 'PENDING',
            commissionRate: 10,
          });
        }
      }
    }

    // Case 1: Vendor joined without a referral -> Super Admin retains 100% of proceeds
    if (!rel) {
      try {
        const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 });
        const currentBalance = latestPlatformRecord?.balanceSnapshot || 0;
        const nextBalance = currentBalance + subscriptionAmount;

        await PlatformLedger.create({
          transactionId: `PL-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'VENDOR_SUBSCRIPTION',
          sourceEntityType: 'SUBSCRIPTION',
          sourceEntityId: subscriptionId.toString(),
          credit: subscriptionAmount,
          debit: 0,
          balanceSnapshot: nextBalance,
          description: `Vendor subscription fee (₹${subscriptionAmount}) with no referral sponsor (100% retained by Super Admin)`,
          metadata: {
            vendorId: vendor._id,
            subscriptionAmount,
            directCommission: 0,
            superAdminRetained: subscriptionAmount,
          },
        });
      } catch (ledgerErr) {
        console.error('[mlmRewardService] Failed to log platform subscription ledger:', ledgerErr);
      }
      return;
    }

    // Case 2: Vendor has a direct referrer -> Exactly 10% direct referral commission
    const commissionRate = 10;
    const commissionAmount = Math.round((subscriptionAmount * commissionRate) / 100);
    const superAdminRetained = subscriptionAmount - commissionAmount;

    // 1. Create auditable Commission record
    await Commission.create({
      subscriptionId,
      level: 1,
      type: 'VENDOR_DIRECT_REFERRAL_COMMISSION',
      recipientUserId: rel.referrerId,
      vendorId: vendor._id,
      orderAmount: subscriptionAmount,
      commissionPercentage: commissionRate,
      commissionAmount,
      status: 'PAID',
    });

    // 2. Credit referring vendor's wallet
    await walletService.creditWallet({
      userId: rel.referrerId,
      amount: commissionAmount,
      type: 'COMMISSION_CREDIT',
      referenceId: subscriptionId.toString(),
      referenceType: 'VENDOR_SUBSCRIPTION',
      description: `10% Direct Referral Commission from vendor subscription (${vendor.storeName || 'Vendor'})`,
      metadata: {
        vendorId: vendor._id,
        subscriptionId: subscriptionId.toString(),
        commissionRate,
        level: 1,
      },
    });

    // 3. Update ReferralRelationship to QUALIFIED & PAID
    rel.qualificationStatus = 'QUALIFIED';
    rel.qualifiedAt = new Date();
    rel.vendorSubscriptionId = subscriptionId;
    if (planName) rel.planName = planName;
    rel.subscriptionAmount = subscriptionAmount;
    rel.commissionRate = commissionRate;
    rel.commissionAmount = commissionAmount;
    rel.commissionStatus = 'PAID';
    await rel.save();

    // 4. Record in PlatformLedger
    try {
      const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 });
      const currentBalance = latestPlatformRecord?.balanceSnapshot || 0;
      const nextBalance = currentBalance + superAdminRetained;

      await PlatformLedger.create({
        transactionId: `PL-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'VENDOR_SUBSCRIPTION',
        sourceEntityType: 'SUBSCRIPTION',
        sourceEntityId: subscriptionId.toString(),
        credit: subscriptionAmount,
        debit: commissionAmount,
        balanceSnapshot: nextBalance,
        description: `Vendor subscription payment (₹${subscriptionAmount}): ₹${commissionAmount} (10%) direct referral commission, ₹${superAdminRetained} retained by Super Admin`,
        metadata: {
          vendorId: vendor._id,
          subscriptionAmount,
          commissionAmount,
          superAdminRetained,
        },
      });
    } catch (ledgerErr) {
      console.error('[mlmRewardService] Failed to log platform subscription ledger:', ledgerErr);
    }

    // 5. Notify referring vendor
    try {
      await notificationService.createNotification(
        {
          userId: rel.referrerId,
          title: '💰 10% Direct Referral Commission Received!',
          message: `You earned ₹${commissionAmount.toLocaleString('en-IN')} (10% commission) from referred vendor subscription (${vendor.storeName || 'Vendor'}).`,
          type: 'COMMISSION_EARNED',
          link: '/vendor/referrals',
        },
        { dedupeKey: `${subscriptionId.toString()}:DIRECT_COMMISSION` }
      );
    } catch (notifyErr) {
      console.error('[mlmRewardService] Failed to notify referring vendor:', notifyErr);
    }
  },

  async getUpline(userId, maxLevels = 9) {
    const user = await User.findById(userId).select('referralPath');
    if (!user || !user.referralPath || user.referralPath.length === 0) {
      return [];
    }

    const uplineIds = [];
    const len = user.referralPath.length;
    for (let i = 1; i <= maxLevels; i++) {
      if (len - i >= 0) {
        uplineIds.push(user.referralPath[len - i]);
      }
    }

    if (uplineIds.length === 0) return [];

    // Fetch all active upline users in a single query (exclude suspended/blocked accounts)
    const uplineUsers = await User.find({
      _id: { $in: uplineIds },
      status: { $nin: ['SUSPENDED', 'BLOCKED'] },
    });

    // Map back in order of level (1 = immediate referrer, 2 = grandparent, etc.)
    const uplineNodes = [];
    for (let i = 0; i < uplineIds.length; i++) {
      const id = uplineIds[i];
      const foundUser = uplineUsers.find((u) => u._id.toString() === id.toString());
      if (foundUser) {
        uplineNodes.push({ level: i + 1, user: foundUser });
      }
    }

    return uplineNodes;
  },

  async buildReferralTree(userId, maxLevel = 9) {
    const user = await User.findById(userId).select('name email referralCode fairCoinBalance createdAt');
    if (!user) return null;

    // Set maximum allowed level cap to 9
    const capLevel = Math.min(9, Math.max(1, maxLevel));

    // Fetch all referrals for this ancestor in a single query
    const referrals = await Referral.find({ userId, level: { $lte: capLevel } })
      .populate('referredUserId', 'name email phone referralCode createdAt status role fairCoinBalance');

    const tree = {};
    const stats = {
      totalReferrals: 0,
    };

    for (let i = 1; i <= capLevel; i++) {
      tree[`level${i}`] = [];
      stats[`level${i}Count`] = 0;
    }

    for (const ref of referrals) {
      if (ref.referredUserId) {
        const lvl = ref.level;
        if (lvl <= capLevel) {
          tree[`level${lvl}`].push(ref.referredUserId);
          stats[`level${lvl}Count`]++;
          stats.totalReferrals++;
        }
      }
    }

    const rankInfo = this.calculateLeadershipRank(stats.level1Count || 0);
    const leaderboard = await this.getLeaderboard(5);

    return {
      user,
      rankInfo,
      leaderboard,
      stats,
      tree,
    };
  },

  async buildOneToManyHierarchy(rootUserId, referralType = 'VENDOR', maxDepth = 4) {
    const visited = new Set();

    const fetchNode = async (userId, currentDepth = 1) => {
      if (!userId || visited.has(userId.toString()) || currentDepth > maxDepth) {
        return null;
      }
      visited.add(userId.toString());

      const user = await User.findById(userId).select('name email phone role referralCode status createdAt superCoinBalance');
      if (!user) return null;

      let vendorInfo = null;
      if (user.role === 'VENDOR') {
        vendorInfo = await Vendor.findOne({ userId: user._id }).select('storeName status');
      }

      // Find all direct children in ReferralRelationship
      const relationships = await ReferralRelationship.find({
        referrerId: user._id,
        referralType,
      }).populate('referredUserId', 'name email phone role referralCode status createdAt superCoinBalance');

      const directCount = relationships.length;
      const children = [];

      for (const rel of relationships) {
        if (!rel.referredUserId) continue;
        const childNode = await fetchNode(rel.referredUserId._id, currentDepth + 1);
        if (childNode) {
          childNode.relationship = {
            id: rel._id,
            qualificationStatus: rel.qualificationStatus,
            qualifiedAt: rel.qualifiedAt,
            planName: rel.planName,
            subscriptionAmount: rel.subscriptionAmount,
            commissionRate: rel.commissionRate,
            commissionAmount: rel.commissionAmount,
            commissionStatus: rel.commissionStatus,
            superCoinsAwarded: rel.superCoinsAwarded,
            rewardTransactionId: rel.rewardTransactionId,
            createdAt: rel.createdAt,
          };
          children.push(childNode);
        }
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        status: user.status,
        createdAt: user.createdAt,
        storeName: vendorInfo?.storeName || '',
        superCoinBalance: user.superCoinBalance || 0,
        depth: currentDepth,
        directCount,
        children,
      };
    };

    const tree = await fetchNode(rootUserId, 1);
    return tree;
  },
};
