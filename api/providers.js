let Provider;
let initErr = null;

try {
  const mongoose = require('mongoose');
  const fallbackMongoURI = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';
  const providerSchema = new mongoose.Schema({}, { strict: false });
  Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema, 'providers');
  
  if (mongoose.connection.readyState !== 1) {
    mongoose.connect(fallbackMongoURI, { serverSelectionTimeoutMS: 5000 }).catch(e => console.error(e));
  }
} catch (e) {
  initErr = e;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (initErr) {
    return res.status(500).end(JSON.stringify({ error: 'Init Error', details: initErr.message, stack: initErr.stack }));
  }

  try {
    const providers = await Provider.find({ verificationStatus: 'verified' });
    res.status(200).send(JSON.stringify(providers));
  } catch (err) {
    res.status(500).send(JSON.stringify({ error: err.message, stack: err.stack }));
  }
};
