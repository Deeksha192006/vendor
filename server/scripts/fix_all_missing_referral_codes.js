import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

async function fixMissingReferralCodes() {
  console.log('🔄 Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  console.log('✅ Connected to DB');

  const usersWithoutCode = await User.find({
    $or: [
      { referralCode: { $exists: false } },
      { referralCode: null },
      { referralCode: '' },
    ],
  });

  console.log(`📌 Found ${usersWithoutCode.length} users missing referral codes.`);

  let updatedCount = 0;
  for (const user of usersWithoutCode) {
    let newReferralCode = User.generateReferralCode(user.name, user.role);
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 15) {
      const codeExists = await User.findOne({ referralCode: newReferralCode });
      if (!codeExists) {
        isCodeUnique = true;
      } else {
        newReferralCode = User.generateReferralCode(user.name, user.role);
        attempts++;
      }
    }

    user.referralCode = newReferralCode;
    await user.save();
    updatedCount++;
    console.log(`   ✓ Updated [${user.role}] ${user.email} (${user.name}) -> ${newReferralCode}`);
  }

  console.log(`\n🎉 Done! Successfully generated referral codes for ${updatedCount} users.`);
  await mongoose.disconnect();
}

fixMissingReferralCodes().catch((err) => {
  console.error('❌ Error during referral code migration:', err);
  mongoose.disconnect();
});
