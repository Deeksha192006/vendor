import express from 'express';
import { getReferralLink, getReferralTree, getNetworkSummary, sendTeamMessage, getTeamMessages, validateReferral } from '../controllers/referralController.js';
import { getCustomerDashboard, getVendorDashboard } from '../controllers/mlmReferralController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to validate referral code on registration form
router.get('/validate/:referralCode', validateReferral);

// Protected routes
router.use(authenticate);

router.get('/my-link', getReferralLink);
router.get('/tree', getReferralTree);
router.get('/network-summary', getNetworkSummary);
router.get('/customer-dashboard', getCustomerDashboard);
router.get('/vendor-dashboard', getVendorDashboard);
router.post('/team-message', sendTeamMessage);
router.get('/team-messages', getTeamMessages);

export default router;
