import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { premiumService } from '../services/premiumService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getPlans = asyncWrapper(async (req, res) => {
  const defaultPlans = [
    {
      name: 'Monthly Plan',
      code: 'PREMIUM_MONTHLY',
      price: 1000,
      durationValue: 1,
      durationUnit: 'MONTH',
      description: 'Full access to FairKart VIP perks, priority shipping & bonus Fair Coins for 30 days.',
      rewardRules: { coinsOnSubscribe: 100 }
    },
    {
      name: 'Quarterly Plan',
      code: 'PREMIUM_QUARTERLY',
      price: 3000,
      durationValue: 3,
      durationUnit: 'MONTH',
      description: 'Save more with 90 days of VIP access, special merchant discounts & rewards.',
      rewardRules: { coinsOnSubscribe: 350 }
    },
    {
      name: 'Half-Yearly Plan',
      code: 'PREMIUM_HALF_YEARLY',
      price: 5000,
      durationValue: 6,
      durationUnit: 'MONTH',
      description: '6 Months of premium customer benefits, zero platform fees & maximum cashback.',
      rewardRules: { coinsOnSubscribe: 750 }
    },
    {
      name: 'Annual Plan',
      code: 'PREMIUM_ANNUAL',
      price: 10000,
      durationValue: 1,
      durationUnit: 'YEAR',
      description: 'Best value! 365 Days of top-tier VIP status, unlimited cashback & priority 24/7 support.',
      rewardRules: { coinsOnSubscribe: 1800 }
    }
  ];

  for (const p of defaultPlans) {
    const existing = await CustomerSubscriptionPlan.findOne({ code: p.code });
    if (!existing) {
      await CustomerSubscriptionPlan.create({ ...p, status: 'ACTIVE' });
    }
  }

  const plans = await CustomerSubscriptionPlan.find({ status: 'ACTIVE' }).sort({ price: 1 });
  return res.status(200).json(new ApiResponse(200, { plans }, 'Premium plans retrieved'));
});

export const subscribe = asyncWrapper(async (req, res) => {
  const { planId } = req.body;
  if (!planId) throw new ApiError(400, 'planId is required', ERROR_CODES.BAD_REQUEST);

  const plan = await CustomerSubscriptionPlan.findById(planId);
  if (!plan || plan.isDeleted || (plan.status !== 'Active' && plan.status !== 'ACTIVE')) {
    throw new ApiError(400, 'Invalid or inactive plan', ERROR_CODES.BAD_REQUEST);
  }

  // Deactivate existing active customer subscriptions for this user
  await CustomerSubscription.updateMany(
    { customerId: req.user._id, status: { $in: ['ACTIVE', 'Active'] } },
    { $set: { status: 'CANCELLED', subscriptionStatus: 'Cancelled' } }
  );

  const startDate = new Date();
  const expiryDate = new Date(startDate);
  const durationVal = plan.durationValue || 1;
  const unit = (plan.durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    const curDay = expiryDate.getDate();
    expiryDate.setMonth(expiryDate.getMonth() + durationVal);
    if (expiryDate.getDate() !== curDay) expiryDate.setDate(0);
  } else if (unit.startsWith('year')) {
    expiryDate.setFullYear(expiryDate.getFullYear() + durationVal);
  } else if (unit.startsWith('day')) {
    expiryDate.setDate(expiryDate.getDate() + durationVal);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + durationVal);
  }

  const txId = `TXN-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const subscription = await CustomerSubscription.create({
    customerId: req.user._id,
    planId: plan._id,
    planNameSnapshot: plan.name,
    planPriceSnapshot: Math.max(0, plan.price - (plan.discount || 0)),
    durationSnapshot: { value: plan.durationValue, unit: plan.durationUnit, label: `${plan.durationValue} ${plan.durationUnit}` },
    startDate,
    expiryDate,
    startedAt: startDate,
    expiresAt: expiryDate,
    paymentStatus: 'Paid',
    subscriptionStatus: 'Active',
    status: 'ACTIVE',
    transactionId: txId,
    paymentId: txId,
    planSnapshot: plan.toObject()
  });

  return res.status(200).json(new ApiResponse(200, { subscription, mode: 'MOCK' }, 'Subscription activated successfully'));
});

export const verifyPayment = asyncWrapper(async (req, res) => {
  const { planId, razorpayPaymentId, razorpayOrderId } = req.body;

  let plan;
  if (planId) {
    plan = await CustomerSubscriptionPlan.findById(planId);
  }
  if (!plan) {
    plan = await CustomerSubscriptionPlan.findOne({ isDeleted: { $ne: true }, status: { $in: ['Active', 'ACTIVE'] } });
  }

  if (!plan || plan.isDeleted || (plan.status !== 'Active' && plan.status !== 'ACTIVE')) {
    throw new ApiError(400, 'Invalid or inactive subscription plan', ERROR_CODES.BAD_REQUEST);
  }

  // Deactivate existing active customer subscriptions for this user
  await CustomerSubscription.updateMany(
    { customerId: req.user._id, status: { $in: ['ACTIVE', 'Active'] } },
    { $set: { status: 'CANCELLED', subscriptionStatus: 'Cancelled' } }
  );

  const startDate = new Date();
  const expiryDate = new Date(startDate);
  const durationVal = plan.durationValue || 1;
  const unit = (plan.durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    const curDay = expiryDate.getDate();
    expiryDate.setMonth(expiryDate.getMonth() + durationVal);
    if (expiryDate.getDate() !== curDay) expiryDate.setDate(0);
  } else if (unit.startsWith('year')) {
    expiryDate.setFullYear(expiryDate.getFullYear() + durationVal);
  } else if (unit.startsWith('day')) {
    expiryDate.setDate(expiryDate.getDate() + durationVal);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + durationVal);
  }

  const txId = razorpayPaymentId || `pay_mock_${Date.now()}`;

  const subscription = await CustomerSubscription.create({
    customerId: req.user._id,
    planId: plan._id,
    planNameSnapshot: plan.name,
    planPriceSnapshot: Math.max(0, plan.price - (plan.discount || 0)),
    durationSnapshot: { value: plan.durationValue, unit: plan.durationUnit, label: `${plan.durationValue} ${plan.durationUnit}` },
    startDate,
    expiryDate,
    startedAt: startDate,
    expiresAt: expiryDate,
    paymentStatus: 'Paid',
    subscriptionStatus: 'Active',
    status: 'ACTIVE',
    transactionId: txId,
    paymentId: txId,
    planSnapshot: plan.toObject()
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { subscription, isPremium: true },
      `Payment Successful! Your ${plan.name} (₹${plan.price}) VIP subscription is now ACTIVE.`
    )
  );
});

export const getStatus = asyncWrapper(async (req, res) => {
  const subscription = await CustomerSubscription.findOne({
    customerId: req.user._id,
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() }
  }).populate('planId');

  const isPremium = !!subscription;
  
  return res.status(200).json(new ApiResponse(200, { isPremium, subscription }, 'Premium status retrieved'));
});

export const getHistory = asyncWrapper(async (req, res) => {
  const history = await CustomerSubscription.find({ customerId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('planId');
    
  return res.status(200).json(new ApiResponse(200, { history }, 'Subscription history retrieved'));
});


