require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Provider = require('./models/Provider');
  
  // Test 1: No geo filter
  const all = await Provider.find({});
  console.log('All providers:', all.length);
  
  // Test 2: With geo filter (same as SearchPage defaults)
  const radiusInRadians = 50 / 6371;
  try {
    const geo = await Provider.find({
      location: {
        $geoWithin: {
          $centerSphere: [[90.4237, 23.7684], radiusInRadians]
        }
      }
    });
    console.log('Geo query results:', geo.length);
  } catch (e) {
    console.error('Geo query error:', e.message);
  }
  
  // Test 3: Check indexes
  const indexes = await Provider.collection.indexes();
  console.log('Indexes:', JSON.stringify(indexes, null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error('Connection error:', e.message);
  process.exit(1);
});
