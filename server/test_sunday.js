const mongoose = require('mongoose');
const Provider = require('./models/Provider');
require('dotenv').config();

const extractSlotHour = (slot) => {
  if (typeof slot !== 'string') return '';
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return slot.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

async function testSunday() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fixnest');
  const providers = await Provider.find({});
  
  console.log('--- Sunday Slots Matching Test ---');
  providers.forEach(p => {
    (p.availability || []).forEach(a => {
      if (a.day === 'Sunday' && a.slots.length > 0) {
        console.log(`Provider: ${p.name}`);
        a.slots.forEach(s => {
          console.log(`  Raw Slot: "${s}" => Extracted Hour: "${extractSlotHour(s)}"`);
        });
      }
    });
  });

  await mongoose.disconnect();
}

testSunday().catch(console.error);
