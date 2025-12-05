# Design Document: TV Listings & Horoscopes

## Overview

This design document specifies the implementation of TV Listings and Horoscopes features for Teletext Reborn. These features recreate the authentic BBC Ceefax and ITV Oracle experience based on research of original 1990s archives.

### Key Features
- **TV Listings**: Live TV schedule from TVmaze API with authentic Ceefax layout
- **Horoscopes**: Mystical Oracle-style zodiac readings with animations
- **Authentic Design**: Exact color schemes, layouts, and typography from original Teletext

### Tech Stack (Existing)
- Vanilla JavaScript (ES6+)
- GSAP 3.x for animations
- Press Start 2P font
- localStorage for caching

## Architecture

### New Files Structure

```
teletext-reborn/src/js/
├── pages/
│   ├── tvListings.js      # TV Guide pages (600-609)
│   └── horoscopes.js      # Horoscope pages (450-463)
├── services/
│   ├── tvmazeApi.js       # TVmaze API integration
│   └── horoscopeService.js # Horoscope content generator
```

## Components and Interfaces

### TV Listings Page Component

```javascript
// tvListings.js - Page component interface
export function render(pageNumber) {
  // Returns HTML for pages 600-609
}

export function onMount(pageNumber) {
  // Initialize data fetching and animations
}

export function onUnmount() {
  // Cleanup intervals and animations
}

export function getFastextButtons() {
  // Return page-specific Fastext configuration
}
```

### Horoscopes Page Component

```javascript
// horoscopes.js - Page component interface
export function render(pageNumber) {
  // Returns HTML for pages 450-463
}

export function onMount(pageNumber) {
  // Initialize animations and interactions
}

export function onUnmount() {
  // Cleanup animations
}

export function getFastextButtons() {
  // Return page-specific Fastext configuration
}
```

## Data Models

### TV Schedule Data Model

```typescript
interface TVShow {
  id: number;
  name: string;           // Show title
  channel: string;        // Network name (CBS, NBC, etc.)
  airtime: string;        // "20:00"
  runtime: number;        // Duration in minutes
  genres: string[];       // ["Drama", "Action"]
  summary: string;        // Show description
  image: string | null;   // Image URL (not used in Teletext)
}

interface TVSchedule {
  date: string;           // "2025-12-05"
  shows: TVShow[];
  lastUpdated: string;    // ISO timestamp
  _stale: boolean;
  _cached: boolean;
}
```

### Horoscope Data Model

```typescript
interface ZodiacSign {
  id: number;             // 1-12
  name: string;           // "Aries"
  symbol: string;         // "♈"
  element: 'fire' | 'earth' | 'air' | 'water';
  dateRange: string;      // "Mar 21 - Apr 19"
  color: string;          // Teletext color for this sign
}

interface DailyHoroscope {
  sign: ZodiacSign;
  prediction: string;     // Daily reading text
  loveRating: number;     // 1-5
  moneyRating: number;    // 1-5
  healthRating: number;   // 1-5
  luckyNumbers: number[]; // 6 unique numbers 1-49
  luckyColor: string;     // Teletext color name
  bestMatch: string[];    // 2 compatible sign names
  date: string;           // "2025-12-05"
}
```

## Page Layouts

### TV Listings Index (Page 600)

```
┌─────────────────────────────────────────┐
│ TELETEXT        P.600        14:56:12   │
├─────────────────────────────────────────┤
│                                         │
│           📺 TV GUIDE 📺                │
│                                         │
│   FRIDAY 5 DECEMBER 2025                │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│   ► NOW ON TV .............. 601        │
│   ► TONIGHT ................ 602        │
│   ► TOMORROW ............... 603        │
│   ► FULL SCHEDULE .......... 604        │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   TODAY'S HIGHLIGHTS                    │
│                                         │
│   20:00 CBS  Sheriff Country            │
│   21:00 NBC  Happy's Place              │
│   22:00 ABC  Football Championship      │
│                                         │
│   VIA TVMAZE                            │
├─────────────────────────────────────────┤
│ 🔴Home  🟢Now  🟡Tonight  🔵Tomorrow    │
└─────────────────────────────────────────┘
```

