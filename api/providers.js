module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify([
    { _id: "1", name: "Test Provider", serviceType: "Plumbing", rating: 4.8, address: "Dhaka" }
  ]));
};
