// api/newsletter.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Helper to ensure the data directory and subscribers file exist
const ensureSubscribersFile = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
    try {
        await fs.access(SUBSCRIBERS_FILE);
    } catch {
        // If the file doesn't exist, create it with an empty array
        await fs.writeFile(SUBSCRIBERS_FILE, '[]');
    }
};

// POST /api/newsletter-subscribe
router.post('/newsletter-subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'A valid email is required.' });
        }
        
        await ensureSubscribersFile();
        const subscribers = JSON.parse(await fs.readFile(SUBSCRIBERS_FILE, 'utf8'));

        if (subscribers.includes(email)) {
            return res.status(409).json({ error: 'This email is already subscribed.' });
        }

        subscribers.push(email);
        await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));

        res.status(201).json({ success: true, message: 'Successfully subscribed!' });

    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Could not process subscription.' });
    }
});

module.exports = router;