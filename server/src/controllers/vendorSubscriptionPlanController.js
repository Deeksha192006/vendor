import { VendorSubscriptionPlan } from '../models/VendorSubscriptionPlan.js';
import { VendorSubscription } from '../models/VendorSubscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Vendor } from '../models/Vendor.js';
import { Payment } from '../models/Payment.js';
import { mlmRewardService } from '../services/mlmRewardService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

/**
 * Helper to calculate calendar-month expiry date
 * Ensures month additions use true calendar days (e.g. Jan 31 + 1 mo = Feb 28/29)
 */
export function calculateCalendarExpiry(startDate, durationValue, durationUnit) {
  const start = new Date(startDate || Date.now());
  const expiry = new Date(start);
  const val = Number(durationValue) || 1;
  const unit = (durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    const currentDay = expiry.getDate();
    expiry.setMonth(expiry.getMonth() + val);
    // Snap overflow days to the last day of target month
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
 * Seed the 4 default vendor subscription plans if none exist in the database
 */
export async function ensureDefaultVendorPlans() {
  const count = await VendorSubscriptionPlan.countDocuments({ isDeleted: { $ne: true } });
  if (count === 0) {
    const defaultPlans = [
      {
        name: 'Monthly Vendor Plan',
        code: 'VENDOR_MONTHLY',
        planType: 'Monthly',
        durationValue: 1,
        durationUnit: 'months',
        price: 999,
        discount: 0,
        description: 'Starter tier for emerging merchants with catalog allowance and standard analytics.',
        benefits: [
          'Catalog Allowance: Up to 50 Active Products',
          'Standard Order & Inventory Management Dashboard',
          'Standard Payout & Settlement Clearance',
          'Ticket & Email Merchant Support',
          'Access to Basic Store Analytics'
        ],
        featureLimits: {
          maxProducts: 50,
          analyticsAccess: true,
          prioritySupport: false,
          promotionalPlacement: false,
          storeCustomization: false,
          orderManagementTools: true
        },
        badge: '',
        status: 'Active',
        displayOrder: 1
      },
      {
        name: 'Quarterly Vendor Plan',
        code: 'VENDOR_QUARTERLY',
        planType: 'Quarterly',
        durationValue: 3,
        durationUnit: 'months',
        price: 2699,
        discount: 300,
        description: 'Growth tier with increased product allowance, promotional highlights, and priority support.',
        benefits: [
          'Catalog Allowance: Up to 150 Active Products',
          'Priority Fast-Track Support (12h SLA)',
          'Detailed Sales & Revenue Analytics Reports',
          'Promotional Seller Badge on Storefront',
          'Zero Platform Listing & Setup Fees'
        ],
        featureLimits: {
          maxProducts: 150,
          analyticsAccess: true,
          prioritySupport: true,
          promotionalPlacement: true,
          storeCustomization: false,
          orderManagementTools: true
        },
        badge: 'Popular',
        status: 'Active',
        displayOrder: 2
      },
      {
        name: 'Half-Yearly Vendor Plan',
        code: 'VENDOR_HALF_YEARLY',
        planType: 'Half-Yearly',
        durationValue: 6,
        durationUnit: 'months',
        price: 4999,
        discount: 1000,
        description: 'Pro merchant tier featuring homepage spotlight placements, store branding, and 24/7 assistance.',
        benefits: [
          'Catalog Allowance: Up to 500 Active Products',
          'Priority Search Results & Flash Sale Inclusions',
          '24/7 Dedicated Account Manager',
          'Storefront Custom Banner & Branding Tools',
          'Automated Order Dispatch & Manifest Generation'
        ],
        featureLimits: {
          maxProducts: 500,
          analyticsAccess: true,
          prioritySupport: true,
          promotionalPlacement: true,
          storeCustomization: true,
          orderManagementTools: true
        },
        badge: '',
        status: 'Active',
        displayOrder: 3
      },
      {
        name: 'Annual Vendor Plan',
        code: 'VENDOR_ANNUAL',
        planType: 'Annual',
        durationValue: 12,
        durationUnit: 'months',
        price: 8999,
        discount: 3000,
        description: 'VIP merchant flagship plan with unlimited listings, highest search ranking, and maximum fee savings.',
        benefits: [
          'Unlimited Active Product Listings',
          'Gold Verified VIP Merchant Badge',
          'Featured Showcase on BAAPOO MART Home & Category Hubs',
          'Fastest Priority Payout & Settlement Processing',
          'Direct Phone Support & Merchant Growth Advisory'
        ],
        featureLimits: {
          maxProducts: 0, // 0 = Unlimited
          analyticsAccess: true,
          prioritySupport: true,
          promotionalPlacement: true,
          storeCustomization: true,
          orderManagementTools: true
        },
        badge: 'Best Value',
        status: 'Active',
        displayOrder: 4
      }
    ];

    await VendorSubscriptionPlan.insertMany(defaultPlans);
    console.log('[VendorSubscription] Seeded 4 default vendor subscription plans successfully.');
  }
}

/**
 * Helper to resolve the vendor document for an authenticated user
 */
export async function getVendorForUser(user) {
  let vendor = await Vendor.findOne({ userId: user._id });
  if (!vendor && user.email) {
    vendor = await Vendor.findOne({ email: user.email.toLowerCase() });
  }
  return vendor;
}

// ==========================================
// SUPER ADMIN CONTROLLERS
// ==========================================

/**
 * Super Admin: Get all vendor subscription plans with subscriber counts and KPI cards
 */
export const getAdminVendorSubscriptionPlans = async (req, res, next) => {
  try {
    await ensureDefaultVendorPlans();

    const { status, search } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const plans = await VendorSubscriptionPlan.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const now = new Date();

    // Calculate plan-level metrics
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const totalSubscribers = await VendorSubscription.countDocuments({
          planId: plan._id,
        });
        const activeSubscribers = await VendorSubscription.countDocuments({
          planId: plan._id,
          subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
          expiryDate: { $gt: now },
        });

        return {
          ...plan,
          id: plan._id,
          totalSubscribers,
          activeSubscribers,
        };
      })
    );

    // Calculate Summary Metrics
    const totalPlans = await VendorSubscriptionPlan.countDocuments({ isDeleted: { $ne: true } });
    const activePlans = await VendorSubscriptionPlan.countDocuments({
      status: { $in: ['Active', 'ACTIVE'] },
      isDeleted: { $ne: true },
    });
    const inactivePlans = totalPlans - activePlans;

    const totalActiveSubscriptions = await VendorSubscription.countDocuments({
      subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      expiryDate: { $gt: now },
    });

    const activeVendorsList = await VendorSubscription.distinct('vendorId', {
      subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      expiryDate: { $gt: now },
    });
    const totalVendorsWithActiveSubscriptions = activeVendorsList.length;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          plans: plansWithCounts,
          summary: {
            totalPlans,
            activePlans,
            inactivePlans,
            totalActiveSubscriptions,
            totalVendorsWithActiveSubscriptions,
          },
        },
        'Vendor subscription plans retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Create a new vendor subscription plan
 */
