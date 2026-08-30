module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json([
    { _id: "1", name: "Rahim Plumbing", serviceType: "Plumbing", rating: 4.8, address: "Mirpur, Dhaka", pricePerHour: 500 },
    { _id: "2", name: "AquaFix Plumbing", serviceType: "Plumbing", rating: 4.6, address: "Gulshan, Dhaka", pricePerHour: 450 }
  ]);
};
