// public/js/main.js
const apiBase = '/api';
const appRoot = document.getElementById('app-root');
const errorBanner = document.getElementById('error-banner');
let stripe = null;

// --- UTILITY FUNCTIONS ---
const showLoading = () => {
    appRoot.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
};

const showError = (message) => {
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
    // Hide after 5 seconds
    setTimeout(() => errorBanner.style.display = 'none', 5000);
};

const renderStoryCard = (story) => {
    const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
    const hasVoted = userVotes[story.id];

    return `
        <div class="card story-card" data-id="${story.id}" role="article" aria-labelledby="title-${story.id}">
            ${story.boosted ? '<span class="boosted-badge">🚀 Boosted</span>' : ''}
            <div class="story-meta">
                <span>By ${story.name}</span>
                <span>${new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 class="story-title" id="title-${story.id}">${story.title}</h3>
            <p class="story-excerpt">${story.excerpt}</p>
            <div class="vote-widget">
                <span class="vote-count">⭐ ${story.votes} votes</span>
                <button class="btn btn-vote ${hasVoted ? 'voted' : ''}" data-story-id="${story.id}" ${hasVoted ? 'disabled' : ''}>
                    ${hasVoted ? '✅ Voted' : 'Vote'}
                </button>
            </div>
        </div>
    `;
};

// --- RENDER FUNCTIONS (VIEWS) ---
const renderHomePage = () => {
    appRoot.innerHTML = `
        <section class="hero">
            <div class="container">
                <h1>Share Your Cricket Tales</h1>
                <p>A community-driven platform for match stories, player legends, and personal cricket memories.</p>
                <a href="#submit" class="btn btn-primary">Share Your Story</a>
            </div>
        </section>
        <section class="container">
            <h2 class="section-title">Featured Stories</h2>
            <div id="featured-stories" class="story-grid">
                <div class="spinner-container"><div class="spinner"></div></div>
            </div>
        </section>
    `;
    loadStories(3, '#featured-stories'); // Load 3 featured stories
};

const renderStoriesPage = async () => {
    appRoot.innerHTML = `
        <div class="container">
            <h2 class="section-title">All Cricket Tales</h2>
            <div class="filter-controls">
                <label for="tag-filter">Filter by Tag:</label>
                <select id="tag-filter">
                    <option value="all">All Tags</option>
                    <option value="classic-match">Classic Match</option>
                    <option value="player-legend">Player Legend</option>
                    <option value="personal-memory">Personal Memory</option>
                    <option value="gully-cricket">Gully Cricket</option>
                </select>
            </div>
            <div id="all-stories" class="story-grid">
                 <div class="spinner-container"><div class="spinner"></div></div>
            </div>
        </div>
    `;
    document.getElementById('tag-filter').addEventListener('change', (e) => {
        loadStories(10, '#all-stories', e.target.value);
    });
    loadStories(10, '#all-stories'); // Load initial 10 stories
};

const renderSubmitPage = () => {
    appRoot.innerHTML = `
        <section class="form-section">
            <div class="container">
                <div class="form-container">
                    <div class="card">
                        <h2 class="section-title">Share Your Cricket Tale</h2>
                        <form id="story-form">
                            <div id="form-message"></div>
                            <div class="form-group">
                                <label for="author-name">Your Name</label>
                                <input type="text" id="author-name" class="form-control" required placeholder="Sachin Tendulkar">
                            </div>
                            <div class="form-group">
                                <label for="author-email">Email Address</label>
                                <input type="email" id="author-email" class="form-control" required placeholder="your.email@example.com">
                            </div>
                             <div class="form-group">
                                <label for="story-title">Story Title</label>
                                <input type="text" id="story-title" class="form-control" required placeholder="The Day We Won the World Cup">
                            </div>
                            <div class="form-group">
                                <label for="story-tag">Tag</label>
                                <select id="story-tag" class="form-control" required>
                                    <option value="" disabled selected>Select a tag...</option>
                                    <option value="classic-match">Classic Match</option>
                                    <option value="player-legend">Player Legend</option>
                                    <option value="personal-memory">Personal Memory</option>
                                    <option value="gully-cricket">Gully Cricket</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="story-text">Your Cricket Story</label>
                                <textarea id="story-text" class="form-control" required placeholder="Share your unforgettable cricket moment..."></textarea>
                            </div>
                            <button type="submit" id="submit-btn" class="btn btn-primary" style="width: 100%;">
                                Submit Your Story <span id="submit-spinner" style="display: none;"><div class="spinner"></div></span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    `;
};

const renderStoryDetailPage = async (storyId) => {
    showLoading();
    try {
        const res = await fetch(`${apiBase}/stories/${storyId}`);
        if (!res.ok) throw new Error('Story not found.');
        const story = await res.json();

        appRoot.innerHTML = `
            <div class="story-detail-container card">
                <header class="story-detail-header">
                    <h1 class="story-detail-title">${story.title}</h1>
                    <p class="story-detail-meta">By ${story.name} on ${new Date(story.createdAt).toLocaleDateString()}</p>
                </header>
                <div class="story-detail-content">
                    <p>${story.story}</p>
                </div>
                <div class="boost-section" style="margin-top: 2rem; border-top: 1px solid var(--border-gray); padding-top: 1.5rem; text-align: center;">
                    <h3>Enjoy this story?</h3>
                    <p>Give it a boost to help it reach more fans!</p>
                    <button id="boost-btn" class="btn btn-primary" data-story-id="${story.id}">
                        🚀 Boost This Tale - $2.00
                    </button>
                    <div id="payment-message" class="form-message"></div>
                </div>
            </div>
        `;
    } catch (err) {
        showError(err.message);
        renderStoriesPage();
    }
};

