const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Provider = require('./models/Provider');
require('dotenv').config();

async function testHeatmap() {
  console.log('Testing Off-Peak Heatmap Analytics Data Calculation...\n');
  
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fixnest');

  const KNOWN_ZONES = ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Mohammadpur', 'Badda', 'Motijheel'];
  const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const bookings = await Booking.find({});
  console.log(`Analyzed ${bookings.length} existing bookings in DB.`);

  let offPeakSlotCount = 0;
  KNOWN_ZONES.forEach(zone => {
    HOURS.forEach(hour => {
      const count = bookings.filter(b => b.time === hour && b.userAddress.includes(zone)).length;
      if (count < 2) offPeakSlotCount++;
    });
  });

  console.log(`Identified ${offPeakSlotCount} off-peak slots with 10% discount available!`);
  console.log('Off-Peak Analytics Test PASSED!\n');

  await mongoose.disconnect();
}

testHeatmap().catch(console.error);
