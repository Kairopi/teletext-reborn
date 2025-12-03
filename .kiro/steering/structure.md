# Project Structure

```
teletext-reborn/
├── index.html              # Single page entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js             # Application entry point
│   ├── styles/
│   │   ├── main.css        # Layout and responsive styles
│   │   ├── teletext.css    # Colors, typography, grid
│   │   ├── crt-effects.css # Scanlines, glow, vignette, curvature
│   │   └── animations.css  # CSS keyframe animations
│   ├── js/
│   │   ├── app.js          # Main TeletextScreen component
│   │   ├── router.js       # Page navigation (3-digit page numbers)
│   │   ├── state.js        # Settings & cache management
│   │   ├── animations/
│   │   │   ├── boot.js     # Boot sequence (3s max)
│   │   │   ├── transitions.js # Page transitions (0.3-0.4s)
│   │   │   ├── timeTravel.js  # Time travel effect (2.5s)
│   │   │   └── effects.js  # Micro-interactions
│   │   ├── pages/
│   │   │   ├── home.js     # Page 100
│   │   │   ├── news.js     # Pages 101-109
│   │   │   ├── weather.js  # Pages 200-209
│   │   │   ├── finance.js  # Pages 300-309
│   │   │   ├── timeMachine.js # Pages 500-502
│   │   │   ├── settings.js # Page 900
│   │   │   └── about.js    # Page 999
│   │   ├── services/
│   │   │   ├── api.js      # Base fetch wrapper with retry
│   │   │   ├── newsApi.js
│   │   │   ├── weatherApi.js
│   │   │   ├── financeApi.js
│   │   │   ├── wikipediaApi.js
│   │   │   └── cache.js    # localStorage caching layer
│   │   └── utils/
│   │       ├── teletext.js # Text formatting (40-char truncation)
│   │       ├── date.js     # Date validation & formatting
│   │       └── storage.js  # localStorage utilities
│   └── assets/
│       └── sounds/         # Optional sound effects
└── public/
    └── favicon.ico
```

## Key Patterns

- **Pages**: Each page exports `render()`, `onMount()`, `onUnmount()`, `getFastextButtons()`
- **Services**: API modules handle fetching, parsing, and caching
- **State**: Centralized StateManager for settings and Time Machine date
- **Router**: 3-digit page numbers (100-999), keyboard shortcuts (1-9, arrows, Escape)
