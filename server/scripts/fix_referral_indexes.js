import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

async function fixReferralIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB to fix referralCode index...');

    const db = mongoose.connection.db;

    // 1. Find all users with null, undefined, or empty referralCode
    const invalidUsers = await User.find({
      $or: [
        { referralCode: null },
        { referralCode: { $exists: false } },
        { referralCode: '' }
      ]
    });

    console.log(`Found ${invalidUsers.length} user(s) with missing/null referralCode.`);

    for (const user of invalidUsers) {
      let newReferralCode = User.generateReferralCode(user.name);
      let isCodeUnique = false;
      let attempts = 0;
      while (!isCodeUnique && attempts < 10) {
        const codeExists = await User.findOne({ referralCode: newReferralCode });
        if (!codeExists) {
          isCodeUnique = true;
        } else {
          newReferralCode = User.generateReferralCode(user.name);
          attempts++;
        }
      }
      user.referralCode = newReferralCode;
      await user.save();
      console.log(`Updated user ${user.email} (${user._id}) with new referralCode: ${newReferralCode}`);
    }

    // 2. Drop the existing referralCode_1 index if present
    try {
      await db.collection('users').dropIndex('referralCode_1');
      console.log('Successfully dropped old referralCode_1 index');
    } catch (err) {
      console.log('Index referralCode_1 was not found or already dropped:', err.message);
    }

    // 3. Re-create indexes via User.syncIndexes()
    await User.syncIndexes();
    console.log('✅ Re-synced User indexes successfully (referralCode index is now unique and sparse)');

    await mongoose.disconnect();
    console.log('✅ Fix complete.');
  } catch (err) {
    console.error('❌ Error fixing referral indexes:', err);
    process.exit(1);
  }
}

fixReferralIndexes();
