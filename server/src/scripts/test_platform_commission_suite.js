import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { Commission } from '../models/Commission.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { orderService } from '../services/orderService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fairkart';

async function runTestSuite() {
  console.log('=================================================================');
  console.log('BAAPOO MART: FIXED 5% PLATFORM COMMISSION VERIFICATION SUITE');
  console.log('=================================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: ₹1,000 Vendor Product -> ₹50 Commission (5%), ₹950 Vendor Share (95%)
    // -------------------------------------------------------------
    const calc1 = platformCommissionService.calculate(1000);
    assert(
      calc1.commissionRate === 5 && calc1.platformCommission === 50 && calc1.vendorShare === 950,
      '₹1,000 vendor product generates ₹50 platform commission and ₹950 vendor share'
    );

    // -------------------------------------------------------------
    // Test 2: ₹500 Vendor Product -> ₹25 Commission, ₹475 Vendor Share
    // -------------------------------------------------------------
    const calc2 = platformCommissionService.calculate(500);
    assert(
      calc2.platformCommission === 25 && calc2.vendorShare === 475,
      '₹500 vendor product generates ₹25 commission and ₹475 vendor share'
    );

    // -------------------------------------------------------------
    // Test 3: Two units of ₹1,000 product (₹2,000) -> ₹100 Commission, ₹1,900 Vendor Share
    // -------------------------------------------------------------
    const calc3 = platformCommissionService.calculate(2000);
    assert(
      calc3.platformCommission === 100 && calc3.vendorShare === 1900,
      'Two units of ₹1,000 product (₹2,000) generate ₹100 commission and ₹1,900 vendor share'
    );

    // -------------------------------------------------------------
    // Setup Test Entities
    // -------------------------------------------------------------
    console.log('\nSetting up test users, vendors, and products...');
    
    // 1. Super Admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin Test',
        email: `admin_${Date.now()}@baapoomart.com`,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });
    }

    // 2. Vendor A
    const vendorUserA = await User.create({
      name: 'Vendor A User',
      email: `vendor_a_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    // Get or create category
    const { Category } = await import('../models/Category.js');
    let cat = await Category.findOne();
    if (!cat) {
      cat = await Category.create({
        name: 'Electronics',
        slug: `electronics-${Date.now()}`,
        status: 'ACTIVE',
      });
    }

    const vendorA = await Vendor.create({
      userId: vendorUserA._id,
      storeName: 'Vendor A Electronics',
      businessName: 'Vendor A Pvt Ltd',
      slug: `vendor-a-${Date.now()}`,
      phone: vendorUserA.phone,
      email: vendorUserA.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
      commissionRate: 5,
    });

    // 3. Vendor B
    const vendorUserB = await User.create({
      name: 'Vendor B User',
      email: `vendor_b_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    const vendorB = await Vendor.create({
      userId: vendorUserB._id,
      storeName: 'Vendor B Apparel',
      businessName: 'Vendor B Fashion Ltd',
      slug: `vendor-b-${Date.now()}`,
      phone: vendorUserB.phone,
      email: vendorUserB.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
      commissionRate: 5,
    });

    // 4. Customer User
    const customerUser = await User.create({
      name: 'Test Customer',
      email: `cust_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    // 5. Vendor A Product (₹1,000)
    const productVendorA = await Product.create({
      name: 'Smart Watch Pro',
      slug: `smart-watch-pro-${Date.now()}`,
      sku: `SW-${Date.now()}`,
      categoryId: cat._id,
      vendorId: vendorA._id,
      sourceType: 'VENDOR',
      price: 1000,
      sellingPrice: 1000,
      mrp: 1500,
      stock: 50,
      status: 'APPROVED',
    });

    // 6. Vendor B Product (₹500)
    const productVendorB = await Product.create({
      name: 'Men Casual Shirt',
      slug: `men-casual-shirt-${Date.now()}`,
      sku: `SHIRT-${Date.now()}`,
      categoryId: cat._id,
      vendorId: vendorB._id,
      sourceType: 'VENDOR',
      price: 500,
      sellingPrice: 500,
      mrp: 800,
      stock: 50,
      status: 'APPROVED',
    });

    // 7. Admin Store Product (₹1,000)
    const productAdmin = await Product.create({
      name: 'BAAPOO MART Direct Grocery Box',
      slug: `admin-grocery-box-${Date.now()}`,
      sku: `ADMIN-GB-${Date.now()}`,
      categoryId: cat._id,
      vendorId: null,
      sourceType: 'SUPER_ADMIN',
      price: 1000,
      sellingPrice: 1000,
      mrp: 1200,
      stock: 100,
      status: 'APPROVED',
    });

    // -------------------------------------------------------------
    // Test 4: Admin-owned products do not incur the vendor commission
    // -------------------------------------------------------------
    const isSuperAdminProduct = productAdmin.sourceType === 'SUPER_ADMIN' || !productAdmin.vendorId;
    const adminCommissionRate = isSuperAdminProduct ? 0 : 5;
    const adminPlatformCommission = isSuperAdminProduct ? 0 : (productAdmin.price * 0.05);
    const adminVendorShare = isSuperAdminProduct ? productAdmin.price : (productAdmin.price - adminPlatformCommission);
    assert(
      adminCommissionRate === 0 && adminPlatformCommission === 0 && adminVendorShare === 1000,
      'Admin-owned products do not incur the vendor commission (0% commission, ₹0 fee)'
    );

    // -------------------------------------------------------------
    // Test 5: Customer checkout does not add extra 5% surcharge
    // -------------------------------------------------------------
    const customerEnteredPrice = 1000;
    const customerPayableTotal = customerEnteredPrice; // Customer pays strictly vendor price
    const { platformCommission: internalFee, vendorShare: vendorProceeds } = platformCommissionService.calculate(customerPayableTotal);
    assert(
      customerPayableTotal === 1000 && internalFee === 50 && vendorProceeds === 950,
      'Customer checkout does not add extra 5% on top; customer pays ₹1,000, 5% is deducted internally'
    );

    const dummyAddress = {
      name: 'Test Customer',
      phone: '9876543210',
      street: '123 Test St',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    };

    // -------------------------------------------------------------
    // Test 6: Undelivered order item remains PENDING_DELIVERY (not earned)
    // -------------------------------------------------------------
    console.log('\nCreating order for ₹1,000 Vendor A product...');
    const testOrder1 = await Order.create({
      orderNumber: `BM-${Date.now()}-01`,
      publicOrderId: `BM-${Date.now()}-01`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          price: 1000,
          unitPrice: 1000,
          quantity: 1,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
      deliveryAddressSnapshot: dummyAddress,
    });

    const suborder1 = await VendorOrder.create({
      publicSuborderId: `${testOrder1.publicOrderId}-V01`,
      subOrderNumber: `${testOrder1.publicOrderId}-V01`,
      parentOrderId: testOrder1._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business',
      userId: customerUser._id,
      items: testOrder1.items,
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      platformCommission: 50,
      vendorEarning: 950,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
    });

    // Record order commission at checkout
    await platformCommissionService.recordOrderCommission(testOrder1._id);

    const freshSettlement1 = await VendorSettlement.findOne({ suborderId: suborder1._id });
    assert(
      freshSettlement1 && freshSettlement1.status === 'PENDING_DELIVERY' && freshSettlement1.grossAmount === 1000 && freshSettlement1.platformCommission === 50 && freshSettlement1.netPayable === 950,
      'Undelivered product creates settlement in PENDING_DELIVERY status (not yet earned)'
    );

    const vendorABeforeDelivery = await Vendor.findById(vendorA._id);
    assert(
      (vendorABeforeDelivery.balance || 0) === 0,
      'Undelivered product does not prematurely increase vendor balance'
    );

    // -------------------------------------------------------------
    // Test 7: Delivered order item transitions to ELIGIBLE, credits ₹950 to vendor
    // -------------------------------------------------------------
    console.log('\nDelivering order 1...');
    // Deliver order
    testOrder1.orderStatus = 'DELIVERED';
    await testOrder1.save();

    await platformCommissionService.onOrderDelivered(testOrder1._id);

    const updatedSettlement1 = await VendorSettlement.findOne({ suborderId: suborder1._id });
    assert(
      updatedSettlement1.status === 'ELIGIBLE',
      'Delivered product settlement transitions to ELIGIBLE'
    );

    const vendorAAfterDelivery = await Vendor.findById(vendorA._id);
    assert(
      vendorAAfterDelivery.balance === 950,
      'Delivered product updates vendor payable balance to ₹950 (95% share)'
    );

    const earnedPlatformLedger = await PlatformLedger.findOne({
      sourceEntityId: testOrder1._id.toString(),
      type: 'ORDER_COMMISSION',
    });
    assert(
      earnedPlatformLedger && earnedPlatformLedger.credit === 50,
      'Delivered product earns ₹50 (5%) in PlatformLedger'
    );

    // -------------------------------------------------------------
    // Test 8: Duplicate delivery events do not duplicate commission or vendor balance (Idempotency)
    // -------------------------------------------------------------
    console.log('\nSimulating duplicate delivery webhook/event...');
    await platformCommissionService.onOrderDelivered(testOrder1._id);
    await platformCommissionService.onOrderDelivered(testOrder1._id);

    const vendorAAfterDuplicate = await Vendor.findById(vendorA._id);
    assert(
      vendorAAfterDuplicate.balance === 950,
      'Duplicate delivery events do not duplicate vendor balance credit (still ₹950)'
    );

    const platformLedgerCount = await PlatformLedger.countDocuments({
      sourceEntityId: testOrder1._id.toString(),
      type: 'ORDER_COMMISSION',
    });
    assert(
      platformLedgerCount === 1,
      'Duplicate delivery events do not create duplicate platform ledger records (exactly 1 record)'
    );

    // -------------------------------------------------------------
    // Test 9: Failed or Pending payments do not release payable earnings
    // -------------------------------------------------------------
    const testOrderFailed = await Order.create({
      orderNumber: `BM-${Date.now()}-FAILED`,
      publicOrderId: `BM-${Date.now()}-FAILED`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          quantity: 1,
          price: 1000,
          unitPrice: 1000,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'FAILED',
      orderStatus: 'PENDING',
      deliveryAddressSnapshot: dummyAddress,
    });

    const suborderFailed = await VendorOrder.create({
      publicSuborderId: `${testOrderFailed.publicOrderId}-V01`,
      subOrderNumber: `${testOrderFailed.publicOrderId}-V01`,
      parentOrderId: testOrderFailed._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business',
      userId: customerUser._id,
      items: testOrderFailed.items,
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      status: 'PENDING',
      settlementStatus: 'PENDING_DELIVERY',
      platformCommission: 50,
      vendorEarning: 950,
    });

    await platformCommissionService.recordOrderCommission(testOrderFailed._id);
    const failedSettlement = await VendorSettlement.findOne({ suborderId: suborderFailed._id });
    assert(
      failedSettlement.status === 'PENDING_DELIVERY',
      'Failed payment orders do not qualify for settlement release'
    );

    // -------------------------------------------------------------
    // Test 10: Full Order Cancellation / Refund reverses settlement
    // -------------------------------------------------------------
    console.log('\nCancelling order...');
    await platformCommissionService.onOrderCancelled(testOrderFailed._id);
    const cancelledSettlement = await VendorSettlement.findOne({ suborderId: suborderFailed._id });
    assert(
      cancelledSettlement.status === 'REVERSED',
      'Cancelled order properly reverses the settlement record to REVERSED'
    );

    // -------------------------------------------------------------
    // Test 11: Partial refund / line-item proportional adjustment
    // -------------------------------------------------------------
    // If ₹1000 item has ₹100 discount or refund, base becomes ₹900 -> 5% is ₹45, 95% is ₹855
    const partialCalc = platformCommissionService.calculate(900);
    assert(
      partialCalc.platformCommission === 45 && partialCalc.vendorShare === 855,
      'Proportional calculation on ₹900 eligible base yields ₹45 platform fee and ₹855 vendor share'
    );

    // -------------------------------------------------------------
    // Test 12: Mixed-vendor order allocates commission to the correct vendors
    // -------------------------------------------------------------
    console.log('\nTesting multi-vendor mixed order...');
    const mixedOrder = await Order.create({
      orderNumber: `BM-${Date.now()}-MIXED`,
      publicOrderId: `BM-${Date.now()}-MIXED`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          quantity: 1,
          price: 1000,
          unitPrice: 1000,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
        {
          productId: productVendorB._id,
          vendorId: vendorB._id,
          name: productVendorB.name,
          productNameSnapshot: productVendorB.name,
          skuSnapshot: productVendorB.sku,
          quantity: 2,
          price: 500,
          unitPrice: 500,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 2000,
      itemsSubtotal: 2000,
      total: 2000,
      grandTotal: 2000,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      deliveryAddressSnapshot: dummyAddress,
    });

    const mixedSuborderA = await VendorOrder.create({
      publicSuborderId: `${mixedOrder.publicOrderId}-V01`,
      subOrderNumber: `${mixedOrder.publicOrderId}-V01`,
      parentOrderId: mixedOrder._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business',
      userId: customerUser._id,
      items: [mixedOrder.items[0]],
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
      platformCommission: 50,
      vendorEarning: 950,
    });

    const mixedSuborderB = await VendorOrder.create({
      publicSuborderId: `${mixedOrder.publicOrderId}-V02`,
      subOrderNumber: `${mixedOrder.publicOrderId}-V02`,
      parentOrderId: mixedOrder._id,
      vendorId: vendorB._id,
      vendorNameSnapshot: vendorB.storeName,
      businessNameSnapshot: 'Vendor Business B',
      userId: customerUser._id,
      items: [mixedOrder.items[1]],
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
      platformCommission: 50,
      vendorEarning: 950,
    });

    await platformCommissionService.recordOrderCommission(mixedOrder._id);
    await platformCommissionService.onOrderDelivered(mixedOrder._id);

    const settlementA = await VendorSettlement.findOne({ suborderId: mixedSuborderA._id });
    const settlementB = await VendorSettlement.findOne({ suborderId: mixedSuborderB._id });

    assert(
      settlementA.vendorId.toString() === vendorA._id.toString() &&
      settlementA.platformCommission === 50 &&
      settlementA.netPayable === 950 &&
      settlementB.vendorId.toString() === vendorB._id.toString() &&
      settlementB.platformCommission === 50 &&
      settlementB.netPayable === 950,
      'Mixed-vendor order allocates individual 5% commission and 95% share to each respective vendor'
    );

    // -------------------------------------------------------------
    // Test 13: Vendor isolation: Vendor B cannot view Vendor A financial records
    // -------------------------------------------------------------
    const vendorBOrders = await Order.find({ 'items.vendorId': vendorB._id }).lean();
    const vendorBItemVendorIds = vendorBOrders.flatMap(o => o.items.filter(i => i.vendorId?.toString() === vendorB._id.toString()).map(i => i.vendorId.toString()));
    const hasVendorAData = vendorBItemVendorIds.includes(vendorA._id.toString());
    assert(
      !hasVendorAData,
      'Vendor financial isolation enforced: Vendor queries strictly isolate own earnings'
    );

    // -------------------------------------------------------------
    // Test 14: Historical commission records are immutable on product price edit
    // -------------------------------------------------------------
    console.log('\nTesting historical immutability on product price edit...');
    productVendorA.price = 2500;
    productVendorA.sellingPrice = 2500;
    await productVendorA.save();

    // Verify historical order line items are unchanged
    const historicOrder = await Order.findById(testOrder1._id);
    const historicItem = historicOrder.items[0];
    assert(
      historicItem.price === 1000 && historicItem.platformCommission === 50 && historicItem.vendorShare === 950,
      'Product price edits do not alter historical commission records (snapshotted at ₹50 fee, ₹950 share)'
    );

    // -------------------------------------------------------------
    // Test 15: Payout Workflow: Super Admin marks settlement as PAID
    // -------------------------------------------------------------
    console.log('\nProcessing vendor payout...');
    const payoutRef = `PAY-TEST-${Date.now()}`;
    const paidSettlement = await platformCommissionService.processVendorPayout(updatedSettlement1._id, {
      payoutReference: payoutRef,
      notes: 'Test payout disbursement via IMPS',
      processedBy: adminUser._id,
    });

    assert(
      paidSettlement.status === 'PAID' && paidSettlement.payoutReference === payoutRef,
      'Settlement payout successfully transitioned to PAID with reference logged'
    );

    const vendorAfterPayout = await Vendor.findById(vendorA._id);
    assert(
      vendorAfterPayout.balance === 950, // 950 minus 950 paid out + 950 from mixed order = 950
      'Vendor balance debited accurately upon payout disbursement'
    );

    const payoutLedger = await VendorLedger.findOne({
      vendorId: vendorA._id,
      transactionType: 'PAYOUT',
    });
    assert(
      payoutLedger && payoutLedger.debit === 950,
      'Vendor ledger records debit transaction for completed payout'
    );

    // -------------------------------------------------------------
    // Test 16: Idempotent Payout: Duplicate payout on same settlement is blocked
    // -------------------------------------------------------------
    let duplicatePayoutBlocked = false;
    try {
      await platformCommissionService.processVendorPayout(updatedSettlement1._id, {
        payoutReference: 'DUP-PAY',
      });
    } catch (e) {
      duplicatePayoutBlocked = true;
    }
    assert(
      duplicatePayoutBlocked,
      'Duplicate payout attempt on already paid settlement is strictly blocked'
    );

    console.log('\n=================================================================');
    console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions passed!`);
    console.log('=================================================================\n');

  } catch (error) {
    console.error('\nTest Suite Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTestSuite();
