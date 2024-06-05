const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors
const app = express();
const port = 3000;

// Use cors middleware
app.use(cors());

// ThingSpeak credentials
const thingspeakChannelID = '2564504';
const thingspeakReadAPIKey = 'CGQTB4TWK49LRBLQ';

// Function to get data from ThingSpeak
async function getThingSpeakData() {
  const url = `https://api.thingspeak.com/channels/${thingspeakChannelID}/feeds.json?api_key=${thingspeakReadAPIKey}&results=1`;
  try {
    const response = await axios.get(url);
    const feeds = response.data.feeds[0];
    return {
      currentLatitude: parseFloat(feeds.field1),
      currentLongitude: parseFloat(feeds.field2),
      speed: parseFloat(feeds.field3)
    };
  } catch (error) {
    console.error('Error fetching data from ThingSpeak:', error);
    return null;
  }
}

// Function to calculate the distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Function to calculate ETA
function calculateETA(distance, speed) {
  if (speed > 0) {
    const eta = (distance / speed) * 60; // ETA in minutes
    return eta;
  } else {
    return Infinity; // Infinite ETA if speed is zero or negative
  }
}

// Endpoint to calculate ETA
app.get('/calculate-eta', async (req, res) => {
  const { destinationLatitude, destinationLongitude } = req.query;
  
  if (!destinationLatitude || !destinationLongitude) {
    return res.status(400).json({ error: 'Destination latitude and longitude are required' });
  }

  const data = await getThingSpeakData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to retrieve data from ThingSpeak' });
  }

  const distance = calculateDistance(data.currentLatitude, data.currentLongitude, parseFloat(destinationLatitude), parseFloat(destinationLongitude));
  const eta = calculateETA(distance, data.speed);

  res.json({ eta });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
