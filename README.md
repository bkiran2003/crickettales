# 🏏 CricketTales - A Full-Stack Community Story Platform

Welcome to **CricketTales**! This is a full-featured web application built for cricket lovers to **share**, **read**, **vote on**, and **promote** their favorite cricket stories.

---

## 🖼️ Application Screenshots

<!-- Replace these image URLs with actual screenshots -->
### 🏠 Home Page
![Home Screenshot](link-to-your-home-screenshot)

### 📚 Stories Page with Filtering
![Stories Screenshot](link-to-your-stories-screenshot)

### 📱 Mobile Responsive View
![Mobile Screenshot](link-to-your-mobile-screenshot)

### 📖 Story Detail Page
![Story Detail Screenshot](link-to-your-story-detail-screenshot)

---

## ✨ Key Features & Fixes

This project has been **rewritten from scratch** to resolve bugs, add features, and ensure long-term stability.

### ✅ Features

- **🚀 Full-Stack Architecture**  
  Migrated from static HTML to a powerful **Node.js + Express** backend for handling data, APIs, and core logic.

- **📱 Fully Responsive UI**  
  Works beautifully across mobile, tablet, and desktop.

- **📝 Dynamic Story Submission**  
  Users can submit stories via a form that sends data to `POST /api/stories`. New stories appear **dynamically** without page reload.

- **📩 Newsletter Subscription**  
  Footer form sends emails to `POST /api/newsletter-subscribe`.

- **🔍 Filter Stories by Tag**  
  A dropdown filter on the Stories page fetches stories by category (`GET /api/stories?tag={tag}`).

- **📖 Story Detail Navigation**  
  Clickable story cards redirect to `/stories/{id}` and show full content.

- **🔐 One-Vote-Per-Email System**  
  Secure voting backend prevents duplicate votes. UI disables the button after voting.

- **💳 Boost Your Tale (Stripe Integration)**  
  Boost stories using Stripe Checkout. Errors are gracefully handled with user-friendly feedback.

- **🧼 Clean Console & Error Feedback**  
  All console errors resolved. Persistent error banner shows helpful API messages.

- **♿ Accessibility & Performance**  
  Semantic HTML & ARIA for screen readers. Optimized assets for faster load times.

- **🗂️ Organized Codebase**  
  Clear structure with `public/`, `api/`, and `data/` folders for better maintainability.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js  
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)  
- **Payments**: Stripe API  
- **Database**: Flat-file JSON (for simplicity)  
- **Deployment**: Node.js environment (e.g., Hostinger)

---

## ⚙️ How to Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### 2. Clone the Repository
```bash
git clone https://github.com/bkiran2003/crickettales.git
cd crickettales

