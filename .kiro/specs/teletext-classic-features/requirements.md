# Requirements Document: TV Listings & Horoscopes

## Introduction

This specification adds two of the most beloved and iconic Teletext features: **TV Listings** and **Horoscopes**. Based on research of authentic BBC Ceefax and ITV Oracle archives from 1990s-2000s, these features will recreate the exact visual style and user experience that millions of viewers remember.

**Research Sources:**
- Teletext Preservation Project (teletext.org.uk) - Authentic Ceefax archives from 1999
- TVmaze API documentation - Free TV schedule data
- Original Ceefax page layouts showing TV listings on pages 600-609
- ITV Oracle horoscopes on pages 450-461

**Target Pages (matching original Ceefax numbering):**
- TV Listings: Pages 600-609 (authentic Ceefax TV section)
- Horoscopes: Pages 450-461 (authentic Oracle mystical section)

## Glossary

- **Ceefax**: BBC's Teletext service (1974-2012), used pages 600+ for TV listings
- **Oracle**: ITV's Teletext service, famous for horoscopes on pages 450+
- **TVmaze API**: Free TV schedule API at https://api.tvmaze.com
- **NOW/NEXT**: Classic Teletext feature showing current and upcoming programs
- **Dotted Leaders**: The "........" pattern connecting menu items to page numbers
- **Double-Height**: Text at 2x vertical scale using CSS transform: scaleY(2)
- **Fastext**: Four colored buttons (Red, Green, Yellow, Cyan) for quick navigation

## Requirements

### Requirement 24: TV Listings Index Page (Page 600)

**User Story:** As a user, I want to see a TV listings index page exactly like original Ceefax, so that I can navigate to different channels and time slots.

#### Acceptance Criteria

1. WHEN the TV Listings page (600) loads THEN the System SHALL display "TV GUIDE" as a double-height centered title in yellow
2. WHEN displaying the index THEN the System SHALL show channel menu with dotted leaders:
   - "► NOW ON TV ............ 601"
   - "► TONIGHT .............. 602"
   - "► TOMORROW ............. 603"
   - "► FULL SCHEDULE ........ 604"
3. WHEN displaying the page THEN the System SHALL show "HIGHLIGHTS" section with 3 featured shows for today
4. WHEN displaying highlights THEN the System SHALL show: time in cyan, channel in white, title in yellow
5. WHEN displaying the page THEN the System SHALL show current date: "FRIDAY 5 DECEMBER 2025"
6. WHEN displaying the page THEN the System SHALL show Fastext: Red=Home, Green=Now, Yellow=Tonight, Cyan=Tomorrow
7. WHEN the page loads THEN the System SHALL animate menu items appearing with GSAP stagger (0.05s delay)
8. WHEN displaying the page THEN the System SHALL show "VIA TVMAZE" attribution at bottom in white at 70% opacity

### Requirement 25: Now On TV Page (Page 601)

**User Story:** As a user, I want to see what's currently on TV across all channels, so that I can quickly find something to watch right now.

#### Acceptance Criteria

1. WHEN the Now On TV page (601) loads THEN the System SHALL display "NOW ON TV" as double-height title in cyan
2. WHEN displaying current shows THEN the System SHALL fetch data from TVmaze API: /schedule?country=US
3. WHEN displaying shows THEN the System SHALL show up to 8 programs in format:
   - TIME (cyan) | CHANNEL (white, 6 chars max) | TITLE (yellow, 22 chars max)
4. WHEN a show is currently airing THEN the System SHALL show "►" indicator before the time
5. WHEN displaying shows THEN the System SHALL sort by channel popularity (major networks first)
6. WHEN data is loading THEN the System SHALL display "CHECKING SCHEDULES..." with blinking cursor
7. WHEN the API fails THEN the System SHALL display "SERVICE UNAVAILABLE" and offer retry
8. WHEN displaying the page THEN the System SHALL show "LAST UPDATED: HH:MM" timestamp
9. WHEN displaying the page THEN the System SHALL auto-refresh every 5 minutes

### Requirement 26: Tonight's TV Page (Page 602)

**User Story:** As a user, I want to see tonight's prime time TV schedule, so that I can plan my evening viewing.

#### Acceptance Criteria

1. WHEN the Tonight page (602) loads THEN the System SHALL display "TONIGHT ON TV" as double-height title in yellow
2. WHEN displaying tonight's schedule THEN the System SHALL focus on prime time (19:00-23:00)
3. WHEN displaying shows THEN the System SHALL group by hour with cyan time headers
4. WHEN displaying a show THEN the System SHALL show: time, channel, title, and genre icon
5. WHEN a show is a FILM THEN the System SHALL display "🎬" prefix and magenta color
6. WHEN a show is SPORTS THEN the System SHALL display "⚽" prefix and green color
7. WHEN a show is NEWS THEN the System SHALL display "📰" prefix and red color
8. WHEN displaying the page THEN the System SHALL show Fastext: Red=Now, Green=Late Night, Yellow=Tomorrow, Cyan=Full Guide

### Requirement 27: Horoscopes Index Page (Page 450)

**User Story:** As a user, I want to see all zodiac signs in an authentic mystical Teletext layout, so that I can find and read my daily horoscope.

#### Acceptance Criteria