export const createAdminVendorSubscriptionPlan = async (req, res, next) => {
  try {
    const {
      name,
      code,
      planType = 'Monthly',
      durationValue = 1,
      durationUnit = 'months',
      price,
      discount = 0,
      description = '',
      benefits = [],
      featureLimits = {},
      badge = '',
      status = 'Active',
      displayOrder = 0,
    } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Plan name is required', ERROR_CODES.BAD_REQUEST);
    }
    if (price === undefined || price === null || Number(price) < 0) {
      throw new ApiError(400, 'Valid subscription price is required', ERROR_CODES.BAD_REQUEST);
    }
    if (!durationValue || Number(durationValue) <= 0) {
      throw new ApiError(400, 'Valid duration value is required', ERROR_CODES.BAD_REQUEST);
    }

    // Auto-generate unique code if not provided
    const planCode =
      (code && code.trim().toUpperCase()) ||
      `VENDOR_${name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const existingCode = await VendorSubscriptionPlan.findOne({ code: planCode });
    if (existingCode) {
      throw new ApiError(409, `A plan with code "${planCode}" already exists.`, ERROR_CODES.CONFLICT);
    }

    const cleanBenefits = Array.isArray(benefits)
      ? benefits.map((b) => (typeof b === 'string' ? b.trim() : String(b))).filter(Boolean)
      : typeof benefits === 'string'
      ? benefits.split('\n').map((b) => b.trim()).filter(Boolean)
      : [];

    const newPlan = new VendorSubscriptionPlan({
      name: name.trim(),
      code: planCode,
      planType,
      durationValue: Number(durationValue),
      durationUnit: durationUnit.toLowerCase(),
      price: Number(price),
      discount: Number(discount) || 0,
      description: description.trim(),
      benefits: cleanBenefits,
      featureLimits: {
        maxProducts: Number(featureLimits.maxProducts) || 0,
        analyticsAccess: featureLimits.analyticsAccess !== false,
        prioritySupport: Boolean(featureLimits.prioritySupport),
        promotionalPlacement: Boolean(featureLimits.promotionalPlacement),
        storeCustomization: Boolean(featureLimits.storeCustomization),
        orderManagementTools: featureLimits.orderManagementTools !== false,
      },
      badge: badge.trim(),
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      displayOrder: Number(displayOrder) || 0,
      createdBy: req.user?._id || null,
    });

    await newPlan.save();

    return res.status(201).json(
      new ApiResponse(201, { plan: newPlan }, 'Vendor subscription plan created successfully')
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Update an existing vendor subscription plan
 */
export const updateAdminVendorSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await VendorSubscriptionPlan.findById(id);

    if (!plan || plan.isDeleted) {
      throw new ApiError(404, 'Vendor subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    const {
      name,
      planType,
      durationValue,
      durationUnit,
      price,
      discount,
      description,
      benefits,
      featureLimits,
      badge,
      status,
      displayOrder,
    } = req.body;

    if (name !== undefined) plan.name = name.trim();
    if (planType !== undefined) plan.planType = planType;
    if (durationValue !== undefined) plan.durationValue = Number(durationValue);
    if (durationUnit !== undefined) plan.durationUnit = durationUnit.toLowerCase();
    if (price !== undefined) plan.price = Number(price);
    if (discount !== undefined) plan.discount = Number(discount);
    if (description !== undefined) plan.description = description.trim();
    if (badge !== undefined) plan.badge = badge.trim();
    if (status !== undefined) plan.status = status;
    if (displayOrder !== undefined) plan.displayOrder = Number(displayOrder);

    if (benefits !== undefined) {
      plan.benefits = Array.isArray(benefits)
        ? benefits.map((b) => (typeof b === 'string' ? b.trim() : String(b))).filter(Boolean)
        : typeof benefits === 'string'
        ? benefits.split('\n').map((b) => b.trim()).filter(Boolean)
        : [];
    }

    if (featureLimits !== undefined) {
      plan.featureLimits = {
        maxProducts: Number(featureLimits.maxProducts) >= 0 ? Number(featureLimits.maxProducts) : plan.featureLimits.maxProducts,
        analyticsAccess: featureLimits.analyticsAccess !== undefined ? Boolean(featureLimits.analyticsAccess) : plan.featureLimits.analyticsAccess,
        prioritySupport: featureLimits.prioritySupport !== undefined ? Boolean(featureLimits.prioritySupport) : plan.featureLimits.prioritySupport,
        promotionalPlacement: featureLimits.promotionalPlacement !== undefined ? Boolean(featureLimits.promotionalPlacement) : plan.featureLimits.promotionalPlacement,
        storeCustomization: featureLimits.storeCustomization !== undefined ? Boolean(featureLimits.storeCustomization) : plan.featureLimits.storeCustomization,
        orderManagementTools: featureLimits.orderManagementTools !== undefined ? Boolean(featureLimits.orderManagementTools) : plan.featureLimits.orderManagementTools,
      };
    }

    await plan.save();

    return res.status(200).json(
      new ApiResponse(200, { plan }, 'Vendor subscription plan updated successfully')
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Toggle Active/Inactive status for a vendor subscription plan
 */
export const toggleAdminVendorSubscriptionPlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await VendorSubscriptionPlan.findById(id);

    if (!plan || plan.isDeleted) {
      throw new ApiError(404, 'Vendor subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    // Toggle status or set explicit status from body
    if (req.body.status) {
      plan.status = req.body.status;
    } else {
      plan.status = plan.status === 'Active' || plan.status === 'ACTIVE' ? 'Inactive' : 'Active';
    }

    await plan.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { plan },
        `Vendor subscription plan is now ${plan.status}`
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Safe delete vendor subscription plan
 * Soft deletes if existing subscriptions exist, permanent delete otherwise
 */
export const deleteAdminVendorSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await VendorSubscriptionPlan.findById(id);

    if (!plan) {
      throw new ApiError(404, 'Vendor subscription plan not found', ERROR_CODES.NOT_FOUND);
    }

    const hasSubscribers = await VendorSubscription.countDocuments({ planId: id });

    if (hasSubscribers > 0) {
      // Soft deletion: preserve historical transactions & audit integrity
      plan.isDeleted = true;
      plan.status = 'Inactive';
      plan.deletedAt = new Date();
      await plan.save();

      return res.status(200).json(
        new ApiResponse(
          200,
          { plan, isSoftDeleted: true },
          'Plan has existing subscriptions. It has been safely deactivated and archived.'
        )
      );
    } else {
      // Safe to permanently remove
      await VendorSubscriptionPlan.findByIdAndDelete(id);
      return res.status(200).json(
        new ApiResponse(200, { isPermanent: true }, 'Vendor subscription plan permanently deleted.')
      );
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Subscriptions Ledger
 */
export const getAdminVendorSubscriptionsLedger = async (req, res, next) => {
  try {
    const { status, billingCycle, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }
    if (billingCycle && billingCycle !== 'ALL') {
      filter['durationSnapshot.planType'] = { $regex: billingCycle, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    let query = VendorSubscription.find(filter)
      .populate('vendorId', 'storeName email phone status')
      .populate('planId', 'name planType price durationValue durationUnit')
      .sort({ createdAt: -1 });

    const total = await VendorSubscription.countDocuments(filter);
    const subscriptions = await query.skip(skip).limit(Number(limit)).lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        'Vendor subscriptions ledger retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// ==========================================
// VENDOR STOREFRONT & DASHBOARD CONTROLLERS
// ==========================================

/**
 * Vendor / Public: Get active vendor subscription plans
 */
export const getActiveVendorPlans = async (req, res, next) => {
  try {
    await ensureDefaultVendorPlans();

    const plans = await VendorSubscriptionPlan.find({
      status: { $in: ['Active', 'ACTIVE'] },
      isDeleted: { $ne: true },
    })
      .sort({ displayOrder: 1, price: 1 })
      .lean();

    // Attach computed monthly equivalent price
    const enrichedPlans = plans.map((plan) => {
      let monthlyEquivalent = plan.price;
      const unit = (plan.durationUnit || 'months').toLowerCase();
      const val = Number(plan.durationValue) || 1;

      if (unit.startsWith('month') && val > 0) {
        monthlyEquivalent = Math.round(plan.price / val);
      } else if (unit.startsWith('year') && val > 0) {
        monthlyEquivalent = Math.round(plan.price / (val * 12));
      } else if (unit.startsWith('day') && val > 0) {
        monthlyEquivalent = Math.round((plan.price / val) * 30);
      }

      return {
        ...plan,
        id: plan._id,
        monthlyEquivalentPrice: monthlyEquivalent,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, { plans: enrichedPlans }, 'Active vendor subscription plans retrieved')
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Vendor: Get current active vendor subscription with remaining days & details
 */
export const getCurrentVendorSubscription = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user);
    if (!vendor) {
      throw new ApiError(404, 'Vendor profile not found for authenticated user', ERROR_CODES.NOT_FOUND);
    }

    const now = new Date();

    // Check active subscription in VendorSubscription
    let subscription = await VendorSubscription.findOne({
      vendorId: vendor._id,
      subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      expiryDate: { $gt: now },
    })
      .populate('planId')
      .sort({ expiryDate: -1 });

    // Fallback: fetch latest subscription if none is currently active
    if (!subscription) {
      subscription = await VendorSubscription.findOne({
        vendorId: vendor._id,
      })
        .populate('planId')
        .sort({ createdAt: -1 });
    }

    let remainingDays = 0;
    let isExpired = false;

    if (subscription) {
      const expTime = new Date(subscription.expiryDate || subscription.endDate).getTime();
      const diffMs = expTime - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      isExpired = diffMs <= 0;
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscription: subscription
            ? {
                ...subscription.toObject(),
                remainingDays,
                isExpired,
                planName: subscription.planNameSnapshot || subscription.planId?.name,
                planPrice: subscription.planPriceSnapshot || subscription.planId?.price,
              }
            : null,
        },
        'Current vendor subscription retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Vendor: Checkout & activate subscription with server verification, calendar math, snapshots, and MLM commission
 */
export const checkoutVendorSubscription = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user);
    if (!vendor) {
      throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);
    }

    const { planId, paymentMethod = 'RAZORPAY', promoCode } = req.body;

    if (!planId) {
      throw new ApiError(400, 'Plan ID is required for checkout', ERROR_CODES.BAD_REQUEST);
    }

    // Always fetch latest authoritative plan details from database
    const plan = await VendorSubscriptionPlan.findById(planId);
    if (!plan || plan.isDeleted || plan.status === 'Inactive' || plan.status === 'INACTIVE') {
      throw new ApiError(400, 'Selected vendor subscription plan is inactive or does not exist.', ERROR_CODES.BAD_REQUEST);
    }

    // Server-side authoritative price calculation (never trust frontend numbers)
    const basePrice = plan.price;
    const discount = plan.discount || 0;
    const finalAmount = Math.max(0, basePrice - discount);

    // Calculate dates using calendar-month calculation
    const now = new Date();
    let startDate = now;

    // Check if vendor already has an ACTIVE subscription to stack/extend or renew
    const existingActive = await VendorSubscription.findOne({
      vendorId: vendor._id,
      subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      expiryDate: { $gt: now },
    }).sort({ expiryDate: -1 });

    if (existingActive) {
      // Extend seamlessly from current expiry date
      startDate = new Date(existingActive.expiryDate);
    }

    const expiryDate = calculateCalendarExpiry(startDate, plan.durationValue, plan.durationUnit);

    const transactionId = `txn_vsub_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Create payment ledger record
    const payment = new Payment({
      userId: req.user._id,
      amount: finalAmount,
      currency: plan.currency || 'INR',
      paymentMethod,
      transactionId,
      status: 'SUCCESS',
      metadata: {
        vendorId: vendor._id,
        planId: plan._id,
        planName: plan.name,
      },
    });
    await payment.save();

    // Create snapshot-isolated VendorSubscription
    const vendorSubscription = new VendorSubscription({
      vendorId: vendor._id,
      userId: req.user._id,
      planId: plan._id,
      planNameSnapshot: plan.name,
      planPriceSnapshot: finalAmount,
      durationSnapshot: {
        durationValue: plan.durationValue,
        durationUnit: plan.durationUnit,
        planType: plan.planType,
      },
      startDate,
      expiryDate,
      endDate: expiryDate,
      paymentStatus: 'Paid',
      subscriptionStatus: 'Active',
      status: 'ACTIVE',
      transactionId,
      paymentId: payment._id,
      planSnapshot: {
        id: plan._id,
        name: plan.name,
        code: plan.code,
        planType: plan.planType,
        price: plan.price,
        discount: plan.discount,
        benefits: plan.benefits,
        featureLimits: plan.featureLimits,
        badge: plan.badge,
      },
    });

    await vendorSubscription.save();

    // Also sync with legacy Subscription model for full ecosystem compatibility
    try {
      const legacySub = new Subscription({
        ownerUserId: req.user._id,
        entityType: 'VENDOR',
        entityId: vendor._id,
        planId: plan._id,
        billingCycle: plan.planType.toUpperCase().replace('-', '_'),
        amount: finalAmount,
        startDate,
        endDate: expiryDate,
        status: 'ACTIVE',
        paymentId: payment._id,
      });
      await legacySub.save();
      payment.subscriptionId = legacySub._id;
      await payment.save();
    } catch (legacyErr) {
      console.warn('[VendorSubscription] Legacy Subscription sync notice:', legacyErr.message);
    }

    // Trigger 10% direct vendor referral commission
    try {
      await mlmRewardService.processVendorSubscriptionCommission(
        vendor._id,
        vendorSubscription._id,
        finalAmount,
        plan.name
      );
    } catch (mlmErr) {
      console.error('[VendorSubscription MLM Error]:', mlmErr.message);
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          subscription: vendorSubscription,
          transactionId,
          amountPaid: finalAmount,
          expiryDate,
        },
        'Vendor subscription activated successfully!'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Vendor: View subscription audit history
 */
export const getVendorSubscriptionHistory = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user);
    if (!vendor) {
      throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);
    }

    const history = await VendorSubscription.find({ vendorId: vendor._id })
      .populate('planId', 'name planType badge')
      .populate('paymentId', 'amount paymentMethod transactionId createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, { history }, 'Vendor subscription history retrieved')
    );
  } catch (err) {
    next(err);
  }
};
