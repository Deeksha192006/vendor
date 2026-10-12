import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';

dotenv.config();

async function updatePlanDurations() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  console.log('✅ Connected.');

  const plans = await SubscriptionPlan.find({ applicableEntityType: 'VENDOR' });
  console.log(`📌 Updating ${plans.length} Vendor Subscription Plans...`);

  for (const plan of plans) {
    const mPrice = plan.monthlyPrice || 100;
    if (!plan.quarterlyPrice) {
      plan.quarterlyPrice = Math.round(mPrice * 3 * 0.95); // 5% discount for 3 months
    }
    if (!plan.halfYearlyPrice) {
      plan.halfYearlyPrice = Math.round(mPrice * 6 * 0.90); // 10% discount for 6 months
    }
    if (!plan.yearlyPrice) {
      plan.yearlyPrice = Math.round(mPrice * 12 * 0.80); // 20% discount for 12 months
    }
    await plan.save();
    console.log(`  ✓ Updated Plan [${plan.code}] ${plan.name}:`);
    console.log(`     - Monthly (1 Mo): ₹${plan.monthlyPrice}`);
    console.log(`     - Quarterly (3 Mo): ₹${plan.quarterlyPrice}`);
    console.log(`     - Half-Yearly (6 Mo): ₹${plan.halfYearlyPrice}`);
    console.log(`     - Annual (12 Mo): ₹${plan.yearlyPrice}`);
  }

  console.log('🎉 Subscription plans successfully updated!');
  await mongoose.disconnect();
}

updatePlanDurations().catch((err) => {
  console.error('❌ Error updating plan durations:', err);
  mongoose.disconnect();
});
