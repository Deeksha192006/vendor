import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { fairCoinService } from '../services/fairCoinService.js';
import { superCoinService } from '../services/superCoinService.js';

/**
 * Calendar month calculation helper
 * For month-based plans, uses true calendar-month math
 */
export function calculateCalendarExpiry(startDate, durationValue, durationUnit) {
  const start = new Date(startDate || Date.now());
  const expiry = new Date(start);
  const val = Number(durationValue) || 1;
  const unit = (durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    const currentDay = expiry.getDate();
    expiry.setMonth(expiry.getMonth() + val);
    // If the month overflowed (e.g. Jan 31 + 1 month -> March 3), snap to last day of Feb
    if (expiry.getDate() !== currentDay) {
      expiry.setDate(0);
    }
  } else if (unit.startsWith('year')) {
    expiry.setFullYear(expiry.getFullYear() + val);
  } else if (unit.startsWith('day')) {
    expiry.setDate(expiry.getDate() + val);
  } else {
    expiry.setMonth(expiry.getMonth() + val);
  }

  return expiry;
}

/**
 * Seed 4 default customer plans if none exist
 */
async function ensureDefaultCustomerPlans() {
  const count = await CustomerSubscriptionPlan.countDocuments({ isDeleted: { $ne: true } });
  if (count === 0) {
    const defaultPlans = [
      {
        name: 'Monthly Plan',
        code: 'BAAPOO_MONTHLY',
        planType: 'Monthly',
        durationValue: 1,
        durationUnit: 'months',
        price: 199,
        discount: 0,
        description: '30 Days of BAAPOO MART VIP privileges, zero shipping charges & bonus Fair Coins.',
        benefits: [
          'Free Standard Delivery on All Orders',
          'Earn 2x Fair Coins on Marketplace Purchases',
          'Exclusive Daily Spin Wheel Access',
          'Priority Customer Support 24/7'
        ],
        badge: '',
        status: 'Active',
        rewardRules: { coinsOnSubscribe: 100 }
      },
      {
        name: 'Quarterly Plan',
        code: 'BAAPOO_QUARTERLY',
        planType: 'Quarterly',
        durationValue: 3,
        durationUnit: 'months',
        price: 499,
        discount: 50,
        description: '90 Days of full VIP access, seasonal festival discounts & multiplier rewards.',
        benefits: [
          'Free Express Delivery Across India',
          'Earn 3x Fair Coins on All Categories',
          'Daily Spin Wheel with Guaranteed Wins',
          'Early Bird Access to Mega Flash Sales',
          'Zero Platform & Handling Fees'
        ],
        badge: 'Popular',
        status: 'Active',
        rewardRules: { coinsOnSubscribe: 350 }
      },
      {
        name: 'Half-Yearly Plan',
        code: 'BAAPOO_HALF_YEARLY',
        planType: 'Half-Yearly',
        durationValue: 6,
        durationUnit: 'months',
        price: 899,
        discount: 100,
        description: '6 Months of top-tier benefits, partner merchant privileges & mega cashback.',
        benefits: [
          'Free Express Delivery with No Minimum Order',
          'Earn 4x Fair Coins on All Purchases',
          'Extra 5% Discount on BAAPOO MART Verified Sellers',
          'Instant Returns & Priority Refund Processing',
          'VIP Birthday Bonus Coin Drop'
        ],
        badge: '',
        status: 'Active',
        rewardRules: { coinsOnSubscribe: 750 }
      },
      {
        name: 'Annual Plan',
        code: 'BAAPOO_ANNUAL',
        planType: 'Annual',
        durationValue: 12,
        durationUnit: 'months',
        price: 1499,
        discount: 300,
        description: 'Ultimate 365-day pass with maximum savings, exclusive gifts & VIP perks.',
        benefits: [
          'Unlimited Free Priority Shipping All Year',
          'Earn 5x Fair Coins & Super Coins Everywhere',
          'Dedicated VIP Account Concierge',
          'Exclusive Invite to Member-Only Deals',
          'Complimentary Welcome Gift Box',
          'Highest Spin Wheel Reward Tier'
        ],
        badge: 'Best Value',
        status: 'Active',
        rewardRules: { coinsOnSubscribe: 1800 }
      }
    ];

    for (const p of defaultPlans) {
      await CustomerSubscriptionPlan.create(p);
    }
  }
}

// =========================================================================
// 1. SUPER ADMIN / ADMIN ENDPOINTS
// =========================================================================

