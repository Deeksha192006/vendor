import express from 'express';
import {
  getCategories,
  getCategoryById,
  createVendorCategory,
  createAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  toggleCategoryStatus,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Shared
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Vendor shared category creation
router.post('/vendor', authenticate, authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), createVendorCategory);

// Admin Category Management
router.get('/admin/all', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getAdminCategories);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createAdminCategory);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateAdminCategory);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), toggleCategoryStatus);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteCategory);

export default router;
