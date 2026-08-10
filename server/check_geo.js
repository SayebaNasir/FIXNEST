const mongoose = require('mongoose');
const uri = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    
    const lat = 23.7684;
    const lng = 90.4237;
    const radius = 50;
    const radiusInRadians = Number(radius) / 6371;

    const query = { verificationStatus: 'verified' };
    
    query.location = {
        $geoWithin: {
          $centerSphere: [
            [Number(lng), Number(lat)],
            radiusInRadians
          ]
        }
    };

    const providers = await db.collection('providers').find(query).toArray();
    console.log('Query result count:', providers.length);
    providers.forEach(p => console.log('- ' + p.name));
    
    process.exit(0);
});
