# BigQuery Release Notes Explorer

A beautiful web application built using Python Flask, vanilla HTML, CSS, and JavaScript. It fetches the latest Google BigQuery release notes from the official Google Cloud feed, parses them, organizes them into individual updates by category, and provides a sleek interface to browse, search, filter, and compose custom posts to X (formerly Twitter) with a real-time post preview.

## Features

- **Automated RSS Feed Parsing:** Fetches release notes in real-time directly from Google Cloud.
- **Micro-Categorization:** Automatically breaks down a day's releases into individual, self-contained update cards based on categories (e.g., `Feature`, `Change`, `Deprecation`, `Bug Fix`).
- **Interactive UI/UX:** Built with a premium glassmorphic dark-mode design, smooth timeline transitions, and loading states.
- **Search & Filter:** Instant local searching and filtering by categories.
- **Interactive X Composer:**
  - Standard Twitter/X dark mode post UI.
  - Live character counts (280 characters limit) with warning states.
  - Smart automatic tweet pre-population: summarizes updates to fit standard tweet boundaries and appends hashtags and links automatically.
  - Custom progress ring reflecting remaining character counts.
  - One-click tweet sharing via Twitter Web Intents.

## Installation & Setup

1. **Clone or navigate to the directory:**
   ```bash
   cd /Users/zainabalmahel/Downloads/agy-cli-projects/bq-releases-notes
   ```

2. **Run the Flask Application:**
   Python 3.12 is already installed. Start the server using:
   ```bash
   python3 app.py
   ```
   *(Note: The server launches on port `5001` to prevent conflicts with macOS AirPlay, which occupies the default port `5000`).*

3. **Access the Web App:**
   Open your browser and navigate to:
   [http://localhost:5001](http://localhost:5001)

## Files Created

- [app.py](file:///Users/zainabalmahel/Downloads/agy-cli-projects/bq-releases-notes/app.py) - Flask backend script that queries the BigQuery RSS Feed and returns structured JSON to the frontend.
- [templates/index.html](file:///Users/zainabalmahel/Downloads/agy-cli-projects/bq-releases-notes/templates/index.html) - Main layout structure containing the release stream feed wrapper and the X Composer template.
- [static/css/styles.css](file:///Users/zainabalmahel/Downloads/agy-cli-projects/bq-releases-notes/static/css/styles.css) - Premium visual styles containing color schemes, hover behaviors, responsive queries, and progress rings.
- [static/js/app.js](file:///Users/zainabalmahel/Downloads/agy-cli-projects/bq-releases-notes/static/js/app.js) - Core application logic dealing with XML/HTML parsing, active search, selection states, and composer computations.