// --- API & EVENT LOGIC ---
const loadStories = async (limit = 10, container = '#all-stories', tag = 'all') => {
    const storyContainer = document.querySelector(container);
    storyContainer.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
    
    let url = `${apiBase}/stories?limit=${limit}`;
    if (tag && tag !== 'all') {
        url += `&tag=${tag}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Could not fetch stories.');
        const { stories } = await res.json();
        
        if (stories.length === 0) {
            storyContainer.innerHTML = `<p style="text-align: center;">No stories found for this tag.</p>`;
        } else {
            storyContainer.innerHTML = stories.map(renderStoryCard).join('');
        }
    } catch (err) {
        showError(err.message);
        storyContainer.innerHTML = `<p style="text-align: center;">Could not load stories. Please try again later.</p>`;
    }
};

const handleStorySubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const spinner = document.getElementById('submit-spinner');
    const messageDiv = document.getElementById('form-message');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    messageDiv.innerHTML = '';

    const formData = {
        name: form['author-name'].value,
        email: form['author-email'].value,
        title: form['story-title'].value,
        tag: form['story-tag'].value,
        story: form['story-text'].value,
    };

    try {
        const res = await fetch(`${apiBase}/stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Submission failed.');
        
        messageDiv.innerHTML = `<div class="alert alert-success">🎉 Story submitted successfully!</div>`;
        form.reset();
        // Navigate to stories page after 2 seconds to see the new story
        setTimeout(() => window.location.hash = '#stories', 2000);

    } catch (err) {
        messageDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
        submitBtn.disabled = false;
        spinner.style.display = 'none';
    }
};

const handleVote = async (e) => {
    const button = e.target;
    const storyId = button.dataset.storyId;

    if (button.disabled) return;

    button.disabled = true;
    button.innerHTML = 'Voting...';

    try {
        const email = prompt("To prevent duplicate votes, please enter your email:");
        if (!email) {
            button.disabled = false;
            button.innerHTML = 'Vote';
            return;
        }

        const res = await fetch(`${apiBase}/stories/${storyId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Vote failed.');

        // Update UI
        const voteCountEl = button.parentElement.querySelector('.vote-count');
        voteCountEl.textContent = `⭐ ${data.newVoteCount} votes`;
        button.innerHTML = '✅ Voted';
        button.classList.add('voted');

        // Store vote in localStorage
        const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
        userVotes[storyId] = true;
        localStorage.setItem('userVotes', JSON.stringify(userVotes));

    } catch (err) {
        showError(err.message);
        button.disabled = false;
        button.innerHTML = 'Vote';
    }
};

const handleBoost = async (e) => {
    if (!stripe) {
        showError('Stripe is not initialized. Please try again in a moment.');
        return;
    }
    const button = e.target;
    const storyId = button.dataset.storyId;
    const paymentMessage = document.getElementById('payment-message');
    
    button.disabled = true;
    button.innerHTML = 'Processing...';
    paymentMessage.textContent = '';

    try {
        const res = await fetch(`${apiBase}/stories/${storyId}/create-boost-session`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Could not create payment session.');
        
        const session = await res.json();
        const result = await stripe.redirectToCheckout({ sessionId: session.id });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch(err) {
        paymentMessage.innerHTML = `<div class="alert alert-error">Payment failed: ${err.message}</div>`;
        button.disabled = false;
        button.innerHTML = '🚀 Boost This Tale - $2.00';
    }
};

const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const messageDiv = document.getElementById('newsletter-message');
    const button = form.querySelector('button');

    button.disabled = true;
    
    try {
        const res = await fetch(`${apiBase}/newsletter-subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Could not subscribe.');

        messageDiv.textContent = '✅ Thanks for subscribing!';
        messageDiv.style.color = 'var(--success-green)';
        form.reset();
    } catch (err) {
        messageDiv.textContent = `Error: ${err.message}`;
        messageDiv.style.color = 'var(--error-red)';
    } finally {
        button.disabled = false;
        setTimeout(() => messageDiv.textContent = '', 5000);
    }
};


// --- ROUTER ---
const routes = {
    '#home': renderHomePage,
    '#stories': renderStoriesPage,
    '#submit': renderSubmitPage,
};

const router = () => {
    const hash = window.location.hash || '#home';
    const [path, id] = hash.split('/');

    const routeHandler = routes[path];

    if (routeHandler) {
        routeHandler();
    } else if (path === '#story' && id) {
        renderStoryDetailPage(id);
    } else {
        renderHomePage(); // Fallback
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === path);
    });
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Basic SPA Router
    window.addEventListener('hashchange', router);
    router(); // Initial route

    // Global event delegation for dynamic content
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.story-card, .story-card *')) {
            const card = e.target.closest('.story-card');
            if (card) window.location.hash = `#story/${card.dataset.id}`;
        }
        if (e.target.matches('.btn-vote')) {
            handleVote(e);
        }
        if (e.target.matches('#boost-btn')) {
            handleBoost(e);
        }
    });
    
    document.body.addEventListener('submit', (e) => {
        if (e.target.matches('#story-form')) {
            handleStorySubmit(e);
        }
        if (e.target.matches('#newsletter-form')) {
            handleNewsletterSubscribe(e);
        }
    });

    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        const isExpanded = navLinks.classList.contains('nav-active');
        navToggle.setAttribute('aria-expanded', isExpanded);
        navToggle.classList.toggle('active', isExpanded);
    });

    // Initialize Stripe
    fetch(`${apiBase}/stories/config`)
        .then(res => res.json())
        .then(config => {
            stripe = Stripe(config.stripePublishableKey);
        })
        .catch(err => showError('Could not initialize payment system.'));
});