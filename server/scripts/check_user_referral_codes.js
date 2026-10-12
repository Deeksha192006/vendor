import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart');
  const users = await User.find().select('name email role referralCode');
  console.log(`Total users in DB: ${users.length}`);
  for (const u of users) {
    console.log(`User: ${u.email} | Role: ${u.role} | referralCode: '${u.referralCode}'`);
  }
  await mongoose.disconnect();
}

checkUsers().catch(console.error);
