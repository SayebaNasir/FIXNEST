const mongoose = require('mongoose');
const Provider = require('./models/Provider');
const Review = require('./models/Review');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Provider.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data.');

    // Dhaka area coordinates - various neighborhoods
    const providers = [
      // ===== PLUMBING =====
      {
        name: 'Rahim Plumbing Services',
        serviceType: 'Plumbing',
        location: { type: 'Point', coordinates: [90.4125, 23.8103] },
        address: 'Mirpur-10, Dhaka',
        rating: 4.7,
        reviewCount: 12,
        pricePerHour: 500,
        availability: [
          { day: 'Saturday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Sunday', slots: ['10:00', '12:00', '15:00'] },
          { day: 'Monday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'Tuesday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Wednesday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '14:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500',
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'
        ],
        bio: 'Expert plumber with 12 years of experience in residential and commercial plumbing. Specializing in pipe fitting, leak repair, and bathroom installations across Dhaka.'
      },
      {
        name: 'AquaFix Plumbing',
        serviceType: 'Plumbing',
        location: { type: 'Point', coordinates: [90.3854, 23.7461] },
        address: 'Dhanmondi 27, Dhaka',
        rating: 4.3,
        reviewCount: 8,
        pricePerHour: 450,
        availability: [
          { day: 'Saturday', slots: ['08:00', '10:00', '13:00'] },
          { day: 'Sunday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Monday', slots: ['10:00', '14:00'] },
          { day: 'Wednesday', slots: ['09:00', '11:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '13:00', '16:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500',
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500'
        ],
        bio: 'Affordable and reliable plumbing solutions for every home. We handle everything from dripping faucets to full bathroom renovations.'
      },
      {
        name: 'Karim & Sons Plumbing',
        serviceType: 'Plumbing',
        location: { type: 'Point', coordinates: [90.4312, 23.7806] },
        address: 'Gulshan-1, Dhaka',
        rating: 4.9,
        reviewCount: 22,
        pricePerHour: 700,
        availability: [
          { day: 'Saturday', slots: ['09:00', '11:00', '14:00', '16:00', '18:00'] },
          { day: 'Sunday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Monday', slots: ['10:00', '12:00', '15:00', '17:00'] },
          { day: 'Tuesday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'Wednesday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Thursday', slots: ['09:00', '12:00', '15:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500',
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500',
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'
        ],
        bio: 'Premium plumbing services trusted by 500+ families in Gulshan and Banani. 24/7 emergency service available. Licensed and insured.'
      },

      // ===== ELECTRICAL =====
      {
        name: 'BijliFix Electricals',
        serviceType: 'Electrical',
        location: { type: 'Point', coordinates: [90.3995, 23.7772] },
        address: 'Mohakhali DOHS, Dhaka',
        rating: 4.8,
        reviewCount: 18,
        pricePerHour: 600,
        availability: [
          { day: 'Saturday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Sunday', slots: ['10:00', '13:00', '15:00'] },
          { day: 'Monday', slots: ['09:00', '12:00', '14:00', '17:00'] },
          { day: 'Tuesday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Wednesday', slots: ['09:00', '11:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '14:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500',
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'
        ],
        bio: 'Certified electricians for all residential and commercial needs. Wiring, fan installation, switch board repair, and smart home setup.'
      },
      {
        name: 'Shanto Electric Solutions',
        serviceType: 'Electrical',
        location: { type: 'Point', coordinates: [90.3680, 23.7520] },
        address: 'Jigatola, Dhaka',
        rating: 4.1,
        reviewCount: 6,
        pricePerHour: 400,
        availability: [
          { day: 'Saturday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Sunday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Tuesday', slots: ['10:00', '14:00'] },
          { day: 'Thursday', slots: ['09:00', '11:00', '14:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'
        ],
        bio: 'Budget-friendly electrical repair services. Quick response time and honest pricing. 8 years of hands-on experience.'
      },
      {
        name: 'PowerGrid Pro Electrical',
        serviceType: 'Electrical',
        location: { type: 'Point', coordinates: [90.4200, 23.7950] },
        address: 'Banani, Dhaka',
        rating: 4.6,
        reviewCount: 15,
        pricePerHour: 650,
        availability: [
          { day: 'Saturday', slots: ['08:00', '10:00', '13:00', '16:00'] },
          { day: 'Sunday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'Monday', slots: ['10:00', '13:00', '15:00', '18:00'] },
          { day: 'Wednesday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '14:00', '17:00'] },
          { day: 'Friday', slots: ['15:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500',
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'
        ],
        bio: 'Full-service electrical company. From simple repairs to complete rewiring. We handle AC installation, generator setup, and solar panel wiring.'
      },

      // ===== CARPENTRY =====
      {
        name: 'WoodCraft Bangladesh',
        serviceType: 'Carpentry',
        location: { type: 'Point', coordinates: [90.3750, 23.7500] },
        address: 'Dhanmondi 15, Dhaka',
        rating: 4.5,
        reviewCount: 10,
        pricePerHour: 550,
        availability: [
          { day: 'Saturday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'Sunday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Monday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Tuesday', slots: ['10:00', '14:00', '17:00'] },
          { day: 'Wednesday', slots: ['09:00', '11:00'] },
          { day: 'Thursday', slots: ['10:00', '13:00', '16:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500',
          'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500'
        ],
        bio: 'Custom furniture design and repair. Kitchen cabinets, wardrobes, bookshelves, and door/window frame work. Using premium quality wood.'
      },
      {
        name: 'Mostafa Furniture Repair',
        serviceType: 'Carpentry',
        location: { type: 'Point', coordinates: [90.4050, 23.8200] },
        address: 'Mirpur DOHS, Dhaka',
        rating: 4.0,
        reviewCount: 5,
        pricePerHour: 350,
        availability: [
          { day: 'Saturday', slots: ['10:00', '14:00'] },
          { day: 'Sunday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Monday', slots: ['10:00', '13:00'] },
          { day: 'Wednesday', slots: ['11:00', '14:00', '17:00'] },
          { day: 'Thursday', slots: ['09:00', '13:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500'
        ],
        bio: 'Affordable furniture repair and restoration services. Fixing broken chairs, tables, beds, and wooden fixtures with care.'
      },
      {
        name: 'Elite Woodworks',
        serviceType: 'Carpentry',
        location: { type: 'Point', coordinates: [90.4180, 23.7890] },
        address: 'Gulshan-2, Dhaka',
        rating: 4.8,
        reviewCount: 20,
        pricePerHour: 900,
        availability: [
          { day: 'Saturday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Sunday', slots: ['10:00', '12:00', '15:00', '17:00'] },
          { day: 'Monday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'Tuesday', slots: ['10:00', '13:00', '16:00'] },
          { day: 'Wednesday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '14:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500',
          'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500',
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500'
        ],
        bio: 'Luxury custom woodwork and interior carpentry. We build premium kitchens, walk-in closets, and bespoke furniture for upscale residences.'
      },

      // ===== CLEANING =====
      {
        name: 'CleanHome BD',
        serviceType: 'Cleaning',
        location: { type: 'Point', coordinates: [90.3920, 23.7650] },
        address: 'Farmgate, Dhaka',
        rating: 4.4,
        reviewCount: 14,
        pricePerHour: 300,
        availability: [
          { day: 'Saturday', slots: ['08:00', '10:00', '13:00', '15:00'] },
          { day: 'Sunday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'Monday', slots: ['08:00', '10:00', '13:00'] },
          { day: 'Tuesday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Wednesday', slots: ['08:00', '11:00', '14:00', '16:00'] },
          { day: 'Thursday', slots: ['09:00', '12:00', '15:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500',
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500'
        ],
        bio: 'Professional home and office cleaning services. Deep cleaning, move-in/move-out cleaning, and regular maintenance packages available.'
      },
      {
        name: 'SparkleClean Services',
        serviceType: 'Cleaning',
        location: { type: 'Point', coordinates: [90.4280, 23.7830] },
        address: 'Gulshan Circle-1, Dhaka',
        rating: 4.7,
        reviewCount: 25,
        pricePerHour: 500,
        availability: [
          { day: 'Saturday', slots: ['07:00', '09:00', '11:00', '14:00', '16:00'] },
          { day: 'Sunday', slots: ['08:00', '10:00', '13:00', '15:00', '17:00'] },
          { day: 'Monday', slots: ['07:00', '09:00', '12:00', '14:00'] },
          { day: 'Tuesday', slots: ['08:00', '10:00', '13:00', '16:00'] },
          { day: 'Wednesday', slots: ['07:00', '09:00', '11:00', '15:00'] },
          { day: 'Thursday', slots: ['08:00', '10:00', '14:00', '17:00'] },
          { day: 'Friday', slots: ['15:00', '17:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500',
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'
        ],
        bio: 'Premium cleaning service with trained staff. We use eco-friendly products and modern equipment. Serving Gulshan, Banani, and Baridhara.'
      },
      {
        name: 'Neatify Cleaning Co.',
        serviceType: 'Cleaning',
        location: { type: 'Point', coordinates: [90.3560, 23.7730] },
        address: 'Mohammadpur, Dhaka',
        rating: 3.9,
        reviewCount: 4,
        pricePerHour: 250,
        availability: [
          { day: 'Saturday', slots: ['09:00', '12:00', '15:00'] },
          { day: 'Sunday', slots: ['10:00', '14:00'] },
          { day: 'Monday', slots: ['09:00', '13:00', '16:00'] },
          { day: 'Wednesday', slots: ['10:00', '14:00'] },
          { day: 'Thursday', slots: ['09:00', '12:00', '15:00'] }
        ],
        portfolio: [
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500'
        ],
        bio: 'Affordable cleaning services for small apartments and bachelor pads. Quick same-day service available in Mohammadpur area.'
      },
      // ===== ADDITIONAL 8 PROVIDERS =====
      {
        name: 'Uttara Expert Plumbers',
        serviceType: 'Plumbing',
        location: { type: 'Point', coordinates: [90.3980, 23.8730] },
        address: 'Uttara Sector 4, Dhaka',
        rating: 4.6,
        reviewCount: 9,
        pricePerHour: 550,
        availability: [{ day: 'Monday', slots: ['10:00', '14:00'] }, { day: 'Wednesday', slots: ['09:00', '16:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
        bio: 'Serving the entire Uttara residential area with quick and reliable plumbing.'
      },
      {
        name: 'Badda Electrical Masters',
        serviceType: 'Electrical',
        location: { type: 'Point', coordinates: [90.4260, 23.7800] },
        address: 'Middle Badda, Dhaka',
        rating: 4.2,
        reviewCount: 7,
        pricePerHour: 450,
        availability: [{ day: 'Tuesday', slots: ['11:00', '13:00'] }, { day: 'Friday', slots: ['10:00', '15:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'],
        bio: 'Fast electrical solutions for Badda and Rampura residents.'
      },
      {
        name: 'Malibagh Woodworks',
        serviceType: 'Carpentry',
        location: { type: 'Point', coordinates: [90.4130, 23.7480] },
        address: 'Malibagh Chowdhury Para, Dhaka',
        rating: 4.8,
        reviewCount: 16,
        pricePerHour: 600,
        availability: [{ day: 'Saturday', slots: ['09:00', '12:00'] }, { day: 'Thursday', slots: ['14:00', '17:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500'],
        bio: 'Heritage carpentry skills passed down through generations.'
      },
      {
        name: 'Puran Dhaka Cleaners',
        serviceType: 'Cleaning',
        location: { type: 'Point', coordinates: [90.3880, 23.7190] },
        address: 'Lalbagh, Dhaka',
        rating: 4.5,
        reviewCount: 11,
        pricePerHour: 400,
        availability: [{ day: 'Sunday', slots: ['08:00', '12:00'] }, { day: 'Monday', slots: ['08:00', '15:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500'],
        bio: 'Specialized in cleaning older heritage buildings and narrow street homes.'
      },
      {
        name: 'Bashundhara Premium Tech',
        serviceType: 'Electrical',
        location: { type: 'Point', coordinates: [90.4320, 23.8190] },
        address: 'Bashundhara R/A, Dhaka',
        rating: 4.9,
        reviewCount: 21,
        pricePerHour: 800,
        availability: [{ day: 'Saturday', slots: ['10:00', '16:00'] }, { day: 'Sunday', slots: ['10:00', '14:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'],
        bio: 'High-end smart home installations and premium electrical services.'
      },
      {
        name: 'Tejgaon Industrial Fixers',
        serviceType: 'Plumbing',
        location: { type: 'Point', coordinates: [90.3950, 23.7600] },
        address: 'Tejgaon I/A, Dhaka',
        rating: 4.3,
        reviewCount: 14,
        pricePerHour: 500,
        availability: [{ day: 'Monday', slots: ['09:00', '17:00'] }, { day: 'Wednesday', slots: ['09:00', '17:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
        bio: 'Commercial and residential plumbing experts.'
      },
      {
        name: 'Wari Fine Furniture',
        serviceType: 'Carpentry',
        location: { type: 'Point', coordinates: [90.4180, 23.7170] },
        address: 'Wari, Dhaka',
        rating: 4.7,
        reviewCount: 19,
        pricePerHour: 700,
        availability: [{ day: 'Tuesday', slots: ['11:00', '15:00'] }, { day: 'Friday', slots: ['10:00', '14:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500'],
        bio: 'Beautiful handcrafted furniture repair and polishing.'
      },
      {
        name: 'Khilgaon Sparkle',
        serviceType: 'Cleaning',
        location: { type: 'Point', coordinates: [90.4240, 23.7500] },
        address: 'Khilgaon, Dhaka',
        rating: 4.4,
        reviewCount: 8,
        pricePerHour: 350,
        availability: [{ day: 'Saturday', slots: ['08:00', '14:00'] }, { day: 'Sunday', slots: ['09:00', '13:00'] }],
        portfolio: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
        bio: 'Trusted cleaning service for apartments and small offices.'
      }
    ];
    const savedProviders = await Provider.insertMany(providers);
    console.log(`Inserted ${savedProviders.length} providers.`);

    // Create reviews for each provider
    const reviewData = [
      // Rahim Plumbing
      { providerIndex: 0, userName: 'Ayesha Rahman', rating: 5, comment: 'Rahim bhai fixed our kitchen sink leak within an hour. Very professional and clean work!' },
      { providerIndex: 0, userName: 'Kamrul Hasan', rating: 4, comment: 'Good plumbing service. Arrived on time and fixed the issue. Price was fair.' },
      { providerIndex: 0, userName: 'Nusrat Jahan', rating: 5, comment: 'Excellent! Installed a new bathroom fitting perfectly. Will definitely call again.' },
      
      // AquaFix
      { providerIndex: 1, userName: 'Tanjim Ahmed', rating: 4, comment: 'Fixed the water heater pipe. Decent work at a good price.' },
      { providerIndex: 1, userName: 'Fatima Begum', rating: 5, comment: 'Very responsive and came within 30 minutes of calling. Great service!' },
      
      // Karim & Sons
      { providerIndex: 2, userName: 'Rashid Khan', rating: 5, comment: 'The best plumbers in Gulshan. They renovated our entire bathroom beautifully.' },
      { providerIndex: 2, userName: 'Sabina Yasmin', rating: 5, comment: 'Premium service worth every taka. Very neat and professional team.' },
      { providerIndex: 2, userName: 'Imran Hossain', rating: 5, comment: 'Emergency pipe burst at midnight and they came within an hour. Lifesavers!' },
      
      // BijliFix
      { providerIndex: 3, userName: 'Sadia Hossain', rating: 5, comment: 'Installed 3 ceiling fans and rewired a room. Excellent and safe work.' },
      { providerIndex: 3, userName: 'Rafiq Uddin', rating: 5, comment: 'Fixed a dangerous short circuit in our kitchen. Very knowledgeable electrician.' },
      { providerIndex: 3, userName: 'Meher Afroz', rating: 4, comment: 'Good electrical work. Installed new switches and sockets throughout the flat.' },
      
      // Shanto Electric
      { providerIndex: 4, userName: 'Habib Rahman', rating: 4, comment: 'Fixed the wiring issue at a very affordable rate. Honest pricing.' },
      { providerIndex: 4, userName: 'Maliha Tabassum', rating: 4, comment: 'Replaced the old switchboard. Work was decent for the price.' },
      
      // PowerGrid Pro
      { providerIndex: 5, userName: 'Zahir Ahmed', rating: 5, comment: 'Installed our entire home automation system. Truly professional team.' },
      { providerIndex: 5, userName: 'Nadia Akter', rating: 4, comment: 'AC installation was done perfectly. Slightly expensive but quality work.' },
      { providerIndex: 5, userName: 'Arif Hasan', rating: 5, comment: 'Generator wiring and backup power setup done efficiently. Highly recommend!' },
      
      // WoodCraft BD
      { providerIndex: 6, userName: 'Nabil Ahmed', rating: 5, comment: 'Built a beautiful custom bookshelf for my study room. Excellent craftsmanship!' },
      { providerIndex: 6, userName: 'Rina Begum', rating: 4, comment: 'Repaired our dining table nicely. Good quality polish work too.' },
      { providerIndex: 6, userName: 'Faisal Mahmud', rating: 5, comment: 'Kitchen cabinet work was outstanding. Very creative design suggestions.' },
      
      // Mostafa Furniture
      { providerIndex: 7, userName: 'Jamal Uddin', rating: 4, comment: 'Fixed a broken bed frame. Simple and affordable service.' },
      { providerIndex: 7, userName: 'Shahana Parveen', rating: 4, comment: 'Repaired the wardrobe door. Came on time and finished quickly.' },
      
      // Elite Woodworks
      { providerIndex: 8, userName: 'Tanvir Alam', rating: 5, comment: 'Built a stunning walk-in closet. The finish quality is museum-grade!' },
      { providerIndex: 8, userName: 'Lubna Chowdhury', rating: 5, comment: 'Custom kitchen with Italian-style cabinets. Worth every taka spent!' },
      { providerIndex: 8, userName: 'Omar Farooq', rating: 5, comment: 'Designed and built a modern TV unit with hidden wiring. Brilliant work!' },
      { providerIndex: 8, userName: 'Rukhsana Begum', rating: 4, comment: 'Very high quality but took a bit longer than expected. Beautiful result though.' },
      
      // CleanHome BD
      { providerIndex: 9, userName: 'Sharmin Akter', rating: 5, comment: 'Deep cleaned our 3-bedroom apartment before Eid. Spotless result!' },
      { providerIndex: 9, userName: 'Rezaul Karim', rating: 4, comment: 'Regular weekly cleaning service. Consistent and reliable team.' },
      { providerIndex: 9, userName: 'Tahmina Islam', rating: 4, comment: 'Move-out cleaning was thorough. Got our security deposit back thanks to them!' },
      
      // SparkleClean
      { providerIndex: 10, userName: 'Farhan Kabir', rating: 5, comment: 'The best cleaning service in Dhaka. They use top-quality eco-friendly products.' },
      { providerIndex: 10, userName: 'Nishat Rahman', rating: 5, comment: 'Regular monthly deep cleaning. Our home has never looked better!' },
      { providerIndex: 10, userName: 'Asif Iqbal', rating: 5, comment: 'Office cleaning service is exceptional. Very professional and thorough team.' },
      { providerIndex: 10, userName: 'Nabila Haque', rating: 4, comment: 'Great service but slightly pricier than others. Quality justifies the cost.' },
      
      // Neatify
      { providerIndex: 11, userName: 'Sumon Das', rating: 4, comment: 'Cleaned our bachelor pad nicely. Good value for money.' },
      { providerIndex: 11, userName: 'Ritu Rani', rating: 4, comment: 'Quick same-day cleaning before guests arrived. Very helpful!' },
      
      // Additional reviews
      { providerIndex: 12, userName: 'Hasan Ali', rating: 5, comment: 'Fixed the leak in my Uttara apartment very quickly.' },
      { providerIndex: 13, userName: 'Sumaiya Akter', rating: 4, comment: 'Good electrical work for my new AC.' },
      { providerIndex: 14, userName: 'Aslam Rahman', rating: 5, comment: 'Beautiful finish on the wardrobe repair.' },
      { providerIndex: 15, userName: 'Mim Chowdhury', rating: 5, comment: 'Very thorough cleaning, highly recommend.' },
      { providerIndex: 16, userName: 'Tarek Hossain', rating: 5, comment: 'Installed my smart lighting flawlessly.' },
      { providerIndex: 17, userName: 'Javed Islam', rating: 4, comment: 'Prompt plumbing repair in our office.' },
      { providerIndex: 18, userName: 'Salma Begum', rating: 5, comment: 'Restored my old dining table to look brand new!' },
      { providerIndex: 19, userName: 'Farid Uddin', rating: 4, comment: 'Affordable and good cleaning service.' }
    ];

    const reviews = reviewData.map(r => ({
      providerId: savedProviders[r.providerIndex]._id,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
    }));

    await Review.insertMany(reviews);
    console.log(`Inserted ${reviews.length} reviews.`);

    console.log('\n--- Seeding Summary ---');
    console.log('Plumbing providers: 3');
    console.log('Electrical providers: 3');
    console.log('Carpentry providers: 3');
    console.log('Cleaning providers: 3');
    console.log('Total providers: 12');
    console.log(`Total reviews: ${reviews.length}`);
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
