export const MOCK_PROVIDERS = [
  {
    _id: "prov_1",
    name: "Rahim Plumbing Services",
    serviceType: "Plumbing",
    address: "Mirpur-10, Dhaka",
    rating: 4.8,
    reviewCount: 18,
    pricePerHour: 500,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.3654, 23.8069] },
    portfolio: ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500"],
    bio: "Expert plumber with 12 years of experience in residential and commercial plumbing leak repairs across Dhaka.",
    availability: [
      { day: "Saturday", slots: ["09:00", "11:00", "14:00", "16:00"] },
      { day: "Sunday", slots: ["10:00", "12:00", "15:00"] },
      { day: "Monday", slots: ["09:00", "11:00", "14:00"] }
    ]
  },
  {
    _id: "prov_2",
    name: "AquaFix Plumbing",
    serviceType: "Plumbing",
    address: "Dhanmondi-27, Dhaka",
    rating: 4.6,
    reviewCount: 14,
    pricePerHour: 450,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.3742, 23.7461] },
    portfolio: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500"],
    bio: "Fast emergency plumbing services, water heater repair, and pipe installation.",
    availability: [
      { day: "Saturday", slots: ["09:00", "12:00", "15:00"] },
      { day: "Tuesday", slots: ["10:00", "13:00", "16:00"] }
    ]
  },
  {
    _id: "prov_3",
    name: "Karim & Sons Plumbing",
    serviceType: "Plumbing",
    address: "Gulshan-1, Dhaka",
    rating: 4.9,
    reviewCount: 25,
    pricePerHour: 700,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4152, 23.7806] },
    portfolio: ["https://images.unsplash.com/photo-1542013936693-884638332954?w=500"],
    bio: "Premium plumbing solutions for luxury apartments, sanitary fittings, and water pump repair.",
    availability: [{ day: "Monday", slots: ["10:00", "14:00"] }]
  },
  {
    _id: "prov_4",
    name: "BijliFix Electricals",
    serviceType: "Electrical",
    address: "Banani, Dhaka",
    rating: 4.7,
    reviewCount: 22,
    pricePerHour: 600,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4043, 23.7937] },
    portfolio: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"],
    bio: "Certified electrical technicians for short-circuit repair, circuit breaker installation, and fan wiring.",
    availability: [{ day: "Saturday", slots: ["10:00", "13:00", "16:00"] }]
  },
  {
    _id: "prov_5",
    name: "Shanto Electric Works",
    serviceType: "Electrical",
    address: "Uttara Sector-7, Dhaka",
    rating: 4.5,
    reviewCount: 16,
    pricePerHour: 400,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.3977, 23.8759] },
    portfolio: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500"],
    bio: "Affordable home wiring, light fixtures, switchboard repair, and generator maintenance.",
    availability: [{ day: "Sunday", slots: ["09:00", "11:00", "15:00"] }]
  },
  {
    _id: "prov_6",
    name: "PowerGrid Pro Electrical",
    serviceType: "Electrical",
    address: "Aftabnagar, Dhaka",
    rating: 4.9,
    reviewCount: 30,
    pricePerHour: 650,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4237, 23.7684] },
    portfolio: ["https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500"],
    bio: "Industrial and residential electrical expert based in Aftabnagar. Smart home switches and AC power line setup.",
    availability: [{ day: "Saturday", slots: ["09:00", "12:00", "16:00"] }]
  },
  {
    _id: "prov_7",
    name: "WoodCraft BD Carpentry",
    serviceType: "Carpentry",
    address: "Badda, Dhaka",
    rating: 4.8,
    reviewCount: 19,
    pricePerHour: 550,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4255, 23.7805] },
    portfolio: ["https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500"],
    bio: "Custom furniture fitting, door lock repair, cabinet installation, and wood polishing.",
    availability: [{ day: "Wednesday", slots: ["10:00", "14:00"] }]
  },
  {
    _id: "prov_8",
    name: "Mostafa Furniture & Carpentry",
    serviceType: "Carpentry",
    address: "Mohakhali, Dhaka",
    rating: 4.4,
    reviewCount: 11,
    pricePerHour: 400,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4031, 23.7777] },
    portfolio: ["https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500"],
    bio: "Bed frame repair, dining table polishing, and wardrobe door fix.",
    availability: [{ day: "Tuesday", slots: ["11:00", "15:00"] }]
  },
  {
    _id: "prov_9",
    name: "CleanSweep Home Cleaning",
    serviceType: "Cleaning",
    address: "Bashundhara R/A, Dhaka",
    rating: 4.9,
    reviewCount: 42,
    pricePerHour: 350,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4331, 23.8151] },
    portfolio: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500"],
    bio: "Deep apartment cleaning, sofa shampooing, kitchen degreasing, and water tank cleaning.",
    availability: [{ day: "Friday", slots: ["08:00", "11:00", "15:00"] }]
  },
  {
    _id: "prov_10",
    name: "ShineNSparkle Cleaning",
    serviceType: "Cleaning",
    address: "Lalmatia, Dhaka",
    rating: 4.7,
    reviewCount: 20,
    pricePerHour: 300,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.3705, 23.7552] },
    portfolio: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500"],
    bio: "Professional window cleaning, floor scrubbing, and post-renovation home cleaning.",
    availability: [{ day: "Saturday", slots: ["09:00", "13:00"] }]
  },
  {
    _id: "prov_11",
    name: "FrostCool AC Servicing",
    serviceType: "AC Repair",
    address: "Rampura, Dhaka",
    rating: 4.8,
    reviewCount: 27,
    pricePerHour: 600,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4211, 23.7612] },
    portfolio: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"],
    bio: "Split & Inverter AC gas refill, jet wash cleaning, compressor repair, and new AC mounting.",
    availability: [{ day: "Sunday", slots: ["10:00", "14:00", "17:00"] }]
  },
  {
    _id: "prov_12",
    name: "ColorMaster Painting Services",
    serviceType: "Painting",
    address: "Khilgaon, Dhaka",
    rating: 4.6,
    reviewCount: 15,
    pricePerHour: 500,
    verificationStatus: "verified",
    location: { type: "Point", coordinates: [90.4240, 23.7500] },
    portfolio: ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500"],
    bio: "Interior and exterior home wall painting, damp damp-proofing wall treatment, and plastic paint finish.",
    availability: [{ day: "Saturday", slots: ["09:00", "12:00"] }]
  }
];

// Calculate Haversine distance in KM
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function filterMockProviders(filters, userLocation) {
  const { serviceType, rating, maxPrice, radius } = filters;
  const rad = Number(radius) || 50;

  return MOCK_PROVIDERS.filter((p) => {
    if (serviceType && !p.serviceType.toLowerCase().includes(serviceType.toLowerCase())) {
      return false;
    }
    if (rating && p.rating < Number(rating)) {
      return false;
    }
    if (maxPrice && p.pricePerHour > Number(maxPrice)) {
      return false;
    }
    if (userLocation && userLocation.lat && userLocation.lng && p.location?.coordinates) {
      const [lng, lat] = p.location.coordinates;
      const dist = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
      if (dist > rad) {
        return false;
      }
    }
    return true;
  });
}
