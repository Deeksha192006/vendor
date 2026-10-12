import mongoose from 'mongoose';
import { ReferralRelationship } from '../models/ReferralRelationship.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Commission } from '../models/Commission.js';
import { mlmRewardService } from '../services/mlmRewardService.js';
import { superCoinService } from '../services/superCoinService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

// ===============================================================
// 1. SUPER ADMIN: MLM & Referral Summary (10 Cards + Financial)
// ===============================================================
export const getMlmSummary = asyncWrapper(async (req, res) => {
  const [
    totalVendorReferrals,
    qualifiedVendorReferrals,
    totalCustomerReferrals,
    qualifiedCustomerReferrals,
    reversedRewards,
    vendorAmounts,
    customerCoins,
  ] = await Promise.all([
    ReferralRelationship.countDocuments({ referralType: 'VENDOR' }),
    ReferralRelationship.countDocuments({ referralType: 'VENDOR', qualificationStatus: 'QUALIFIED' }),
    ReferralRelationship.countDocuments({ referralType: 'CUSTOMER' }),
    ReferralRelationship.countDocuments({ referralType: 'CUSTOMER', qualificationStatus: 'QUALIFIED' }),
    ReferralRelationship.countDocuments({ qualificationStatus: 'REVERSED' }),
    ReferralRelationship.aggregate([
      { $match: { referralType: 'VENDOR' } },
      {
        $group: {
          _id: null,
          totalSubscription: { $sum: '$subscriptionAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          pendingCommission: {
            $sum: {
              $cond: [{ $eq: ['$commissionStatus', 'PENDING'] }, '$commissionAmount', 0],
            },
          },
          paidCommission: {
            $sum: {
              $cond: [{ $eq: ['$commissionStatus', 'PAID'] }, '$commissionAmount', 0],
            },
          },
        },
      },
    ]),
    ReferralRelationship.aggregate([
      { $match: { referralType: 'CUSTOMER', qualificationStatus: 'QUALIFIED' } },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$superCoinsAwarded' },
        },
      },
    ]),
  ]);

  const vendorAgg = vendorAmounts[0] || {
    totalSubscription: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
  };

  const totalVendorSubscriptionPayments = vendorAgg.totalSubscription;
  const totalVendorReferralCommissions = vendorAgg.totalCommission;
  const pendingCommissions = vendorAgg.pendingCommission;
  const paidCommissions = vendorAgg.paidCommission;
  const totalSuperCoinsAwarded = customerCoins[0]?.totalCoins || 0;
  const superAdminRemainingProceeds = Math.max(0, totalVendorSubscriptionPayments - totalVendorReferralCommissions);

  const summary = {
    // 10 Requested Summary Cards
    cards: {
      totalVendorReferrals,
      qualifiedVendorReferrals,
      totalVendorSubscriptionPayments,
      totalVendorReferralCommissions,
      pendingCommissions,
      paidCommissions,
      totalCustomerReferrals,
      qualifiedCustomerReferrals,
      totalSuperCoinsAwarded,
      reversedRewards,
    },
    // Financial Summary
    financialSummary: {
      eligibleSubscriptionPayments: totalVendorSubscriptionPayments,
      directVendorReferralCommissions: totalVendorReferralCommissions,
      remainingSubscriptionProceeds: superAdminRemainingProceeds,
      commissionPayouts: paidCommissions,
      customerSuperCoinsAwarded: totalSuperCoinsAwarded,
      commissionRate: '10% (Direct Vendor Only)',
      customerRewardRule: '500 Super Coins per Qualified Direct Referral',
    },
  };

  return res.status(200).json(new ApiResponse(200, summary, 'MLM & Referral summary retrieved successfully'));
});

