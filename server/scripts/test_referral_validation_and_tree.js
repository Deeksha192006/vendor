import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Referral } from '../src/models/Referral.js';
import { mlmRewardService } from '../src/services/mlmRewardService.js';

dotenv.config();

async function runTest() {
  console.log('🔄 Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  console.log('✅ Connected to DB');

  // Test 1: Referral Code Generation
  const vendorCode = await User.generateReferralCode('Test Vendor', 'VENDOR');
  const customerCode = await User.generateReferralCode('Test Customer', 'CUSTOMER');
  console.log(`\n📌 Test 1: Generated Codes:`);
  console.log(`   - Vendor Code: ${vendorCode} (StartsWith VND-: ${vendorCode.startsWith('VND-')})`);
  console.log(`   - Customer Code: ${customerCode} (StartsWith CLI-: ${customerCode.startsWith('CLI-')})`);

  // Test 2: Find an existing user or vendor with a referral code
  const testReferrer = await User.findOne({ referralCode: { $exists: true, $ne: null } });
  if (testReferrer) {
    console.log(`\n📌 Test 2: Validating Referral Code '${testReferrer.referralCode}'...`);
    const validation = await mlmRewardService.validateReferralCode(testReferrer.referralCode, 'CUSTOMER');
    console.log(`   - Validation Result:`, validation);
  } else {
    console.log('⚠️ No existing user with referral code found for Test 2');
  }

  // Test 3: Test tree building
  if (testReferrer) {
    console.log(`\n📌 Test 3: Building Tree for '${testReferrer.email}'...`);
    const tree = await mlmRewardService.buildReferralTree(testReferrer._id, 9);
    console.log(`   - User: ${tree.user.name} (${tree.user.referralCode})`);
    console.log(`   - Total Referrals: ${tree.stats.totalReferrals}`);
    console.log(`   - Level 1 Count: ${tree.stats.level1Count}`);
    console.log(`   - Level 2 Count: ${tree.stats.level2Count}`);
  }

  console.log('\n🎉 Verification completed successfully!');
  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error('❌ Error during test run:', err);
  mongoose.disconnect();
});
