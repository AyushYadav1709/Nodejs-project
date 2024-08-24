const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db/connection');
const app = express();

require('dotenv').config();

app.use(bodyParser.json());

// Add School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Input validation
    if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).send('Invalid input data');
    }

    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error inserting school:', err);
            return res.status(500).send('Server error');
        }

        res.status(201).send({ message: 'School added successfully', schoolId: result.insertId });
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const userLatitude = parseFloat(req.query.latitude);
    const userLongitude = parseFloat(req.query.longitude);

    if (isNaN(userLatitude) || isNaN(userLongitude)) {
        return res.status(400).send('Invalid latitude or longitude');
    }

    const sql = 'SELECT * FROM schools';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            return res.status(500).send('Server error');
        }

        // Calculate distance from user location to each school
        results.forEach((school) => {
            school.distance = getDistanceFromLatLonInKm(userLatitude, userLongitude, school.latitude, school.longitude)+" KM";
        });

        // Sort schools by distance
        results.sort((a, b) => a.distance - b.distance);

        res.status(200).send(results);
    });
});

// Helper function to calculate distance using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
