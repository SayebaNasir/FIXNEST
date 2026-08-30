const mongoose = require('mongoose');

const fallbackMongoURI = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

const providerSchema = new mongoose.Schema({}, { strict: false });
const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema, 'providers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(fallbackMongoURI, { serverSelectionTimeoutMS: 5000 });
    }
    const providers = await Provider.find({ verificationStatus: 'verified' });
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
