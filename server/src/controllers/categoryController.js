import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/categories
 * Returns active shared categories for product creation and storefront catalog.
 */
export const getCategories = asyncWrapper(async (req, res) => {
  const { search } = req.query;
  const filter = {
    $and: [
      {
        $or: [
          { status: 'ACTIVE' },
          { isActive: true }
        ]
      },
      { status: { $ne: 'INACTIVE' } }
    ]
  };

  if (search && search.trim()) {
    filter.$and.push({
      name: { $regex: new RegExp(escapeRegex(search.trim()), 'i') }
    });
  }

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name slug')
    .sort({ name: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { categories }, 'Active categories retrieved'));
});

/**
 * GET /api/categories/:id
 */
export const getCategoryById = asyncWrapper(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name slug')
    .populate('createdByVendorId', 'storeName email')
    .lean();

  if (!category) {
    throw new ApiError(404, 'Category not found', ERROR_CODES.NOT_FOUND);
  }

  return res.status(200).json(new ApiResponse(200, { category }, 'Category retrieved'));
});

/**
 * POST /api/vendor/categories
 * Vendor adds a shared category.
 * If identical category exists:
 * - If active: returns existing category (idempotent, prevents duplicate).
 * - If inactive: returns message informing vendor it is currently inactive.
 */
export const createVendorCategory = asyncWrapper(async (req, res) => {
  const { name, description, image, parentCategoryId } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Category name is required', ERROR_CODES.BAD_REQUEST);
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new ApiError(400, 'Category name must be at least 2 characters long', ERROR_CODES.BAD_REQUEST);
  }
  if (trimmedName.length > 60) {
    throw new ApiError(400, 'Category name cannot exceed 60 characters', ERROR_CODES.BAD_REQUEST);
  }

  const normalized = trimmedName.toLowerCase();

  // Check for case-insensitive duplicate in central database
  const existingCategory = await Category.findOne({
    $or: [
      { normalizedName: normalized },
      { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } }
    ]
  });

  if (existingCategory) {
    if (existingCategory.status === 'INACTIVE' || existingCategory.isActive === false) {
      throw new ApiError(
        400,
        'This category already exists but is currently inactive. Please select an available active category or contact the Super Admin.',
        ERROR_CODES.BAD_REQUEST
      );
    }

    // Category already exists and is active -> return existing category
    return res.status(200).json(
      new ApiResponse(
        200,
        { category: existingCategory, alreadyExists: true },
        'This category already exists. You can select it from the category list.'
      )
    );
  }

  // Find vendor metadata for tracking
  let vendor = null;
  if (req.user?._id) {
    vendor = await Vendor.findOne({ userId: req.user._id }).lean();
  }

  // Generate unique slug
  let baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (!baseSlug) baseSlug = `cat-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = await Category.create({
    name: trimmedName,
    normalizedName: normalized,
    slug,
    description: description ? description.trim() : '',
    image: image ? image.trim() : '',
    parentCategory: parentCategoryId || null,
    status: 'ACTIVE',
    isActive: true,
    createdByVendorId: vendor?._id || null,
    createdByRole: 'VENDOR',
    createdByName: vendor?.storeName || req.user?.name || 'Vendor',
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { category, alreadyExists: false },
      'Category created successfully and made available to all vendors.'
    )
  );
});

/**
 * GET /api/super-admin/categories
 * Super Admin retrieves all categories (active & inactive) with product count and creator details.
 */
export const getAdminCategories = asyncWrapper(async (req, res) => {
  const { search, status, creator } = req.query;
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  if (creator && creator !== 'ALL') {
    filter.createdByRole = creator.toUpperCase();
  }

  if (search && search.trim()) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(term, 'i') } },
      { description: { $regex: new RegExp(term, 'i') } },
      { createdByName: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name slug')
    .populate('createdByVendorId', 'storeName email phone')
    .sort({ createdAt: -1 })
    .lean();

  // Aggregate product counts for each category
  const productCounts = await Product.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } }
  ]);

  const countMap = {};
  productCounts.forEach((pc) => {
    if (pc._id) {
      countMap[pc._id.toString()] = pc.count;
    }
  });

  const enrichedCategories = categories.map((cat) => ({
    ...cat,
    productCount: countMap[cat._id.toString()] || 0,
  }));

  const total = enrichedCategories.length;
  const activeCount = enrichedCategories.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = enrichedCategories.filter((c) => c.status === 'INACTIVE').length;
  const vendorCreatedCount = enrichedCategories.filter((c) => c.createdByRole === 'VENDOR').length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categories: enrichedCategories,
        total,
        summary: {
          total,
          activeCount,
          inactiveCount,
          vendorCreatedCount,
        }
      },
      'Admin categories retrieved'
    )
  );
});

/**
 * POST /api/super-admin/categories
 * Super Admin creates a new global category.
 */
export const createAdminCategory = asyncWrapper(async (req, res) => {
  const { name, description, image, parentCategoryId, status = 'ACTIVE' } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Category name is required', ERROR_CODES.BAD_REQUEST);
  }

  const trimmedName = name.trim();
  const normalized = trimmedName.toLowerCase();

  const existing = await Category.findOne({
    $or: [
      { normalizedName: normalized },
      { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } }
    ]
  });

  if (existing) {
    throw new ApiError(400, 'A category with this name already exists in the system.', ERROR_CODES.BAD_REQUEST);
  }

  let baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (!baseSlug) baseSlug = `cat-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = await Category.create({
    name: trimmedName,
    normalizedName: normalized,
    slug,
    description: description ? description.trim() : '',
    image: image ? image.trim() : '',
    parentCategory: parentCategoryId || null,
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    isActive: status !== 'INACTIVE',
    createdByRole: 'SUPER_ADMIN',
    createdByName: 'Super Admin',
  });

  return res.status(201).json(
    new ApiResponse(201, { category }, 'Category created successfully and available to all vendors.')
  );
});

