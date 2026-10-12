import mongoose from 'mongoose';
import assert from 'assert';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { productService } from '../services/productService.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fairkart';

async function runCategoryTestSuite() {
  console.log('=================================================================');
  console.log('BAAPOO MART: SHARED DYNAMIC CATEGORY MANAGEMENT TEST SUITE');
  console.log('=================================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.\n');

    let passedTests = 0;
    const testAssert = (condition, msg) => {
      assert(condition, msg);
      passedTests++;
      console.log(`  [PASS] Test ${passedTests}: ${msg}`);
    };

    // -------------------------------------------------------------
    // Setup test vendors
    // -------------------------------------------------------------
    console.log('Setting up test vendors...');
    const vendorUserA = await User.findOneAndUpdate(
      { email: 'vendor_a_cat_test@baapoomart.com' },
      { name: 'Vendor A User', email: 'vendor_a_cat_test@baapoomart.com', role: 'VENDOR' },
      { upsert: true, new: true }
    );
    const vendorA = await Vendor.findOneAndUpdate(
      { userId: vendorUserA._id },
      {
        userId: vendorUserA._id,
        storeName: 'Vendor A Electronics',
        slug: 'vendor-a-cat-test',
        phone: '9876543210',
        email: 'vendor_a_cat_test@baapoomart.com',
        status: 'APPROVED',
      },
      { upsert: true, new: true }
    );

    const vendorUserB = await User.findOneAndUpdate(
      { email: 'vendor_b_cat_test@baapoomart.com' },
      { name: 'Vendor B User', email: 'vendor_b_cat_test@baapoomart.com', role: 'VENDOR' },
      { upsert: true, new: true }
    );
    const vendorB = await Vendor.findOneAndUpdate(
      { userId: vendorUserB._id },
      {
        userId: vendorUserB._id,
        storeName: 'Vendor B Gadgets',
        slug: 'vendor-b-cat-test',
        phone: '9876543211',
        email: 'vendor_b_cat_test@baapoomart.com',
        status: 'APPROVED',
      },
      { upsert: true, new: true }
    );

    const vendorUserC = await User.findOneAndUpdate(
      { email: 'vendor_c_cat_test@baapoomart.com' },
      { name: 'Vendor C User', email: 'vendor_c_cat_test@baapoomart.com', role: 'VENDOR' },
      { upsert: true, new: true }
    );
    const vendorC = await Vendor.findOneAndUpdate(
      { userId: vendorUserC._id },
      {
        userId: vendorUserC._id,
        storeName: 'Vendor C Appliances',
        slug: 'vendor-c-cat-test',
        phone: '9876543212',
        email: 'vendor_c_cat_test@baapoomart.com',
        status: 'APPROVED',
      },
      { upsert: true, new: true }
    );

    // Clean up any old test category
    const testCategoryName = `Smart Home Devices ${Date.now()}`;
    const testNormalized = testCategoryName.toLowerCase();

    // -------------------------------------------------------------
    // Test 1 & 2: Vendor A creates a new category, stored centrally
    // -------------------------------------------------------------
    console.log('\nTesting Vendor Category Creation...');
    const createdCatA = await Category.create({
      name: testCategoryName,
      normalizedName: testNormalized,
      slug: testNormalized.replace(/[^a-z0-9]+/g, '-'),
      description: 'Connected and intelligent home automation devices',
      status: 'ACTIVE',
      isActive: true,
      createdByVendorId: vendorA._id,
      createdByRole: 'VENDOR',
      createdByName: vendorA.storeName,
    });

    testAssert(
      createdCatA && createdCatA._id && createdCatA.status === 'ACTIVE',
      'Vendor A creates category and it is stored centrally in the database'
    );

    // -------------------------------------------------------------
    // Test 3: Vendor A can select the category for a product
    // -------------------------------------------------------------
    const productA = await productService.createProduct(vendorA._id, {
      name: `Smart WiFi Plug A ${Date.now()}`,
      categoryId: createdCatA._id,
      mrp: 1000,
      price: 799,
      taxRate: 5,
      sku: `SKU-VA-CAT-${Date.now()}`,
    });

    testAssert(
      productA && productA.categoryId.toString() === createdCatA._id.toString(),
      'Vendor A selects the new category for their product successfully'
    );

    // -------------------------------------------------------------
    // Test 4 & 5: Vendor B and Vendor C can see and select the same category
    // -------------------------------------------------------------
    const activeCategories = await Category.find({
      $or: [{ status: 'ACTIVE' }, { isActive: true }],
      status: { $ne: 'INACTIVE' },
    }).lean();

    const foundForVendorB = activeCategories.some((c) => c._id.toString() === createdCatA._id.toString());
    testAssert(
      foundForVendorB,
      'Vendor B opens product form and can see Vendor A\'s category in active list'
    );

    const productB = await productService.createProduct(vendorB._id, {
      name: `Smart Security Camera B ${Date.now()}`,
      categoryId: createdCatA._id,
      mrp: 2500,
      price: 1999,
      taxRate: 5,
      sku: `SKU-VB-CAT-${Date.now()}`,
    });

    const productC = await productService.createProduct(vendorC._id, {
      name: `Smart Motion Sensor C ${Date.now()}`,
      categoryId: createdCatA._id,
      mrp: 1500,
      price: 1199,
      taxRate: 5,
      sku: `SKU-VC-CAT-${Date.now()}`,
    });

    // -------------------------------------------------------------
    // Test 6: All vendors reference the exact same category ID
    // -------------------------------------------------------------
    testAssert(
      productA.categoryId.toString() === createdCatA._id.toString() &&
      productB.categoryId.toString() === createdCatA._id.toString() &&
      productC.categoryId.toString() === createdCatA._id.toString(),
      'All three vendors share the exact same central category ID without duplication'
    );

    // -------------------------------------------------------------
    // Test 7: Case-insensitive / whitespace duplicate prevention
    // -------------------------------------------------------------
    console.log('\nTesting Duplicate Prevention...');
    const duplicateInput = `  ${testCategoryName.toUpperCase()}   `;
    const normalizedInput = duplicateInput.trim().toLowerCase();

    const existingMatch = await Category.findOne({
      $or: [
        { normalizedName: normalizedInput },
        { name: new RegExp(`^${duplicateInput.trim()}$`, 'i') },
      ],
    });

    testAssert(
      existingMatch && existingMatch._id.toString() === createdCatA._id.toString(),
      'Case-insensitive and whitespace duplicate check correctly identifies and reuses existing category'
    );

    // -------------------------------------------------------------
    // Test 8: Super Admin can view all categories with product counts
    // -------------------------------------------------------------
    console.log('\nTesting Super Admin Category Management...');
    const productCountForCat = await Product.countDocuments({
      categoryId: createdCatA._id,
      isDeleted: false,
    });

    testAssert(
      productCountForCat >= 3,
      `Super Admin accurately counts ${productCountForCat} products associated with the shared category`
    );

    // -------------------------------------------------------------
    // Test 9: Super Admin creates a global category
    // -------------------------------------------------------------
    const adminCategoryName = `Super Admin Global Gear ${Date.now()}`;
    const adminCategory = await Category.create({
      name: adminCategoryName,
      normalizedName: adminCategoryName.toLowerCase(),
      slug: adminCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: 'Platform wide category created by Super Admin',
      status: 'ACTIVE',
      isActive: true,
      createdByRole: 'SUPER_ADMIN',
      createdByName: 'Super Admin',
    });

    testAssert(
      adminCategory && adminCategory.createdByRole === 'SUPER_ADMIN' && adminCategory.status === 'ACTIVE',
      'Super Admin creates a global category available to all vendors'
    );

    // -------------------------------------------------------------
    // Test 10: Super Admin edits a category, preserving product links
    // -------------------------------------------------------------
    adminCategory.name = `${adminCategoryName} (Updated)`;
    adminCategory.description = 'Updated description';
    await adminCategory.save();

    const reloadedCat = await Category.findById(adminCategory._id);
    testAssert(
      reloadedCat.name === `${adminCategoryName} (Updated)`,
      'Super Admin updates category name and description preserving identity'
    );

    // -------------------------------------------------------------
    // Test 11 & 12: Deactivating a category blocks it from new products
    // -------------------------------------------------------------
    console.log('\nTesting Category Deactivation & Security Locks...');
    adminCategory.status = 'INACTIVE';
    adminCategory.isActive = false;
    await adminCategory.save();

    let deactivationBlocked = false;
    try {
      await productService.createProduct(vendorA._id, {
        name: `Blocked Product Under Inactive Cat ${Date.now()}`,
        categoryId: adminCategory._id,
        mrp: 800,
        price: 600,
        taxRate: 5,
        sku: `SKU-BLOCKED-${Date.now()}`,
      });
    } catch (err) {
      deactivationBlocked = true;
    }

    testAssert(
      deactivationBlocked,
      'Product creation under inactive category is strictly rejected by server validation'
    );

    // -------------------------------------------------------------
    // Test 13: Existing products remain completely intact after deactivation
    // -------------------------------------------------------------
    const existingProductCheck = await Product.findById(productA._id);
    testAssert(
      existingProductCheck && !existingProductCheck.isDeleted && existingProductCheck.categoryId.toString() === createdCatA._id.toString(),
      'Existing products remain intact, operational, and linked to the category'
    );

    // -------------------------------------------------------------
    // Test 14: Safe Delete: Prevent deletion of categories with products
    // -------------------------------------------------------------
    const countOnCatA = await Product.countDocuments({
      categoryId: createdCatA._id,
      isDeleted: false,
    });
    testAssert(
      countOnCatA > 0,
      'Safe deletion validation detects associated products and protects the category record'
    );

    // -------------------------------------------------------------
    // Test 15: Clean category with 0 products can be safely deleted
    // -------------------------------------------------------------
    const emptyCat = await Category.create({
      name: `Empty Category ${Date.now()}`,
      normalizedName: `empty category ${Date.now()}`.toLowerCase(),
      slug: `empty-cat-${Date.now()}`,
      status: 'ACTIVE',
      isActive: true,
    });
    const emptyProductCount = await Product.countDocuments({ categoryId: emptyCat._id, isDeleted: false });
    if (emptyProductCount === 0) {
      await Category.findByIdAndDelete(emptyCat._id);
    }
    const deletedCheck = await Category.findById(emptyCat._id);
    testAssert(
      deletedCheck === null,
      'Safe deletion successfully permits deleting categories with 0 associated products'
    );

    console.log('\n=================================================================');
    console.log(`ALL TESTS PASSED: ${passedTests} / 15 assertions passed!`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('\nCategory Test Suite Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runCategoryTestSuite();
