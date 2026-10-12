import express from 'express';
import {
  getActiveVendorPlans,
  getCurrentVendorSubscription,
  checkoutVendorSubscription,
  getVendorSubscriptionHistory
} from '../controllers/vendorSubscriptionPlanController.js';
import {
  getAvailablePlans as legacyGetAvailablePlans,
  getCurrentSubscription as legacyGetCurrentSubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionHistory as legacyGetSubscriptionHistory
} from '../controllers/vendorSubscriptionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public: View active vendor subscription plans
router.get('/plans', getActiveVendorPlans);

// Protected: Vendor only
router.use(authenticate);
router.use(authorize('VENDOR'));

// Vendor current subscription
router.get('/', getCurrentVendorSubscription);
router.get('/current', getCurrentVendorSubscription);

// Purchase / Checkout
router.post('/checkout', checkoutVendorSubscription);
router.post('/subscribe', checkoutVendorSubscription);

// Audit history
router.get('/history', getVendorSubscriptionHistory);

// Legacy backwards-compatible endpoints
router.post('/order', createSubscriptionOrder);
router.post('/verify', verifySubscriptionPayment);
router.get('/legacy-plans', legacyGetAvailablePlans);

export default router;