### Now On TV (Page 601)

```
┌─────────────────────────────────────────┐
│ TELETEXT        P.601        14:56:12   │
├─────────────────────────────────────────┤
│                                         │
│           NOW ON TV                     │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│   ► 14:30  CBS    Sheriff Country       │
│   ► 14:00  NBC    Days of Our Lives     │
│   ► 14:30  ABC    General Hospital      │
│   ► 14:00  FOX    TMZ Live              │
│     14:30  CW     Maury                 │
│     14:00  ESPN   SportsCenter          │
│     14:30  TBS    Friends               │
│     14:00  USA    Law & Order SVU       │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   LAST UPDATED: 14:55                   │
│                                         │
│   VIA TVMAZE                            │
├─────────────────────────────────────────┤
│ 🔴Index  🟢Tonight  🟡Tomorrow  🔵Refresh│
└─────────────────────────────────────────┘
```

### Horoscopes Index (Page 450)

```
┌─────────────────────────────────────────┐
│ TELETEXT        P.450        14:56:12   │
├─────────────────────────────────────────┤
│                                         │
│        ★ MYSTIC STARS ★                 │
│                                         │
│   The stars reveal your destiny...      │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│   ♈ ARIES    ♉ TAURUS   ♊ GEMINI       │
│   Mar21-Apr19 Apr20-May20 May21-Jun20   │
│                                         │
│   ♋ CANCER   ♌ LEO      ♍ VIRGO        │
│   Jun21-Jul22 Jul23-Aug22 Aug23-Sep22   │
│                                         │
│   ♎ LIBRA    ♏ SCORPIO  ♐ SAGITTARIUS  │
│   Sep23-Oct22 Oct23-Nov21 Nov22-Dec21   │
│                                         │
│   ♑ CAPRICORN ♒ AQUARIUS ♓ PISCES      │
│   Dec22-Jan19 Jan20-Feb18 Feb19-Mar20   │
│                                         │
│   ✨ FRIDAY 5 DECEMBER 2025 ✨           │
├─────────────────────────────────────────┤
│ 🔴Home  🟢YourSign  🟡Lucky#  🔵Love    │
└─────────────────────────────────────────┘
```

### Individual Horoscope (Page 451-462)

```
┌─────────────────────────────────────────┐
│ TELETEXT        P.451        14:56:12   │
├─────────────────────────────────────────┤
│                                         │
│           ♈ ARIES ♈                     │
│         March 21 - April 19             │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   TODAY'S READING                       │
│                                         │
│   The stars align in your favor         │
│   today. New opportunities await        │
│   in unexpected places. Trust your      │
│   instincts and take bold action.       │
│                                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   LOVE:   ★★★★☆   MONEY:  ★★★☆☆        │
│   HEALTH: ★★★★★                         │
│                                         │
│   LUCKY NUMBERS: 7 14 23 31 38 42       │
│   LUCKY COLOR:   CYAN                   │
│   BEST MATCH:    LEO, SAGITTARIUS       │
│                                         │
│   ◄ PISCES              TAURUS ►        │
├─────────────────────────────────────────┤
│ 🔴AllSigns  🟢Prev  🟡Next  🔵Lucky#    │
└─────────────────────────────────────────┘
```

## API Integration

### TVmaze API Service

