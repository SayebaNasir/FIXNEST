const emailService = require('./services/emailService');
require('dotenv').config();

async function sendLiveTestEmail() {
  console.log('Sending live email via Gmail SMTP...');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);

  const mockBooking = {
    _id: '507f191e810c19729de860ea',
    userName: 'Test Homeowner',
    userEmail: 'sadiabintekamal.02@gmail.com',
    userAddress: 'Dhanmondi 27, Dhaka',
    description: 'Electrical wiring check and fixing light fixtures',
    date: '2026-08-15',
    time: '11:00',
    price: 500,
    status: 'pending'
  };

  const mockProvider = {
    name: 'Sadia Electrical Services',
    serviceType: 'Electrical'
  };

  const mockProviderUser = {
    email: 'sadiabintekamal.02@gmail.com',
    name: 'Sadia Provider'
  };

  await emailService.sendBookingRequestConfirmation({
    booking: mockBooking,
    provider: mockProvider,
    providerUser: mockProviderUser
  });

  console.log('SUCCESS! Live email sent via Gmail to sadiabintekamal.02@gmail.com!');
}

sendLiveTestEmail().catch((err) => {
  console.error('SMTP Live Sending Error:', err);
});
