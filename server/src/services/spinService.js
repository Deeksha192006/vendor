import { SpinWheel } from '../models/SpinWheel.js';
import { SpinHistory } from '../models/SpinHistory.js';
import { SpinAttempt } from '../models/SpinAttempt.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { fairCoinService } from './fairCoinService.js';
import { superCoinService } from './superCoinService.js';
import { premiumService } from './premiumService.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const spinService = {
  async getActiveWheel() {
    let wheel = await SpinWheel.findOne({ isActive: true });

    // Seed default spin wheel with EXACTLY 5 DIVISIONS (3 Fair Coins + 2 Products) if none exists
    if (!wheel) {
      const sampleProducts = await Product.find({ status: 'APPROVED' }).limit(2);

      wheel = await SpinWheel.create({
        title: 'Daily FairKart Spin & Win',
        description: 'Spin the wheel every day to win instant Fair Coins & Exclusive Products!',
        isActive: true,
        requiresPremium: false,
        dailySpinsPerUser: 1,
        coinsRequiredPerSpin: 0,
        rewards: [
          {
            title: '100 FAIR COINS',
            type: 'FAIR_COINS',
            value: 100,
            probability: 25,
            color: '#eab308',
            icon: 'coins',
          },
          {
            title: '200 FAIR COINS',
            type: 'FAIR_COINS',
            value: 200,
            probability: 20,
            color: '#ca8a04',
            icon: 'coins',
          },
          {
            title: '500 FAIR COINS',
            type: 'FAIR_COINS',
            value: 500,
            probability: 15,
            color: '#fde047',
            icon: 'coins',
          },
          {
            title: sampleProducts[0] ? sampleProducts[0].name : 'Wireless Headphones',
            type: 'PRODUCT',
            value: 0,
            productId: sampleProducts[0] ? sampleProducts[0]._id : null,
            productTitle: sampleProducts[0] ? sampleProducts[0].name : 'Wireless Headphones',
            productImage: sampleProducts[0]?.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
            probability: 20,
            color: '#15803d',
            icon: 'package',
          },
          {
            title: sampleProducts[1] ? sampleProducts[1].name : 'Smart Watch',
            type: 'PRODUCT',
            value: 0,
            productId: sampleProducts[1] ? sampleProducts[1]._id : null,
            productTitle: sampleProducts[1] ? sampleProducts[1].name : 'Smart Watch',
            productImage: sampleProducts[1]?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
            probability: 20,
            color: '#166534',
            icon: 'package',
          },
        ],
      });
    }

    return wheel;
  },

  async checkUserEligibility(userId, wheel) {
    const isPremium = await premiumService.isCustomerPremium(userId);

    if (isPremium) {
      // VIP Pass Premium Members get Daily Spins
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todaySpinsCount = await SpinHistory.countDocuments({
        userId,
        wheelId: wheel._id,
        createdAt: { $gte: startOfDay },
      });

      const spinsRemaining = Math.max(0, (wheel.dailySpinsPerUser || 1) - todaySpinsCount);

      return {
        isPremium: true,
        eligible: spinsRemaining > 0,
        spinsRemaining,
        todaySpinsCount,
        spinPeriod: 'DAILY',
        message: spinsRemaining > 0
          ? `⭐ VIP Pass Premium: ${spinsRemaining} free spin available today!`
          : '⭐ VIP Pass Premium: Daily spin limit reached. Come back tomorrow!',
      };
    } else {
      // Non-Premium Customers get ONLY 1 Spin per Month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthSpinsCount = await SpinHistory.countDocuments({
        userId,
        wheelId: wheel._id,
        createdAt: { $gte: startOfMonth },
      });

      const spinsRemaining = monthSpinsCount < 1 ? 1 : 0;

      return {
        isPremium: false,
        eligible: spinsRemaining > 0,
        spinsRemaining,
        monthSpinsCount,
        spinPeriod: 'MONTHLY',
        message: spinsRemaining > 0
          ? '🔒 Regular Member: 1 free spin available for this month. Upgrade to VIP Pass for Daily Spins!'
          : '🔒 Monthly Spin Limit Reached: Non-premium members get only 1 spin per month. Upgrade to VIP Pass for Daily Spins!',
      };
    }
  },

  selectWeightedReward(rewards) {
    const totalWeight = rewards.reduce((sum, r) => sum + (r.probability || 0), 0);
    if (totalWeight <= 0) return { reward: rewards[0], index: 0 };
    
    let random = Math.random() * totalWeight;

    for (let i = 0; i < rewards.length; i++) {
      if (random < rewards[i].probability) {
        return { reward: rewards[i], index: i };
      }
      random -= rewards[i].probability;
    }

    return { reward: rewards[0], index: 0 };
  },

  async processSpin(userId, idempotencyKey) {
    if (!idempotencyKey) throw new ApiError(400, 'Idempotency key is required', ERROR_CODES.BAD_REQUEST);

    const wheel = await this.getActiveWheel();
    
    let attempt;
    try {
      attempt = await SpinAttempt.create({
        userId,
        wheelId: wheel._id,
        idempotencyKey
      });
    } catch (e) {
      if (e.code === 11000) {
        throw new ApiError(409, 'Duplicate spin request detected. Please refresh.', ERROR_CODES.CONFLICT);
      }
      throw e;
    }

    try {
      const { eligible, isPremium } = await this.checkUserEligibility(userId, wheel);

      if (!eligible) {
        attempt.status = 'FAILED';
        await attempt.save();
        if (!isPremium) {
          throw new ApiError(
            403,
            'Non-premium customers get only 1 free spin per month. Upgrade to VIP Pass Premium to unlock daily spins!',
            ERROR_CODES.FORBIDDEN
          );
        } else {
          throw new ApiError(400, 'Daily spin limit reached for your VIP Pass. Please try again tomorrow!', ERROR_CODES.BAD_REQUEST);
        }
      }

      if (wheel.coinsRequiredPerSpin > 0) {
        const currentUser = await User.findById(userId);
        if (!currentUser || currentUser.fairCoinBalance < wheel.coinsRequiredPerSpin) {
          attempt.status = 'FAILED';
          await attempt.save();
          throw new ApiError(400, `Insufficient Fair Coins. You need ${wheel.coinsRequiredPerSpin} Fair Coins to spin.`, ERROR_CODES.BAD_REQUEST);
        }

        await fairCoinService.debitCoins({
          userId,
          amount: wheel.coinsRequiredPerSpin,
          type: 'DEBIT',
          source: 'SPIN_WHEEL_FEE',
          description: `Used ${wheel.coinsRequiredPerSpin} Fair Coins for Daily Spin`,
        });
      }

      const { reward, index } = this.selectWeightedReward(wheel.rewards);

      const history = await SpinHistory.create({
        userId,
        wheelId: wheel._id,
        rewardId: reward._id,
        rewardTitle: reward.title,
        rewardType: reward.type,
        rewardValue: reward.value,
        productId: reward.productId || null,
        productTitle: reward.productTitle || reward.title,
        productImage: reward.productImage || '',
        probabilitySnapshot: reward.probability,
      });

      attempt.status = 'COMPLETED';
      attempt.rewardId = reward._id;
      await attempt.save();

      if (reward.type === 'FAIR_COINS' && reward.value > 0) {
        await fairCoinService.creditCoins({
          userId,
          amount: reward.value,
          type: 'SPIN_REWARD',
          source: 'SPIN_WHEEL',
          referenceId: history._id.toString(),
          description: `Won ${reward.value} Fair Coins on Daily Spin`,
        });
      }

      if (reward.type === 'SUPER_COINS' && reward.value > 0) {
        await superCoinService.creditCoins({
          userId,
          amount: reward.value,
          type: 'SPIN_REWARD',
          source: 'SPIN_WHEEL',
          referenceId: history._id.toString(),
          description: `Won ${reward.value} Super Coins on Daily Spin`,
        });
      }

      try {
        await notificationService.createNotification({
          userId,
          title: 'Spin Wheel Prize Won!',
          message: reward.type === 'PRODUCT' 
            ? `🎁 Congratulations! You won a product: ${reward.productTitle || reward.title}!`
            : `🎉 Congratulations! You won: ${reward.title}`,
          type: 'SPIN_REWARD',
          link: '/customer/rewards'
        }, { dedupeKey: `${history._id.toString()}:SPIN_REWARD` });
      } catch (err) {
        console.error('Failed to notify spin reward:', err);
      }

      const updatedUser = await User.findById(userId).select('fairCoinBalance superCoinBalance');

      return {
        winningSegmentIndex: index,
        reward: {
          title: reward.title,
          type: reward.type,
          value: reward.value,
          color: reward.color,
          productId: reward.productId,
          productTitle: reward.productTitle || reward.title,
          productImage: reward.productImage,
        },
        historyId: history._id,
        newCoinBalance: updatedUser ? updatedUser.fairCoinBalance : 0,
        newSuperCoinBalance: updatedUser ? updatedUser.superCoinBalance : 0,
      };
    } catch (e) {
      if (attempt.status === 'PENDING') {
        attempt.status = 'FAILED';
        await attempt.save();
      }
      throw e;
    }
  },

  async getSuperAdminWheelConfig() {
    const wheel = await this.getActiveWheel();
    const products = await Product.find({ status: 'APPROVED' })
      .select('_id name price images category brand')
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      wheel,
      availableProducts: products,
    };
  },

  async updateSuperAdminWheelConfig(configData) {
    const { title, description, dailySpinsPerUser, coinsRequiredPerSpin, isActive, rewards } = configData;

    if (!rewards || !Array.isArray(rewards) || rewards.length !== 5) {
      throw new ApiError(400, 'Spin Wheel must consist of EXACTLY 5 divisions/segments.', ERROR_CODES.BAD_REQUEST);
    }

    const fairCoinsCount = rewards.filter(r => r.type === 'FAIR_COINS').length;
    const productCount = rewards.filter(r => r.type === 'PRODUCT').length;

    if (fairCoinsCount !== 3 || productCount !== 2) {
      throw new ApiError(
        400,
        `Spin Wheel must consist of exactly 3 Fair Coins segments and 2 Product segments. (Received: ${fairCoinsCount} Fair Coins, ${productCount} Products)`,
        ERROR_CODES.BAD_REQUEST
      );
    }

    let wheel = await SpinWheel.findOne({ isActive: true });
    if (!wheel) {
      wheel = new SpinWheel();
    }

    if (title !== undefined) wheel.title = title;
    if (description !== undefined) wheel.description = description;
    if (dailySpinsPerUser !== undefined) wheel.dailySpinsPerUser = Number(dailySpinsPerUser);
    if (coinsRequiredPerSpin !== undefined) wheel.coinsRequiredPerSpin = Number(coinsRequiredPerSpin);
    if (isActive !== undefined) wheel.isActive = Boolean(isActive);

    wheel.rewards = rewards.map(r => ({
      title: r.title || (r.type === 'FAIR_COINS' ? `${r.value} FAIR COINS` : r.productTitle || 'Product Reward'),
      type: r.type,
      value: r.type === 'FAIR_COINS' ? Number(r.value || 0) : 0,
      productId: r.productId || null,
      productTitle: r.productTitle || r.title || '',
      productImage: r.productImage || '',
      probability: Number(r.probability || 20),
      color: r.color || '#eab308',
      icon: r.type === 'FAIR_COINS' ? 'coins' : 'package',
    }));

    await wheel.save();
    return wheel;
  },
};

