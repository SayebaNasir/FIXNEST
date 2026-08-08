const express = require('express');

const router = express.Router();

const PHOTON_URL = 'https://photon.komoot.io';

// Search address/place
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lon } = req.query;

    if (!q || q.trim().length < 3) {
      return res.json({ features: [] });
    }

    const params = new URLSearchParams({
      q: q.trim(),
      limit: '5',
      lang: 'en'
    });

    // Optional location bias
    if (lat && lon) {
      params.set('lat', lat);
      params.set('lon', lon);
    }

    const response = await fetch(
      `${PHOTON_URL}/api/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Photon search failed: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Geocoding search error:', error);
    res.status(500).json({
      message: 'Unable to search locations'
    });
  }
});

// Reverse geocode coordinates
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const params = new URLSearchParams({
      lat,
      lon
    });

    const response = await fetch(
      `${PHOTON_URL}/reverse?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Photon reverse failed: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      message: 'Unable to determine address'
    });
  }
});

module.exports = router;