/**
 * PUT /api/super-admin/categories/:id
 * Super Admin updates category details.
 */
export const updateAdminCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, description, image, parentCategoryId, status } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found', ERROR_CODES.NOT_FOUND);
  }

  if (name && name.trim()) {
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();

    // Verify duplicate with other categories
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      $or: [
        { normalizedName: normalized },
        { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } }
      ]
    });

    if (duplicate) {
      throw new ApiError(400, 'Another category with this name already exists.', ERROR_CODES.BAD_REQUEST);
    }

    category.name = trimmedName;
    category.normalizedName = normalized;
  }

  if (description !== undefined) category.description = description ? description.trim() : '';
  if (image !== undefined) category.image = image ? image.trim() : '';
  if (parentCategoryId !== undefined) category.parentCategory = parentCategoryId || null;

  if (status) {
    category.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    category.isActive = category.status === 'ACTIVE';
  }

  await category.save();

  return res.status(200).json(new ApiResponse(200, { category }, 'Category updated successfully'));
});

/**
 * PATCH /api/super-admin/categories/:id/status
 * Super Admin toggles active / inactive status.
 */
export const toggleCategoryStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found', ERROR_CODES.NOT_FOUND);
  }

  if (status) {
    category.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  } else {
    category.status = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
  category.isActive = category.status === 'ACTIVE';

  await category.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { category },
      `Category ${category.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`
    )
  );
});

/**
 * DELETE /api/super-admin/categories/:id
 * Safe delete: Blocks deletion if products are associated.
 */
export const deleteCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found', ERROR_CODES.NOT_FOUND);
  }

  // Check product associations
  const productCount = await Product.countDocuments({ categoryId: id, isDeleted: false });
  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category "${category.name}" because it is associated with ${productCount} product(s). Please deactivate the category instead to preserve historical records.`,
      ERROR_CODES.BAD_REQUEST
    );
  }

  await Category.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
});
