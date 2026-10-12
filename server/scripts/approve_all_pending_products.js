import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB...');

  const pending = await Product.find({ status: 'PENDING_APPROVAL' });
  console.log(`Found ${pending.length} pending product(s).`);

  for (const p of pending) {
    p.status = 'APPROVED';
    await p.save();
    console.log(`Approved product: ${p.name} (ID: ${p._id}, VendorID: ${p.vendorId})`);
  }

  await mongoose.disconnect();
  console.log('✅ All pending products approved!');
}

main().catch(console.error);
