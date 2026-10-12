import express from 'express';
import {
  getActiveCustomerPlans,
  getCustomerSubscription,
  checkoutCustomerSubscription,
  getCustomerSubscriptionHistory
} from '../controllers/subscriptionPlanController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: view active subscription plans
router.get('/active', getActiveCustomerPlans);
router.get('/plans', getActiveCustomerPlans);

// Protected: customer subscription management
router.use(authenticate);

router.get('/', getCustomerSubscription);
router.post('/checkout', checkoutCustomerSubscription);
router.post('/subscribe', checkoutCustomerSubscription);
router.get('/history', getCustomerSubscriptionHistory);

export default router;