// ===============================================================
// 2. SUPER ADMIN: Vendor Referrals List
// ===============================================================
export const getVendorReferrals = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = { referralType: 'VENDOR' };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchedUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }, { referralCode: searchRegex }],
    }).select('_id');
    const matchedIds = matchedUsers.map((u) => u._id);

    query.$or = [{ referrerId: { $in: matchedIds } }, { referredUserId: { $in: matchedIds } }];
  }

  const [referrals, total] = await Promise.all([
    ReferralRelationship.find(query)
      .populate('referrerId', 'name email phone referralCode')
      .populate('referredUserId', 'name email phone referralCode status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ReferralRelationship.countDocuments(query),
  ]);

  // Enrich with vendor store names
  const userIds = [];
  referrals.forEach((r) => {
    if (r.referrerId?._id) userIds.push(r.referrerId._id);
    if (r.referredUserId?._id) userIds.push(r.referredUserId._id);
  });

  const vendors = await Vendor.find({ userId: { $in: userIds } }).select('userId storeName');
  const vendorMap = new Map();
  vendors.forEach((v) => vendorMap.set(v.userId.toString(), v.storeName));

  const enriched = referrals.map((r) => ({
    ...r,
    referrerStoreName: r.referrerId ? vendorMap.get(r.referrerId._id.toString()) || '' : '',
    referredStoreName: r.referredUserId ? vendorMap.get(r.referredUserId._id.toString()) || '' : '',
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        referrals: enriched,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Vendor referrals retrieved successfully'
    )
  );
});

// ===============================================================
// 3. SUPER ADMIN: Customer Referrals List
// ===============================================================
export const getCustomerReferrals = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = { referralType: 'CUSTOMER' };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchedUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }, { referralCode: searchRegex }],
    }).select('_id');
    const matchedIds = matchedUsers.map((u) => u._id);

    query.$or = [{ referrerId: { $in: matchedIds } }, { referredUserId: { $in: matchedIds } }];
  }

  const [referrals, total] = await Promise.all([
    ReferralRelationship.find(query)
      .populate('referrerId', 'name email phone referralCode')
      .populate('referredUserId', 'name email phone referralCode status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ReferralRelationship.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        referrals,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Customer referrals retrieved successfully'
    )
  );
});

// ===============================================================
// 4. SUPER ADMIN: Searchable One-to-Many Referral Tree
// ===============================================================
export const getReferralTree = asyncWrapper(async (req, res) => {
  const { search, userId, referralType = 'VENDOR', maxDepth = 4 } = req.query;
  const treeType = referralType.toUpperCase() === 'CUSTOMER' ? 'CUSTOMER' : 'VENDOR';
  const depth = Math.min(6, Math.max(1, parseInt(maxDepth, 10) || 4));

  let rootUser = null;

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    rootUser = await User.findOne({
      $or: [
        { email: cleanSearch.toLowerCase() },
        { referralCode: cleanSearch.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(cleanSearch) ? [{ _id: cleanSearch }] : []),
        { name: new RegExp(cleanSearch, 'i') },
      ],
      role: treeType,
    }).select('name email role referralCode status createdAt');
  } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    rootUser = await User.findById(userId).select('name email role referralCode status createdAt');
  }

  if (!rootUser) {
    // Pick the user with the most direct referrals of this type
    const topReferrer = await ReferralRelationship.aggregate([
      { $match: { referralType: treeType } },
      { $group: { _id: '$referrerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    if (topReferrer && topReferrer.length > 0) {
      rootUser = await User.findById(topReferrer[0]._id).select('name email role referralCode status createdAt');
    }
  }

  if (!rootUser) {
    // Fallback: pick any user with this role
    rootUser = await User.findOne({ role: treeType }).select('name email role referralCode status createdAt');
  }

  if (!rootUser) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { rootUser: null, tree: null, message: `No ${treeType.toLowerCase()} found in the system yet.` },
        'No tree found'
      )
    );
  }

  const tree = await mlmRewardService.buildOneToManyHierarchy(rootUser._id, treeType, depth);

  return res.status(200).json(
    new ApiResponse(
      200,
      { rootUser, tree, referralType: treeType },
      'One-to-many referral tree loaded successfully'
    )
  );
});

