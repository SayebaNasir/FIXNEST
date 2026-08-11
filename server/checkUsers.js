// One-off diagnostic script. Run with: node checkUsers.js
// Uses the same Atlas connection string as verify_all.js / check_db.js,
// since this project has no .env file and those scripts hardcode it directly.
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to Atlas');

  const users = await User.find({}, { email: 1, role: 1, _id: 0 });
  console.log('--- All users ---');
  users.forEach((u) => {
    console.log(JSON.stringify({ email: u.email, role: u.role }));
  });

  const target = 'master@gmail.com';
  const exactMatch = await User.findOne({ email: target });
  console.log(`\n--- Exact match for "${target}" ---`);
  console.log(exactMatch ? { email: exactMatch.email, role: exactMatch.role } : 'NOT FOUND');

  process.exit(0);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});