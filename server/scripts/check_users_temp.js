import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fairkart');
  const db = mongoose.connection.db;
  const indexes = await db.collection('users').indexes();
  console.log('Indexes on users collection:');
  console.log(JSON.stringify(indexes, null, 2));

  const nullRefUsers = await db.collection('users').find({
    $or: [{ referralCode: null }, { referralCode: { $exists: false } }]
  }).toArray();

  console.log('\nUsers with null or missing referralCode:');
  for (const u of nullRefUsers) {
    console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, ReferralCode: ${u.referralCode}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
