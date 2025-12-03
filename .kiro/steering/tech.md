# Tech Stack

## Core Technologies

- **Frontend**: Vanilla JavaScript (ES6+) with HTML5/CSS3
- **Build Tool**: Vite
- **Animations**: GSAP 3.x (GreenSock Animation Platform)
- **Font**: Press Start 2P (Google Fonts)
- **Storage**: localStorage for caching and user preferences

## External APIs

| API | Endpoint | Purpose | Cache TTL | Rate Limit |
|-----|----------|---------|-----------|------------|
| Open-Meteo | api.open-meteo.com | Current weather | 15 min | Unlimited |
| Open-Meteo Archive | archive-api.open-meteo.com | Historical weather | 24 hours | Unlimited |
| Wikipedia | api.wikimedia.org | On This Day events | 24 hours | Unlimited |
| NewsData.io | newsdata.io | News headlines | 5 min | 200/day |
| CoinGecko | api.coingecko.com | Crypto prices | 1 min | 50/min |
| IP-API | ip-api.com | Geolocation | Session | 45/min |

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Key Dependencies

- `gsap` - Animation library (REQUIRED for all animations)
- `fast-check` - Property-based testing (dev)
- `vitest` - Test runner (dev)

## Design Constraints (STRICT - NO EXCEPTIONS)

### Colors (Only these 8)
```
#000000 - Black
#FF0000 - Red
#00FF00 - Green
#FFFF00 - Yellow
#0000FF - Blue
#FF00FF - Magenta
#00FFFF - Cyan
#FFFFFF - White
```

### Typography
- Font: "Press Start 2P" ONLY
- Base size: 14-16px
- Line width: 40 characters MAXIMUM

### Layout
- Aspect ratio: 4:3
- Max width: 800px
- Grid: 40 columns × 22 rows

### Animation Timings
| Animation | Duration | GSAP Ease |
|-----------|----------|-----------|
| Page transitions | 0.3-0.4s | power2.inOut |
| Boot sequence | 3s max | power4.out |
| Time travel | 2.5s | expo.inOut |
| Button hover | 0.15s | power1.out |
| Menu stagger | 0.05s/item | power2.out |

## Related Documents

- See `api-patterns.md` for detailed API integration patterns
- See `agent.md` for implementation rules
- See `.kiro/specs/teletext-reborn/design.md` for full technical specs
