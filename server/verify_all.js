const mongoose = require('mongoose');

const uri = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to Atlas');
    const db = mongoose.connection.db;
    
    // Update all providers to have verificationStatus: 'verified'
    const result = await db.collection('providers').updateMany(
      {}, 
      { $set: { verificationStatus: 'verified' } }
    );
    
    console.log(`Updated ${result.modifiedCount} providers to verified status.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
