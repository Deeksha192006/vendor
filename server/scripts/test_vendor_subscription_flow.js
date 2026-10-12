import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';
import { vendorSubscriptionService } from '../src/services/vendorSubscriptionService.js';

dotenv.config();

async function testSubscriptionFlow() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  console.log('✅ Connected.');

  let user = await User.findOne({ role: 'VENDOR' });
  if (!user) {
    console.log('No vendor user found.');
    await mongoose.disconnect();
    return;
  }

  let vendor = await Vendor.findOne({ userId: user._id }) || await Vendor.findOne({ email: user.email });
  if (!vendor) {
    console.log(`Creating vendor profile for ${user.email}...`);
    vendor = new Vendor({
      userId: user._id,
      storeName: `${user.name} Store`,
      slug: `store-${Date.now()}`,
      email: user.email,
      phone: user.phone || '9999999999',
      status: 'APPROVED',
      isPaid: true
    });
    await vendor.save();
  }

  console.log(`📌 Found Vendor: ${vendor.storeName} (${vendor._id})`);

  let plan = await SubscriptionPlan.findOne({ applicableEntityType: 'VENDOR', isActive: true });
  if (!plan) {
    console.log('Creating default Vendor Subscription Plan...');
    plan = new SubscriptionPlan({
      name: 'Vendor Standard Plan',
      code: 'VENDOR_STANDARD',
      monthlyPrice: 500,
      quarterlyPrice: 1425,
      halfYearlyPrice: 2700,
      yearlyPrice: 1200,
      applicableEntityType: 'VENDOR',
      isActive: true
    });
    await plan.save();
  }

  console.log(`📌 Testing Subscription Order for Plan: ${plan.name} (${plan._id})`);

  for (const cycle of ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']) {
    console.log(`\n  👉 Testing billing cycle: ${cycle}`);
    const order = await vendorSubscriptionService.createSubscriptionOrder(vendor._id, plan._id, cycle);
    console.log(`     ✓ Order Created: ID=${order._id}, Amount=₹${order.amount}, Cycle=${order.billingCycle}`);

    const sub = await vendorSubscriptionService.verifySubscriptionPayment(vendor._id, order._id, `pay_${Date.now()}`, 'SUCCESS');
    console.log(`     ✓ Subscription Activated: ID=${sub._id}, Status=${sub.status}, EndDate=${sub.endDate.toISOString().split('T')[0]}`);
  }

  console.log('\n🎉 ALL 4 BILLING CYCLES (MONTHLY, QUARTERLY, HALF-YEARLY, YEARLY) TESTED AND ACTIVATED SUCCESSFULLY!');
  await mongoose.disconnect();
}

testSubscriptionFlow().catch((err) => {
  console.error('❌ Test failed with error:', err);
  mongoose.disconnect();
});
