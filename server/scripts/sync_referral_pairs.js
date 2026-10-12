import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Referral } from '../src/models/Referral.js';
import { mlmRewardService } from '../src/services/mlmRewardService.js';
import { ROLES } from '../src/constants/roles.js';

dotenv.config();

async function syncReferralPairs() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  console.log('✅ Connected.');

  // 1. Ensure all users have referral codes
  const users = await User.find({});
  for (const user of users) {
    if (!user.referralCode || !user.referralCode.trim()) {
      user.referralCode = User.generateReferralCode(user.name, user.role);
      await user.save();
      console.log(`  ✓ Generated referral code for ${user.email}: ${user.referralCode}`);
    }
  }

  // 2. Demo Scenario: Rani Vendor refers Santhi Vendor
  let rani = await User.findOne({ email: 'rani.vendor@example.com' });
  if (!rani) {
    rani = new User({
      name: 'Rani Vendor',
      email: 'rani.vendor@example.com',
      phone: '9123456780',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
      role: ROLES.VENDOR,
      referralCode: 'VND-RANI01',
      fairCoinBalance: 200,
    });
    await rani.save();
    console.log('  ✓ Created demo vendor Rani (VND-RANI01)');
  }

  let santhi = await User.findOne({ email: 'santhi.vendor@example.com' });
  if (!santhi) {
    santhi = new User({
      name: 'Santhi Vendor',
      email: 'santhi.vendor@example.com',
      phone: '9123456781',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
      role: ROLES.VENDOR,
      referralCode: 'VND-SANTHI02',
      referredBy: rani._id,
      referralPath: [rani._id],
      fairCoinBalance: 100,
    });
    await santhi.save();
    console.log('  ✓ Created demo vendor Santhi referred by Rani');

    await mlmRewardService.processReferralRegistrationRewards(santhi._id, rani._id);
    console.log('  ✓ Processed 100 Fair Coins reward for Rani for referring Santhi!');
  }

  // 3. Ensure all users with referredBy have Referral records
  const referredUsers = await User.find({ referredBy: { $ne: null } });
  for (const u of referredUsers) {
    await Referral.updateOne(
      { userId: u.referredBy, referredUserId: u._id },
      { $set: { level: 1, status: 'ACTIVE' } },
      { upsert: true }
    );
  }

  console.log('🎉 All referral pairs synced and verified!');
  await mongoose.disconnect();
}

syncReferralPairs().catch((err) => {
  console.error('❌ Error syncing referral pairs:', err);
  mongoose.disconnect();
});