// ===============================================================
// 5. VENDOR DASHBOARD: "Refer a Vendor"
// ===============================================================
export const getVendorDashboard = asyncWrapper(async (req, res) => {
  const user = req.user;
  if (user.role !== 'VENDOR' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    throw new ApiError(403, 'Access denied: Vendor role required', ERROR_CODES.FORBIDDEN);
  }

  // Ensure referralCode exists
  if (!user.referralCode) {
    user.referralCode = User.generateReferralCode(user.name, 'VENDOR');
    await user.save();
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const referralLink = `${clientUrl}/vendor/register?ref=${user.referralCode}`;

  const referrals = await ReferralRelationship.find({
    referrerId: user._id,
    referralType: 'VENDOR',
  })
    .populate('referredUserId', 'name email phone referralCode status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Fetch store names for referred vendors
  const referredUserIds = referrals.map((r) => r.referredUserId?._id).filter(Boolean);
  const vendorStores = await Vendor.find({ userId: { $in: referredUserIds } }).select('userId storeName');
  const storeMap = new Map();
  vendorStores.forEach((v) => storeMap.set(v.userId.toString(), v.storeName));

  let totalVendorsReferred = referrals.length;
  let qualifiedReferrals = 0;
  let pendingCommissions = 0;
  let earnedCommissions = 0;
  let paidCommissions = 0;

  const history = referrals.map((r) => {
    if (r.qualificationStatus === 'QUALIFIED') qualifiedReferrals++;
    if (r.commissionStatus === 'PENDING') pendingCommissions += r.commissionAmount || 0;
    if (r.commissionStatus === 'PAID') {
      earnedCommissions += r.commissionAmount || 0;
      paidCommissions += r.commissionAmount || 0;
    }

    return {
      id: r._id,
      referredVendorName: r.referredUserId?.name || 'Referred Vendor',
      storeName: r.referredUserId ? storeMap.get(r.referredUserId._id.toString()) || '' : '',
      referralCode: r.referredUserId?.referralCode || '',
      planPurchased: r.planName || 'Vendor Subscription',
      subscriptionAmount: r.subscriptionAmount || 0,
      commissionRate: r.commissionRate || 10,
      commissionEarned: r.commissionAmount || 0,
      qualificationStatus: r.qualificationStatus,
      commissionStatus: r.commissionStatus,
      referralDate: r.createdAt,
      qualifiedAt: r.qualifiedAt,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalVendorsReferred,
          qualifiedReferrals,
          pendingCommissions,
          earnedCommissions,
          paidCommissions,
          commissionRate: '10%',
        },
        referralHistory: history,
      },
      'Vendor referral metrics retrieved successfully'
    )
  );
});

// ===============================================================
// 6. CUSTOMER DASHBOARD: "Refer & Earn Super Coins"
// ===============================================================
export const getCustomerDashboard = asyncWrapper(async (req, res) => {
  const user = req.user;

  // Ensure referralCode exists
  if (!user.referralCode) {
    user.referralCode = User.generateReferralCode(user.name, 'CUSTOMER');
    await user.save();
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const referralLink = `${clientUrl}/register?ref=${user.referralCode}`;

  const [referrals, wallet] = await Promise.all([
    ReferralRelationship.find({
      referrerId: user._id,
      referralType: 'CUSTOMER',
    })
      .populate('referredUserId', 'name email phone referralCode status createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    superCoinService.getOrCreateWallet(user._id),
  ]);

  let totalCustomersReferred = referrals.length;
  let qualifiedReferrals = 0;
  let totalSuperCoinsEarned = 0;

  const history = referrals.map((r) => {
    if (r.qualificationStatus === 'QUALIFIED') qualifiedReferrals++;
    totalSuperCoinsEarned += r.superCoinsAwarded || 0;

    return {
      id: r._id,
      referredCustomerName: r.referredUserId?.name || 'Referred Friend',
      referralCode: r.referredUserId?.referralCode || '',
      qualificationStatus: r.qualificationStatus,
      superCoinsAwarded: r.superCoinsAwarded || 0,
      rewardTransactionId: r.rewardTransactionId || '',
      referralDate: r.createdAt,
      qualifiedAt: r.qualifiedAt,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalCustomersReferred,
          qualifiedReferrals,
          totalSuperCoinsEarned,
          currentSuperCoinsBalance: wallet.balance,
          rewardPerReferral: 500,
        },
        referralHistory: history,
      },
      'Customer referral metrics retrieved successfully'
    )
  );
});
