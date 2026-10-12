import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { SubscriptionOrder } from '../models/SubscriptionOrder.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { mlmRewardService } from './mlmRewardService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const vendorSubscriptionService = {
  getAvailablePlans: async () => {
    return await SubscriptionPlan.find({
      applicableEntityType: 'VENDOR',
      isActive: true
    }).sort({ displayOrder: 1 });
  },
  
  getCurrentSubscription: async (vendorId) => {
    const subscription = await Subscription.findOne({
      entityType: 'VENDOR',
      entityId: vendorId,
    })
    .populate('planId')
    .sort({ createdAt: -1 });
    
    return subscription;
  },
  
  createSubscriptionOrder: async (vendorId, planId, billingCycle) => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive || !plan.applicableEntityType.includes('VENDOR')) {
      throw new ApiError(400, 'Invalid or inactive subscription plan', ERROR_CODES.BAD_REQUEST);
    }
    
    const validCycles = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'SEMI_ANNUAL', 'YEARLY', 'ANNUAL'];
    if (!validCycles.includes(billingCycle?.toUpperCase())) {
      throw new ApiError(400, 'Invalid billing cycle. Supported: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY', ERROR_CODES.BAD_REQUEST);
    }
    
    const cycle = billingCycle.toUpperCase();
    let amount = plan.monthlyPrice;
    if (cycle === 'QUARTERLY') {
      amount = plan.quarterlyPrice || (plan.monthlyPrice * 3);
    } else if (cycle === 'HALF_YEARLY' || cycle === 'SEMI_ANNUAL') {
      amount = plan.halfYearlyPrice || (plan.monthlyPrice * 6);
    } else if (cycle === 'YEARLY' || cycle === 'ANNUAL') {
      amount = plan.yearlyPrice || (plan.monthlyPrice * 12);
    }
    
    const order = new SubscriptionOrder({
      vendorId,
      planId,
      billingCycle: cycle,
      amount,
      currency: plan.currency,
      status: 'PENDING_PAYMENT'
    });
    
    await order.save();
    return order;
  },
  
  verifySubscriptionPayment: async (vendorId, orderId, paymentId, paymentStatus) => {
    // Note: paymentId and paymentStatus would normally come from the gateway webhook or verified gateway response
    const order = await SubscriptionOrder.findOne({
      _id: orderId,
      vendorId,
      status: 'PENDING_PAYMENT'
    }).populate('planId');
    
    if (!order) {
      throw new ApiError(404, 'Subscription order not found or already processed', ERROR_CODES.NOT_FOUND);
    }
    
    if (paymentStatus !== 'SUCCESS') {
      order.status = 'PAYMENT_FAILED';
      await order.save();
      throw new ApiError(400, 'Payment failed', ERROR_CODES.BAD_REQUEST);
    }
    
    // Create Mock Payment Record for this abstraction
    const payment = new Payment({
      userId: vendorId, // Using vendorId as userId for simplicity in this abstract flow
      amount: order.amount,
      currency: order.currency,
      paymentMethod: 'RAZORPAY',
      transactionId: `txn_sub_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      status: 'SUCCESS'
    });
    await payment.save();
    
    order.status = 'PAYMENT_SUCCESS';
    order.paymentId = payment._id;
    await order.save();
    
    // Calculate Dates
    let startDate = new Date();
    let endDate = new Date(startDate);
    
    // Check if there is an existing ACTIVE subscription that we are renewing
    const existingSubscription = await Subscription.findOne({
      entityType: 'VENDOR',
      entityId: vendorId,
      status: 'ACTIVE'
    }).sort({ endDate: -1 });
    
    if (existingSubscription && existingSubscription.endDate > new Date()) {
      startDate = new Date(existingSubscription.endDate);
      endDate = new Date(startDate);
    }
    
    const cycle = order.billingCycle?.toUpperCase();
    if (cycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (cycle === 'QUARTERLY') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (cycle === 'HALF_YEARLY' || cycle === 'SEMI_ANNUAL') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    const subscription = new Subscription({
      ownerUserId: vendorId, // Simplicity for mock
      entityType: 'VENDOR',
      entityId: vendorId,
      planId: order.planId._id,
      billingCycle: order.billingCycle,
      amount: order.amount,
      startDate,
      endDate,
      status: 'ACTIVE',
      paymentId: payment._id
    });
    
    await subscription.save();
    
    // Link payment back to subscription
    payment.subscriptionId = subscription._id;
    await payment.save();
    
    // Distribute 10% Direct MLM Vendor Referral Commission to sponsor
    try {
      await mlmRewardService.processVendorSubscriptionCommission(vendorId, subscription._id, order.amount, order.planId?.name || '');
    } catch (mlmErr) {
      console.error('[MLM Commission Error] Failed to distribute subscription commission:', mlmErr.message);
    }
    
    return subscription;
  },
  
  getSubscriptionHistory: async (vendorId) => {
    return await Subscription.find({
      entityType: 'VENDOR',
      entityId: vendorId
    })
    .populate('planId')
    .populate('paymentId')
    .sort({ createdAt: -1 });
  }
};
