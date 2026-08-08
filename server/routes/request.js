const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// Create a new booking request
router.post('/', async (req, res) => {
  try {
    const { userName, userEmail, userAddress, description, date, time } = req.body;
    
    const newRequest = new Request({
      userName,
      userEmail,
      userAddress,
      description,
      date,
      time,
      status: 'pending'
    });
    
    const savedRequest = await newRequest.save();
    res.status(201).json({ message: 'Request created successfully', request: savedRequest });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

router.get('/', async (req, res) => {
  try {
    const requests = await Request.find({});
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await Request.findByIdAndUpdate(id, { status }, { new: true });
    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