```javascript
// tvmazeApi.js
const TVMAZE_API = 'https://api.tvmaze.com';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function getSchedule(country = 'US', date = null) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const url = `${TVMAZE_API}/schedule?country=${country}&date=${dateStr}`;
  
  // Check cache first
  const cached = getCache(`tv_schedule_${country}_${dateStr}`);
  if (cached && !isExpired(cached)) {
    return { ...cached.data, _cached: true };
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const parsed = parseSchedule(data);
    
    setCache(`tv_schedule_${country}_${dateStr}`, parsed, CACHE_TTL);
    return parsed;
  } catch (error) {
    // Return cached data on error
    if (cached) {
      return { ...cached.data, _stale: true, _error: error.message };
    }
    throw error;
  }
}

function parseSchedule(data) {
  return data.map(item => ({
    id: item.id,
    name: item.show?.name || 'Unknown',
    channel: item.show?.network?.name || item.show?.webChannel?.name || 'N/A',
    airtime: item.airtime || '00:00',
    runtime: item.runtime || 30,
    genres: item.show?.genres || [],
    summary: item.show?.summary?.replace(/<[^>]*>/g, '') || ''
  })).sort((a, b) => a.airtime.localeCompare(b.airtime));
}
```

### Horoscope Content Generator

```javascript
// horoscopeService.js
const ZODIAC_SIGNS = [
  { id: 1, name: 'Aries', symbol: '♈', element: 'fire', dateRange: 'Mar 21 - Apr 19', color: '#FF0000' },
  { id: 2, name: 'Taurus', symbol: '♉', element: 'earth', dateRange: 'Apr 20 - May 20', color: '#00FF00' },
  { id: 3, name: 'Gemini', symbol: '♊', element: 'air', dateRange: 'May 21 - Jun 20', color: '#00FFFF' },
  { id: 4, name: 'Cancer', symbol: '♋', element: 'water', dateRange: 'Jun 21 - Jul 22', color: '#FF00FF' },
  { id: 5, name: 'Leo', symbol: '♌', element: 'fire', dateRange: 'Jul 23 - Aug 22', color: '#FF0000' },
  { id: 6, name: 'Virgo', symbol: '♍', element: 'earth', dateRange: 'Aug 23 - Sep 22', color: '#00FF00' },
  { id: 7, name: 'Libra', symbol: '♎', element: 'air', dateRange: 'Sep 23 - Oct 22', color: '#00FFFF' },
  { id: 8, name: 'Scorpio', symbol: '♏', element: 'water', dateRange: 'Oct 23 - Nov 21', color: '#FF00FF' },
  { id: 9, name: 'Sagittarius', symbol: '♐', element: 'fire', dateRange: 'Nov 22 - Dec 21', color: '#FF0000' },
  { id: 10, name: 'Capricorn', symbol: '♑', element: 'earth', dateRange: 'Dec 22 - Jan 19', color: '#00FF00' },
  { id: 11, name: 'Aquarius', symbol: '♒', element: 'air', dateRange: 'Jan 20 - Feb 18', color: '#00FFFF' },
  { id: 12, name: 'Pisces', symbol: '♓', element: 'water', dateRange: 'Feb 19 - Mar 20', color: '#FF00FF' }
];

const PREDICTIONS = [
  "The stars align in your favor today. New opportunities await in unexpected places.",
  "A chance encounter could lead to exciting developments. Stay open to possibilities.",
  "Your creative energy is at its peak. Channel it into projects close to your heart.",
  "Financial matters require careful attention. Review your plans before committing.",
  "Romance is in the air. Express your feelings to someone special today.",
  // ... 45+ more authentic mystical phrases
];

export function getDailyHoroscope(signId) {
  const sign = ZODIAC_SIGNS.find(s => s.id === signId);
  const dateHash = hashDate(new Date());
  const predictionIndex = (signId + dateHash) % PREDICTIONS.length;
  
  return {
    sign,
    prediction: PREDICTIONS[predictionIndex],
    loveRating: generateRating(signId, dateHash, 'love'),
    moneyRating: generateRating(signId, dateHash, 'money'),
    healthRating: generateRating(signId, dateHash, 'health'),
    luckyNumbers: generateLuckyNumbers(signId, dateHash),
    luckyColor: generateLuckyColor(signId, dateHash),
    bestMatch: getCompatibleSigns(signId),
    date: new Date().toISOString().split('T')[0]
  };
}

function generateLuckyNumbers(signId, dateHash) {
  const numbers = new Set();
  let seed = signId * 1000 + dateHash;
  while (numbers.size < 6) {
    seed = (seed * 9301 + 49297) % 233280;
    numbers.add((seed % 49) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}
```

