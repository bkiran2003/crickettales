// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const storiesRouter = require('./api/stories');
const newsletterRouter = require('./api/newsletter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/stories', storiesRouter);
app.use('/api', newsletterRouter);

// Serve the main HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

app.get('/cancel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cancel.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🏏 CricketTales server running on http://localhost:${PORT}`);
});