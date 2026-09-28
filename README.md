# NutriTrack -- Client-Side Calorie and Weight Tracker

NutriTrack is a privacy-first, free and open-source (FOSS) nutrition tracking and body weight logging application built with pure HTML5, Vanilla CSS, and JavaScript. It operates entirely client-side -- preserving user privacy by storing all meal logs, custom recipes, and weight trends in browser LocalStorage without any external backend servers or data telemetry.

**Live app:** https://siddarth1872004.github.io/NutriTrack/

---

## Architecture Topology

```mermaid
graph TB
    subgraph UI_LAYER["HTML5 and CSS Web Interface"]
        DASH["Dashboard Overview"]
        LOG["Daily Meal and Calorie Logger"]
        WEIGHT["Weight Tracking and Progress Chart"]
        CALC["TDEE / MET Activity Calculator"]
    end

    subgraph ENGINE["Core JavaScript Engine - app.js"]
        MACRO["Macro Target Calculator - Protein, Carbs, Fat"]
        SEARCH["Offline Food Database Search Engine"]
        CUSTOM["Custom Meal and Recipe Builder"]
    end

    subgraph LOCAL_DATA["Browser Storage Layer - memory.js"]
        FOOD_DB["Local Food Database - foods.js"]
        USER_DATA["User Custom Foods - user_foods.js"]
        LOCAL_STORAGE["Browser LocalStorage Logs and Profile"]
    end

    DASH --> MACRO
    LOG --> MACRO
    WEIGHT --> MACRO
    CALC --> MACRO

    DASH --> SEARCH
    LOG --> SEARCH
    CALC --> SEARCH

    SEARCH --> FOOD_DB
    SEARCH --> USER_DATA

    MACRO --> LOCAL_STORAGE
    CUSTOM --> LOCAL_STORAGE

    style UI_LAYER fill:#18181b,stroke:#a1a1aa,color:#fff
    style ENGINE fill:#000000,stroke:#ffffff,color:#fff
    style LOCAL_DATA fill:#18181b,stroke:#e4e4e7,color:#fff
```

---

## Daily Workflow Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User / Browser
    participant App as Application Engine
    participant FoodDB as Offline Food Database
    participant Storage as Browser LocalStorage

    User->>App: Enter daily weight and activity level
    App->>App: Calculate TDEE and Macro target goals
    User->>App: Search food item (e.g. Chicken Breast)
    App->>FoodDB: Query offline database
    FoodDB-->>App: Return macro profile per 100g
    User->>App: Log portion size (e.g. 200g)
    App->>Storage: Update daily calorie and macro total
    Storage-->>App: Return historical trend data
    App-->>User: Render updated progress bar and weight chart
```

---

## Key Features

- **100% Client-Side Privacy**: No account registration, zero remote servers, no third-party tracking. All data remains strictly on your device.
- **Offline Food Database**: Embedded database containing hundreds of common food items with macro breakdowns (calories, protein, carbs, fats).
- **TDEE and BMR Calculator**: Calculates Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation and MET activity factors.
- **Weight and Goal Progress Tracking**: Monitors body weight trajectory over time with visual progress indicators.
- **Zero Dependencies**: Lightweight, framework-free single-page application requiring no npm install or build step.

---

## Directory Structure

```
NutriTrack/
|-- index.html              # Main application single-page structure
|-- favicon.svg             # App icon
|-- README.md               # Architecture and user documentation
|-- LICENSE                 # MIT License file
|-- css/
|   `-- styles.css          # Main UI layout and responsive styles
`-- js/                     # Application JavaScript logic (ES modules)
    |-- app.js              # Main application orchestrator and UI controller
    |-- foods.js            # Offline nutritional database
    |-- user_foods.js       # Custom user recipes and food storage
    `-- memory.js           # LocalStorage persistent storage wrapper
```

---

## Quick Start Guide

### Running Locally

Because NutriTrack is a client-side web app with zero server dependencies, you can run it in any modern browser:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/siddarth1872004/NutriTrack.git
   cd NutriTrack
   ```

2. **Serve the folder** (the app uses ES modules, which browsers block over `file://`, so use a local web server rather than double-clicking `index.html`):
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`.

### Deploying to GitHub Pages

NutriTrack is a static site, so GitHub Pages can serve it straight from the repository with no build step.

1. In the repository, open **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick `main` and `/ (root)`, then click **Save**.
3. After a minute the site is live at `https://siddarth1872004.github.io/NutriTrack/`. Every push to `main` updates it automatically.

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.
