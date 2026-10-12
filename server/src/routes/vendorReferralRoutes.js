import express from 'express';
import { getMyReferralInfo, getMyAttributedCustomers } from '../controllers/vendorReferralController.js';
import { getVendorDashboard } from '../controllers/mlmReferralController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('VENDOR'));

router.get('/', getMyReferralInfo);
router.get('/customers', getMyAttributedCustomers);
router.get('/vendor-mlm', getVendorDashboard);

export default router;
