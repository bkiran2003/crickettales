// api/stories.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to ensure data directory and files exist
const ensureDataFiles = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
    try { await fs.access(STORIES_FILE); } catch { await fs.writeFile(STORIES_FILE, '[]'); }
    try { await fs.access(VOTES_FILE); } catch { await fs.writeFile(VOTES_FILE, '{}'); }
};

// Helper to read data
const readData = async (file) => {
    await ensureDataFiles();
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
};

// Helper to write data
const writeData = async (file, data) => {
    await ensureDataFiles();
    await fs.writeFile(file, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// GET /api/stories/config - Get public configuration
router.get('/config', (req, res) => {
    res.json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});

// GET /api/stories - Get all stories with filtering and pagination
router.get('/', async (req, res) => {
    try {
        let stories = await readData(STORIES_FILE);
        const { tag, limit = 10 } = req.query;

        if (tag && tag !== 'all') {
            stories = stories.filter(story => story.tag === tag);
        }

        const paginatedStories = stories.slice(0, parseInt(limit));
        
        res.json({ stories: paginatedStories });
    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});

// GET /api/stories/:id - Get a single story by ID
router.get('/:id', async (req, res) => {
    try {
        const stories = await readData(STORIES_FILE);
        const story = stories.find(s => s.id === req.params.id);
        if (story) {
            res.json(story);
        } else {
            res.status(404).json({ error: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch story' });
    }
});

// POST /api/stories - Submit a new story
router.post('/', async (req, res) => {
    try {
        const { name, email, title, tag, story } = req.body;
        if (!name || !email || !title || !tag || !story) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const stories = await readData(STORIES_FILE);
        const newStory = {
            id: `story-${Date.now()}`,
            name: name.trim(),
            email: email.trim(),
            title: title.trim(),
            tag: tag.trim(),
            story: story.trim(),
            votes: 0,
            boosted: false,
            createdAt: new Date().toISOString(),
            excerpt: story.trim().substring(0, 120) + (story.length > 120 ? '...' : '')
        };

        stories.unshift(newStory); // Add to the beginning
        await writeData(STORIES_FILE, stories);
        res.status(201).json(newStory);

    } catch (error) {
        console.error('Story submission error:', error);
        res.status(500).json({ error: 'Failed to submit story' });
    }
});

// POST /api/stories/:id/vote - Vote for a story
router.post('/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required to vote.' });
        }

        const stories = await readData(STORIES_FILE);
        const votes = await readData(VOTES_FILE);
        
        const storyIndex = stories.findIndex(s => s.id === id);
        if (storyIndex === -1) {
            return res.status(404).json({ error: 'Story not found.' });
        }

        // One vote rule: Check if this email has already voted for this story
        if (votes[id] && votes[id].includes(email)) {
            return res.status(403).json({ error: 'You have already voted for this story.' });
        }

        // Update vote count
        stories[storyIndex].votes += 1;
        
        // Record the vote
        if (!votes[id]) {
            votes[id] = [];
        }
        votes[id].push(email);

        await writeData(STORIES_FILE, stories);
        await writeData(VOTES_FILE, votes);

        res.json({ success: true, newVoteCount: stories[storyIndex].votes });

    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Failed to process vote' });
    }
});

// POST /api/stories/:id/create-boost-session - Create a Stripe Checkout session
router.post('/:id/create-boost-session', async (req, res) => {
    const { id } = req.params;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Cricket Story Boost',
                        description: `Boost story ID: ${id}`,
                    },
                    unit_amount: 200, // $2.00 in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.SITE_URL}/cancel.html`,
            metadata: { storyId: id },
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: 'Payment session creation failed.' });
    }
});

// POST /api/stories/stripe-webhook - Handle events from Stripe
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const storyId = session.metadata.storyId;

        console.log(`Payment successful for story: ${storyId}`);

        // Fulfill the purchase: update the story to be "boosted"
        const stories = await readData(STORIES_FILE);
        const storyIndex = stories.findIndex(s => s.id === storyId);

        if (storyIndex !== -1) {
            stories[storyIndex].boosted = true;
            await writeData(STORIES_FILE, stories);
            console.log(`Story ${storyId} has been boosted!`);
        }
    }

    res.status(200).json({ received: true });
});

module.exports = router;