## GSAP Animation Specifications

### Horoscope Star Twinkle Animation

```javascript
function createStarTwinkle() {
  const stars = document.querySelectorAll('.star-decoration');
  
  stars.forEach((star, index) => {
    gsap.to(star, {
      opacity: 0.3,
      duration: 0.5 + (index * 0.1),
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: index * 0.2
    });
  });
}
```

### Lucky Numbers Slot Machine Animation

```javascript
function animateLuckyNumbers(numbers, container) {
  const tl = gsap.timeline();
  const numberElements = container.querySelectorAll('.lucky-number');
  
  numberElements.forEach((el, index) => {
    // Rapid number cycling
    tl.to(el, {
      innerText: '??',
      duration: 0,
    }, index * 0.1);
    
    // Slot machine roll effect
    for (let i = 0; i < 10; i++) {
      tl.to(el, {
        innerText: Math.floor(Math.random() * 49) + 1,
        duration: 0.05,
        ease: 'none'
      });
    }
    
    // Final number reveal
    tl.to(el, {
      innerText: numbers[index],
      duration: 0.1,
      ease: 'power2.out'
    });
    
    // Flash effect on reveal
    tl.to(el, {
      color: '#FFFFFF',
      duration: 0.1,
      yoyo: true,
      repeat: 1
    }, '-=0.1');
  });
  
  return tl;
}
```

### Menu Item Stagger Animation

```javascript
function animateMenuItems(items) {
  gsap.from(items, {
    opacity: 0,
    x: -20,
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out'
  });
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lucky Numbers Uniqueness
*For any* generated set of lucky numbers, all 6 numbers SHALL be unique and within the range 1-49.
**Validates: Requirements 28.6, 29.2**

### Property 2: Lucky Numbers Determinism
*For any* zodiac sign and date combination, generating lucky numbers multiple times SHALL produce the same result (deterministic based on date hash).
**Validates: Requirements 28.6**

### Property 3: Zodiac Sign Coverage
*For any* render of the horoscopes index page, exactly 12 zodiac signs SHALL be displayed.
**Validates: Requirements 27.3**

### Property 4: TV Schedule Time Ordering
*For any* TV schedule display, shows SHALL be sorted by airtime in ascending order.
**Validates: Requirements 25.3**

### Property 5: Cache TTL Compliance
*For any* cached TV data, if the cache age is less than 15 minutes, the cached data SHALL be returned instead of making a new API call.
**Validates: Requirements 32.3**

### Property 6: Star Rating Range
*For any* horoscope star rating (love, money, health), the value SHALL be between 1 and 5 inclusive.
**Validates: Requirements 28.5**

### Property 7: Page Number Validation
*For any* page number in ranges 450-463 or 600-609, the router SHALL accept it as valid.
**Validates: Requirements 31.1, 31.2**

## Error Handling

### TV API Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Network Error | "SERVICE UNAVAILABLE" | Show retry button, use cache |
| Rate Limit | "PLEASE WAIT..." | Display cached data |
| Invalid Response | "DATA ERROR" | Show retry button |
| No Data | "NO LISTINGS AVAILABLE" | Show message |

### Error Display Format

```
┌─────────────────────────────────────────┐
│                                         │
│   ⚠ SERVICE UNAVAILABLE                 │
│                                         │
│   Unable to fetch TV listings.          │
│   Please try again later.               │
│                                         │
│   [RETRY]  [HOME]                       │
│                                         │
│   USING CACHED DATA FROM 14:30          │
│                                         │
└─────────────────────────────────────────┘
```

## Testing Strategy

### Unit Testing
- Test horoscope generation functions
- Test lucky number generation (uniqueness, range)
- Test TV schedule parsing
- Test date formatting utilities

### Property-Based Testing
Using fast-check library:

```javascript
import fc from 'fast-check';

