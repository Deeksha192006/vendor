import mongoose from 'mongoose';
import { Vendor } from '../src/models/Vendor.js';
import { User } from '../src/models/User.js';
import { Subscription } from '../src/models/Subscription.js';
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB...');

  let vendorPlan = await SubscriptionPlan.findOne({ applicableEntityType: 'VENDOR', isActive: true });
  if (!vendorPlan) {
    vendorPlan = await SubscriptionPlan.create({
      name: 'Vendor Standard Plan',
      code: 'VENDOR_STANDARD',
      description: 'Standard operational subscription for verified vendors.',
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'INR',
      applicableEntityType: 'VENDOR',
      displayOrder: 1,
      features: ['Unlimited Product Listings', 'Marketplace Storefront', 'Direct Orders & Payouts'],
      isActive: true,
    });
    console.log('Created default Vendor Standard Plan');
  }

  const vendors = await Vendor.find({});
  console.log(`Found ${vendors.length} vendor(s) in database.`);

  for (const v of vendors) {
    // Approve vendor status
    if (v.status !== 'APPROVED') {
      v.status = 'APPROVED';
      v.kycStatus = 'VERIFIED';
      await v.save();
      await User.findByIdAndUpdate(v.userId, { role: 'VENDOR' });
      console.log(`Approved vendor: ${v.storeName} (${v._id})`);
    }

    // Provision active subscription
    const existingSub = await Subscription.findOne({ entityType: 'VENDOR', entityId: v._id, status: 'ACTIVE' });
    if (!existingSub) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10);

      await Subscription.create({
        ownerUserId: v.userId,
        entityType: 'VENDOR',
        entityId: v._id,
        planId: vendorPlan._id,
        billingCycle: 'YEARLY',
        amount: 0,
        startDate,
        endDate,
        status: 'ACTIVE',
      });
      console.log(`Granted 10-Year Active Subscription to vendor: ${v.storeName}`);
    } else {
      console.log(`Vendor ${v.storeName} already has active subscription.`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Vendor approval & subscription setup complete!');
}

main().catch(console.error);