1. WHEN the Horoscopes page (450) loads THEN the System SHALL display "★ MYSTIC STARS ★" as double-height title in magenta
2. WHEN displaying the page THEN the System SHALL show mystical tagline in cyan: "The stars reveal your destiny..."
3. WHEN displaying zodiac signs THEN the System SHALL show all 12 signs in a 4x3 grid:
   - Row 1: ♈ARIES ♉TAURUS ♊GEMINI ♋CANCER
   - Row 2: ♌LEO ♍VIRGO ♎LIBRA ♏SCORPIO  
   - Row 3: ♐SAGITTARIUS ♑CAPRICORN ♒AQUARIUS ♓PISCES
4. WHEN displaying a sign THEN the System SHALL show: symbol in cyan, name in yellow, date range in white
5. WHEN the user has set their birthday THEN the System SHALL highlight their sign with "★YOUR SIGN" in magenta
6. WHEN a user clicks a sign THEN the System SHALL navigate to that sign's page (451-462)
7. WHEN displaying the page THEN the System SHALL show animated twinkling stars using CSS keyframes
8. WHEN displaying the page THEN the System SHALL show Fastext: Red=Home, Green=Your Sign, Yellow=Lucky Numbers, Cyan=Love Match
9. WHEN displaying the page THEN the System SHALL show today's date and moon phase icon

### Requirement 28: Individual Horoscope Page (Pages 451-462)

**User Story:** As a user, I want to read my detailed daily horoscope with predictions and lucky numbers, so that I can enjoy the mystical Teletext experience.

#### Acceptance Criteria

1. WHEN a zodiac page loads THEN the System SHALL display the sign symbol and name as double-height title
2. WHEN displaying the sign THEN the System SHALL use sign-specific colors:
   - Fire signs (Aries, Leo, Sagittarius): Red
   - Earth signs (Taurus, Virgo, Capricorn): Green
   - Air signs (Gemini, Libra, Aquarius): Cyan
   - Water signs (Cancer, Scorpio, Pisces): Magenta
3. WHEN displaying the horoscope THEN the System SHALL show "TODAY'S READING" section header
4. WHEN displaying the prediction THEN the System SHALL show horoscope text in yellow (max 160 chars, word-wrapped)
5. WHEN displaying the page THEN the System SHALL show star ratings (★★★★☆) for:
   - LOVE: 1-5 stars in magenta
   - MONEY: 1-5 stars in green
   - HEALTH: 1-5 stars in cyan
6. WHEN displaying the page THEN the System SHALL show "LUCKY NUMBERS:" with 6 numbers (1-49) in yellow
7. WHEN displaying the page THEN the System SHALL show "LUCKY COLOR:" with a Teletext color name
8. WHEN displaying the page THEN the System SHALL show "BEST MATCH:" with 2 compatible signs
9. WHEN the horoscope is loading THEN the System SHALL display "✨ READING THE STARS ✨" with animated dots
10. WHEN displaying the page THEN the System SHALL show navigation: "◄ PREV SIGN" and "NEXT SIGN ►"
11. WHEN displaying the page THEN the System SHALL show Fastext: Red=All Signs, Green=Prev, Yellow=Next, Cyan=Lucky Numbers

### Requirement 29: Lucky Numbers Page (Page 463)

**User Story:** As a user, I want to generate lucky lottery numbers based on mystical calculations, so that I can have fun with the horoscope theme.

#### Acceptance Criteria

1. WHEN the Lucky Numbers page loads THEN the System SHALL display "🎱 LUCKY NUMBERS 🎱" as double-height title
2. WHEN displaying numbers THEN the System SHALL show 6 large numbers in yellow on black
3. WHEN generating numbers THEN the System SHALL animate each number "rolling" with GSAP (slot machine effect)
4. WHEN displaying the page THEN the System SHALL show "GENERATE NEW" button in cyan
5. WHEN the button is clicked THEN the System SHALL regenerate numbers with animation
6. WHEN the user has set birthday THEN the System SHALL show "Based on [SIGN] energy" message

### Requirement 30: Home Page Updates

**User Story:** As a user, I want the home page to include links to TV Listings and Horoscopes.

#### Acceptance Criteria

1. WHEN the home page loads THEN the System SHALL display updated navigation including:
   - "► TV GUIDE .............. 600"
   - "► HOROSCOPES ............ 450"
2. WHEN displaying the menu THEN the System SHALL position these after existing items

### Requirement 31: Router Updates

**User Story:** As a developer, I want the router to support the new page ranges.

#### Acceptance Criteria

1. WHEN validating page numbers THEN the System SHALL accept pages 450-463 as valid (Horoscopes)
2. WHEN validating page numbers THEN the System SHALL accept pages 600-609 as valid (TV Listings)
3. WHEN a user presses number key 4 THEN the System SHALL navigate to Horoscopes (450)
4. WHEN a user presses number key 6 THEN the System SHALL navigate to TV Guide (600)

### Requirement 32: API Integration

**User Story:** As a developer, I want reliable data integration for TV schedules.

#### Acceptance Criteria

1. WHEN fetching TV data THEN the System SHALL use TVmaze API: https://api.tvmaze.com/schedule
2. WHEN fetching TV data THEN the System SHALL pass country=US and date=YYYY-MM-DD parameters
3. WHEN caching TV data THEN the System SHALL use 15-minute TTL
4. WHEN the API fails THEN the System SHALL display cached data if available with "CACHED" notice
5. WHEN displaying horoscopes THEN the System SHALL use locally generated mystical content (more reliable than external APIs)
6. WHEN generating horoscope content THEN the System SHALL use a pool of 50+ authentic mystical phrases
7. WHEN generating lucky numbers THEN the System SHALL ensure all numbers are unique and in range 1-49