/**
 * GET /api/admin/subscription-plans
 * Lists Customer Subscription Plans with subscriber counts and dashboard summary stats
 */
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const { entityType, status, search, sortBy } = req.query;

    // Backward-compatibility: If specifically querying vendor entity type, return vendor plans
    if (entityType === 'VENDOR') {
      const vPlans = await SubscriptionPlan.find({ applicableEntityType: 'VENDOR' }).sort({ displayOrder: 1, createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: { plans: vPlans }
      });
    }

    // Ensure default plans exist
    await ensureDefaultCustomerPlans();

    // Query for customer subscription plans
    const query = { isDeleted: { $ne: true } };

    if (status && status !== 'all' && status !== 'All') {
      if (status.toLowerCase() === 'active') {
        query.status = { $in: ['Active', 'ACTIVE'] };
      } else if (status.toLowerCase() === 'inactive') {
        query.status = { $in: ['Inactive', 'INACTIVE'] };
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { planType: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOptions = { price: 1 };
    if (sortBy === 'price_desc') sortOptions = { price: -1 };
    if (sortBy === 'duration') sortOptions = { durationValue: 1 };

    const rawPlans = await CustomerSubscriptionPlan.find(query).sort(sortOptions);

    // Compute subscriber counts per plan
    const subscriberCounts = await CustomerSubscription.aggregate([
      {
        $match: {
          $or: [
            { subscriptionStatus: { $in: ['Active', 'ACTIVE'] } },
            { status: { $in: ['Active', 'ACTIVE'] } }
          ],
          $or: [
            { expiryDate: { $gt: new Date() } },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    subscriberCounts.forEach((item) => {
      if (item._id) countMap[item._id.toString()] = item.count;
    });

    const plans = rawPlans.map((p) => {
      const obj = p.toObject();
      obj.subscribers = countMap[p._id.toString()] || 0;
      obj.isActive = obj.status === 'Active' || obj.status === 'ACTIVE';
      return obj;
    });

    // Summary Statistics
    const [totalPlans, activePlans, inactivePlans, totalActiveSubscriptions] = await Promise.all([
      CustomerSubscriptionPlan.countDocuments({ isDeleted: { $ne: true } }),
      CustomerSubscriptionPlan.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['Active', 'ACTIVE'] } }),
      CustomerSubscriptionPlan.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['Inactive', 'INACTIVE'] } }),
      CustomerSubscription.countDocuments({
        $or: [
          { subscriptionStatus: { $in: ['Active', 'ACTIVE'] } },
          { status: { $in: ['Active', 'ACTIVE'] } }
        ],
        $or: [
          { expiryDate: { $gt: new Date() } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
    ]);

    const stats = {
      totalPlans,
      activePlans,
      inactivePlans,
      totalActiveSubscriptions
    };

    return res.status(200).json({
      success: true,
      data: {
        plans,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/subscription-plans
 * Create a new Customer Subscription Plan
 */
export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const {
      name,
      planType = 'Custom',
      durationValue,
      durationUnit = 'months',
      price,
      discount = 0,
      description = '',
      benefits = [],
      badge = '',
      status = 'Active',
      code
    } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Plan Name is required', ERROR_CODES.BAD_REQUEST);
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new ApiError(400, 'Price must be a valid positive number in ₹', ERROR_CODES.BAD_REQUEST);
    }

    const parsedDuration = Number(durationValue);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      throw new ApiError(400, 'Duration must be greater than 0', ERROR_CODES.BAD_REQUEST);
    }

    const parsedDiscount = Math.max(0, Number(discount) || 0);

    // Auto-generate unique code if not given
    let generatedCode = code ? code.toUpperCase().trim() : '';
    if (!generatedCode) {
      const sanitizedName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);
      generatedCode = `PLAN_${sanitizedName}_${Date.now().toString().slice(-4)}`;
    }

    // Ensure benefits is an array
    let parsedBenefits = [];
    if (Array.isArray(benefits)) {
      parsedBenefits = benefits.map((b) => String(b).trim()).filter(Boolean);
    } else if (typeof benefits === 'string') {
      parsedBenefits = benefits.split('\n').map((b) => b.trim()).filter(Boolean);
    }

    const plan = await CustomerSubscriptionPlan.create({
      name: name.trim(),
      code: generatedCode,
      planType,
      durationValue: parsedDuration,
      durationUnit: durationUnit.toLowerCase(),
      price: parsedPrice,
      discount: parsedDiscount,
      description: description.trim(),
      benefits: parsedBenefits,
      badge: badge.trim(),
      status: status === 'Inactive' || status === 'INACTIVE' ? 'Inactive' : 'Active',
      createdBy: req.user?._id || null
    });

    return res.status(201).json({
      success: true,
      message: 'Customer subscription plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/subscription-plans/:id
 * Edit an existing Customer Subscription Plan
 */
export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      planType,
      durationValue,
      durationUnit,
      price,
      discount,
      description,
      benefits,
      badge,
      status
    } = req.body;

    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan || plan.isDeleted) {
      throw new ApiError(404, 'Subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    if (name !== undefined) {
      if (!name.trim()) throw new ApiError(400, 'Plan Name cannot be empty', ERROR_CODES.BAD_REQUEST);
      plan.name = name.trim();
    }

    if (planType !== undefined) plan.planType = planType;

    if (durationValue !== undefined) {
      const dVal = Number(durationValue);
      if (isNaN(dVal) || dVal <= 0) throw new ApiError(400, 'Duration must be greater than 0', ERROR_CODES.BAD_REQUEST);
      plan.durationValue = dVal;
    }

    if (durationUnit !== undefined) plan.durationUnit = durationUnit.toLowerCase();

    if (price !== undefined) {
      const pVal = Number(price);
      if (isNaN(pVal) || pVal < 0) throw new ApiError(400, 'Price must be 0 or greater', ERROR_CODES.BAD_REQUEST);
      plan.price = pVal;
    }

    if (discount !== undefined) {
      plan.discount = Math.max(0, Number(discount) || 0);
    }

    if (description !== undefined) plan.description = description.trim();

    if (benefits !== undefined) {
      if (Array.isArray(benefits)) {
        plan.benefits = benefits.map((b) => String(b).trim()).filter(Boolean);
      } else if (typeof benefits === 'string') {
        plan.benefits = benefits.split('\n').map((b) => b.trim()).filter(Boolean);
      }
    }

    if (badge !== undefined) plan.badge = badge.trim();

    if (status !== undefined) {
      plan.status = status === 'Inactive' || status === 'INACTIVE' ? 'Inactive' : 'Active';
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH or PUT /api/admin/subscription-plans/:id/status
 * Activate or Deactivate a Customer Subscription Plan
 */
export const togglePlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan || plan.isDeleted) {
      throw new ApiError(404, 'Subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    let targetStatus = 'Active';
    if (status !== undefined) {
      targetStatus = status === 'Inactive' || status === 'INACTIVE' ? 'Inactive' : 'Active';
    } else if (isActive !== undefined) {
      targetStatus = isActive ? 'Active' : 'Inactive';
    } else {
      // Toggle current
      targetStatus = (plan.status === 'Active' || plan.status === 'ACTIVE') ? 'Inactive' : 'Active';
    }

    plan.status = targetStatus;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: `Subscription plan ${targetStatus.toLowerCase()}d successfully`,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/subscription-plans/:id
 * Safe deletion of a Customer Subscription Plan
 */
export const deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan || plan.isDeleted) {
      throw new ApiError(404, 'Subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if any customer subscriptions exist for this plan
    const subCount = await CustomerSubscription.countDocuments({ planId: plan._id });

    if (subCount > 0) {
      // Soft-delete to preserve all historical records
      plan.isDeleted = true;
      plan.status = 'Inactive';
      await plan.save();

      return res.status(200).json({
        success: true,
        message: `Plan "${plan.name}" has ${subCount} associated subscription records. It has been deactivated and archived safely without deleting subscriber history.`,
        data: { plan, softDeleted: true }
      });
    }

    // Permanent delete if never subscribed
    await CustomerSubscriptionPlan.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Plan "${plan.name}" deleted successfully`,
      data: { plan, softDeleted: false }
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. CUSTOMER-FACING SUBSCRIPTION ENDPOINTS
// =========================================================================

/**
 * GET /api/subscription-plans/active (or /api/customer/subscription/plans)
 * Returns all active customer subscription plans
 */
export const getActiveCustomerPlans = async (req, res, next) => {
  try {
    await ensureDefaultCustomerPlans();

    const plans = await CustomerSubscriptionPlan.find({
      isDeleted: { $ne: true },
      status: { $in: ['Active', 'ACTIVE'] }
    }).sort({ price: 1, displayOrder: 1 });

    return res.status(200).json(
      new ApiResponse(200, { plans }, 'Active subscription plans retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/subscription
 * Get customer's current active subscription with expiry date
 */
export const getCustomerSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // First auto-expire any past-due subscriptions for this customer
    await CustomerSubscription.updateMany(
      {
        customerId: userId,
        $or: [
          { subscriptionStatus: { $in: ['Active', 'ACTIVE'] } },
          { status: { $in: ['Active', 'ACTIVE'] } }
        ],
        $or: [
          { expiryDate: { $lte: new Date() } },
          { expiresAt: { $lte: new Date() } }
        ]
      },
      {
        $set: {
          subscriptionStatus: 'Expired',
          status: 'EXPIRED'
        }
      }
    );

    // Fetch active subscription
    const activeSub = await CustomerSubscription.findOne({
      customerId: userId,
      $or: [
        { subscriptionStatus: { $in: ['Active', 'ACTIVE'] } },
        { status: { $in: ['Active', 'ACTIVE'] } }
      ],
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('planId');

    const isSubscribed = !!activeSub;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isSubscribed,
          isPremium: isSubscribed, // backwards compatibility
          subscription: activeSub
        },
        'Customer subscription status retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/subscription/checkout
 * Subscribe to an active Customer Subscription Plan
 */
export const checkoutCustomerSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { planId, paymentMethod = 'GATEWAY', transactionId, razorpayPaymentId } = req.body;

    if (!planId) {
      throw new ApiError(400, 'planId is required', ERROR_CODES.BAD_REQUEST);
    }

    const plan = await CustomerSubscriptionPlan.findById(planId);
    if (!plan || plan.isDeleted || (plan.status !== 'Active' && plan.status !== 'ACTIVE')) {
      throw new ApiError(400, 'The selected subscription plan is inactive or unavailable for purchase', ERROR_CODES.BAD_REQUEST);
    }

    // Deactivate previous active customer subscriptions
    await CustomerSubscription.updateMany(
      {
        customerId: userId,
        $or: [
          { subscriptionStatus: { $in: ['Active', 'ACTIVE'] } },
          { status: { $in: ['Active', 'ACTIVE'] } }
        ]
      },
      {
        $set: {
          subscriptionStatus: 'Cancelled',
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      }
    );

    // Calculate dates using true calendar-month math
    const startDate = new Date();
    const expiryDate = calculateCalendarExpiry(startDate, plan.durationValue, plan.durationUnit);

    const generatedTxId = transactionId || razorpayPaymentId || `TXN-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const netPrice = Math.max(0, plan.price - (plan.discount || 0));

    const durationLabel = `${plan.durationValue} ${plan.durationUnit}`;

    const subscription = await CustomerSubscription.create({
      customerId: userId,
      planId: plan._id,
      planNameSnapshot: plan.name,
      planPriceSnapshot: netPrice,
      durationSnapshot: {
        value: plan.durationValue,
        unit: plan.durationUnit,
        planType: plan.planType,
        label: durationLabel
      },
      startDate,
      expiryDate,
      startedAt: startDate,
      expiresAt: expiryDate,
      paymentStatus: 'Paid',
      subscriptionStatus: 'Active',
      status: 'ACTIVE',
      transactionId: generatedTxId,
      paymentId: generatedTxId,
      planSnapshot: plan.toObject()
    });

    // Credit promotional bonus coins if configured
    if (plan.rewardRules?.coinsOnSubscribe > 0) {
      try {
        await fairCoinService.creditCoins({
          userId,
          amount: plan.rewardRules.coinsOnSubscribe,
          type: 'BONUS',
          source: 'CUSTOMER_SUBSCRIPTION_BONUS',
          referenceId: subscription._id.toString(),
          description: `VIP Subscription Bonus Coins: ${plan.name}`
        });
      } catch (coinErr) {
        console.error('Failed to credit bonus coins on subscription:', coinErr);
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscription,
          isSubscribed: true,
          isPremium: true
        },
        `Congratulations! You are now subscribed to ${plan.name}. Valid until ${expiryDate.toLocaleDateString('en-IN')}.`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/subscription/history
 * Get customer's subscription history
 */
export const getCustomerSubscriptionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const history = await CustomerSubscription.find({ customerId: userId })
      .sort({ createdAt: -1 })
      .populate('planId');

    return res.status(200).json(
      new ApiResponse(200, { history }, 'Subscription history retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};
