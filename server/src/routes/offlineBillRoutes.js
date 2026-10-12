import express from 'express';
import { submitBill, getMyBills, getBillById } from '../controllers/offlineBillController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/submit', submitBill);
router.post('/', submitBill);

router.get('/my-bills', getMyBills);
router.get('/', getMyBills);

router.get('/:id', getBillById);

export default router;
