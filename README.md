# BigQuery Release Notes Viewer & X (Twitter) Sharing App

A modern, highly polished web application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript** that fetches the official Google Cloud BigQuery Release Notes feed, structures them beautifully, and enables users to instantly draft and share updates to **X (formerly Twitter)** with a premium built-in composer preview.

---

## ✨ Features

- 🔄 **Live RSS Feed Sync**: Real-time fetching and parsing of the official BigQuery Release Notes XML feed.
- 🎨 **Premium Glassmorphic UI**: Beautiful dark-mode design with custom animations, interactive timelines, and glowing accent badges for different update categories (Features, Fixes, Issues, Deprecations, General).
- 🔍 **Instant Search & Filters**: Type to search keywords instantly across titles, categories, and descriptions, or filter by specific update types using interactive pills.
- 🐦 **Custom X (Twitter) Composer Modal**: 
  - Real-time preview matching X's native user interface.
  - Interactive SVG radial progress ring that tracks character limits (280 characters).
  - Automatically drafts emojis, categorized titles, snippets, and official links.
- 📋 **Copy to Clipboard**: One-click formatted text copying with beautiful toast notifications.

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask
- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid, Glassmorphic panels), Modern ES6+ JavaScript
- **Icons**: FontAwesome 6

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have **Python 3** installed on your system.

### 2. Install Dependencies
Navigate to the project folder and install the required Python packages:
```bash
pip install flask
```

### 3. Run the Application
Start the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 📂 Project Structure

```text
bigquery-notes/
├── app.py                  # Flask backend (fetches & parses XML to JSON)
├── templates/
│   └── index.html          # Frontend HTML structure & X composer modal
├── static/
│   ├── css/
│   │   └── style.css       # Premium CSS design stylesheet
│   └── js/
│   │   └── app.js          # App logic, filters, clipboard, & modal math
└── .gitignore              # Files to ignore in Git version control
```

---

## 📄 License
This project is open-source and available under the MIT License.
