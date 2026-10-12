import { vendorSubscriptionService } from '../services/vendorSubscriptionService.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

const getVendorForUser = async (user) => {
  let vendor = await Vendor.findOne({ userId: user._id });
  if (!vendor) {
    // Fallback: search by email if vendor record was created with email
    vendor = await Vendor.findOne({ email: user.email?.toLowerCase() });
  }
  if (!vendor) {
    throw new ApiError(404, 'Vendor account not found for this user', ERROR_CODES.NOT_FOUND);
  }
  return vendor;
};

export const getAvailablePlans = asyncWrapper(async (req, res) => {
  const plans = await vendorSubscriptionService.getAvailablePlans();
  return res.status(200).json(new ApiResponse(200, { plans }, 'Available plans retrieved'));
});

export const getCurrentSubscription = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForUser(req.user);
  const subscription = await vendorSubscriptionService.getCurrentSubscription(vendor._id);
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Current subscription retrieved'));
});

export const createSubscriptionOrder = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForUser(req.user);
  const { planId, billingCycle } = req.body;
  const order = await vendorSubscriptionService.createSubscriptionOrder(vendor._id, planId, billingCycle);
  return res.status(201).json(new ApiResponse(201, { order }, 'Subscription order created'));
});

export const verifySubscriptionPayment = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForUser(req.user);
  const { orderId, paymentId, paymentStatus } = req.body;
  const subscription = await vendorSubscriptionService.verifySubscriptionPayment(vendor._id, orderId, paymentId, paymentStatus);
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Payment verified and subscription activated'));
});

export const getSubscriptionHistory = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForUser(req.user);
  const history = await vendorSubscriptionService.getSubscriptionHistory(vendor._id);
  return res.status(200).json(new ApiResponse(200, { history }, 'Subscription history retrieved'));
});
