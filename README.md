# NutriTrack

NutriTrack is a fully client-side, Free and Open Source Software (FOSS) calorie tracking web application. Designed for privacy, speed, and offline reliability, it requires no account creation or external server connection, keeping all your nutritional logs securely saved in your browser's local storage.

---

## Key Features

- ** Comprehensive Daily Tracking**: Log daily intake (Calories, Proteins, Carbs, Fats) and water consumption.
- ** NutriMemory Search Engine**: Fast, token-based local food search featuring subsequence matching and score boosting for recently logged or pinned foods.
- ** MET Activity Calorie Calculator**: Log exercises and estimate calories burned using MET value estimates directly from clinical activity ratios.
- ** Custom Intake Goals**: Set personalized targets for macronutrients (protein, carbs, fat), general calories, and water intake.
- ** Meal Templates & Custom Foods**: Create reusable food entries and save composite meal layouts for quick log convenience.
- ** Weight Logging & Tracking**: Maintain historical tracking of body weight goals.
- **⌨ Keyboard-Driven UX**: Full shortcuts support for hands-on-keyboard logging (e.g. `/` for search, `Ctrl+Z` to undo, `M` for NutriMemory).
- ** JSON Data Export & Import**: Backup or move your data with local file operations (zero server dependency).

---

## Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `/` or `Ctrl + K` | Focus food search input |
| `Ctrl + Enter` | Log selected food entry |
| `Ctrl + Z` | Undo last logged action |
| `↑` `↓` | Navigate suggestions list |
| `Enter` | Choose focused item / submit |
| `Esc` | Close any active modal |
| `H` | Toggle history drawer |
| `M` | Open NutriMemory panel |
| `G` | Toggle goals modal |
| `W` | Log current body weight |
| `E` | Open activity/exercise calculator |
| `?` | Show shortcut overview panel |

---

## Local Setup

Since LogYourCals is built using pure ESM modules without complex build pipelines, you can run it directly:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/siddarth1872004/NutriTrack.git
   cd NutriTrack
   ```

2. **Run a local static web server**:
   You can serve the static files using standard server tools:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node (npx)
   npx serve .
   ```

3. Open your browser and navigate to **`http://localhost:8000`** (or the port specified by your static server).

---

## File Structure

```
LogYourCals/
├── index.html       # Single Page Application layout & Modals
├── css/
│   └── styles.css   # Main layout, typography, dark mode & transitions
├── js/
│   ├── app.js       # Main runtime controller (modals, keyboard triggers, UI sync)
│   ├── foods.js     # Curated local database containing 3,000+ different dishes
│   ├── user_foods.js# LocalStorage handlers for user-created custom entries
│   ├── memory.js    # NutriMemory search index and scoring algorithms
│   └── text_db.js   # Local text parser helpers
└── README.md
```

---

## License

MIT License