// Property 1: Lucky numbers uniqueness and range
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 12 }), // signId
    fc.integer({ min: 0, max: 365 }), // dayOfYear
    (signId, dayOfYear) => {
      const numbers = generateLuckyNumbers(signId, dayOfYear);
      const unique = new Set(numbers);
      return (
        numbers.length === 6 &&
        unique.size === 6 &&
        numbers.every(n => n >= 1 && n <= 49)
      );
    }
  ),
  { numRuns: 100 }
);

// Property 6: Star rating range
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 0, max: 365 }),
    (signId, dateHash) => {
      const rating = generateRating(signId, dateHash, 'love');
      return rating >= 1 && rating <= 5;
    }
  ),
  { numRuns: 100 }
);
```

## Router Configuration Updates

```javascript
// Add to VALID_PAGE_RANGES in router.js
{ min: 450, max: 463 },  // Horoscopes
{ min: 600, max: 609 },  // TV Listings

// Add to QUICK_ACCESS_PAGES
4: 450,  // Horoscopes
6: 600,  // TV Guide
```

## Page Registry Updates

```javascript
// Add to PAGE_REGISTRY in app.js
import * as tvListingsPage from './pages/tvListings.js';
import * as horoscopesPage from './pages/horoscopes.js';

// TV Listings pages
600: tvListingsPage,
601: tvListingsPage,
602: tvListingsPage,
603: tvListingsPage,
604: tvListingsPage,

// Horoscope pages
450: horoscopesPage,
451: horoscopesPage,
// ... 452-462
463: horoscopesPage,
```

## CSS Additions

```css
/* Horoscope-specific styles */
.zodiac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
}

.zodiac-sign {
  cursor: pointer;
  padding: 8px;
  transition: all 0.15s ease-out;
}

.zodiac-sign:hover {
  filter: brightness(1.2);
  text-shadow: 0 0 8px currentColor;
}

.zodiac-symbol {
  font-size: 24px;
  color: var(--tt-cyan);
}

.star-rating {
  color: var(--tt-yellow);
  letter-spacing: 2px;
}

.star-empty {
  opacity: 0.3;
}

/* Lucky numbers */
.lucky-numbers {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.lucky-number {
  font-size: 18px;
  color: var(--tt-yellow);
  min-width: 24px;
  text-align: center;
}

/* TV Listings styles */
.tv-schedule-row {
  display: grid;
  grid-template-columns: 50px 60px 1fr;
  gap: 8px;
  padding: 4px 0;
}

.tv-time {
  color: var(--tt-cyan);
}

.tv-channel {
  color: var(--tt-white);
}

.tv-title {
  color: var(--tt-yellow);
}

.tv-now-indicator {
  color: var(--tt-green);
}

/* Genre icons */
.genre-film { color: var(--tt-magenta); }
.genre-sports { color: var(--tt-green); }
.genre-news { color: var(--tt-red); }
```

## Implementation Notes

1. **Horoscope Content**: Use locally generated content rather than external APIs for reliability. The mystical phrases pool should contain 50+ authentic-sounding predictions.

2. **TV Schedule Caching**: Cache aggressively (15 min TTL) to reduce API calls. TVmaze is free but we should be good citizens.

3. **Date-Based Determinism**: Lucky numbers and horoscope content should be deterministic based on date, so users see the same content if they refresh.

4. **Element Colors**: Fire signs (Aries, Leo, Sagittarius) use red, Earth signs use green, Air signs use cyan, Water signs use magenta.

5. **Accessibility**: All zodiac symbols should have aria-labels. Star ratings should be announced as "X out of 5 stars".
