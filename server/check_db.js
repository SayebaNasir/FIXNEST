const mongoose = require('mongoose');

const uri = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to Atlas');
    const db = mongoose.connection.db;
    const providers = await db.collection('providers').find({}).toArray();
    console.log(`Total providers in DB: ${providers.length}`);
    providers.forEach(p => {
        console.log(`- ${p.name} | Status: ${p.verificationStatus} | Location: ${p.location?.coordinates}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
