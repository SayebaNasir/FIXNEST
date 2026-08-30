const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/providers', (req, res) => {
  res.json([
    {
      _id: "1",
      name: "Rahim Plumbing Services",
      serviceType: "Plumbing",
      address: "Mirpur-10, Dhaka",
      rating: 4.7,
      reviewCount: 12,
      pricePerHour: 500,
      location: { type: "Point", coordinates: [90.4125, 23.8103] },
      availability: [{ day: "Saturday", slots: ["09:00", "11:00"] }]
    }
  ]);
});

module.exports = app;
