import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

async function testMyLink() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');

  const vendor = await User.findOne({ role: 'VENDOR' });
  const customer = await User.findOne({ role: 'CUSTOMER' });

  console.log('📌 Test Vendor Account:');
  console.log(`   Name: ${vendor?.name}`);
  console.log(`   Email: ${vendor?.email}`);
  console.log(`   Referral Code: ${vendor?.referralCode}`);

  console.log('\n📌 Test Customer Account:');
  console.log(`   Name: ${customer?.name}`);
  console.log(`   Email: ${customer?.email}`);
  console.log(`   Referral Code: ${customer?.referralCode}`);

  await mongoose.disconnect();
}

testMyLink().catch(console.error);
