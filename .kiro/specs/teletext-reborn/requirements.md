# Requirements Document

## Introduction

**Teletext Reborn** is a nostalgic web application that resurrects the iconic Teletext/Ceefax information service (1974-2012) with modern capabilities. The application combines authentic retro aesthetics with live data feeds and a unique "Time Machine" feature that allows users to explore historical events as if viewing Teletext on any date in history.

The project targets the "Resurrection" category of the hackathon, bringing dead technology back to life with today's innovations. Teletext was a text-based information service broadcast via television signals, featuring blocky graphics, limited colors, and page-based navigation. It was discontinued in 2012 with the digital TV switchover.

**Target Audience:** Anyone who remembers Teletext (35+ demographic) and younger users curious about retro technology.

**Unique Value Proposition:** The only Teletext revival that combines LIVE modern data with historical "Time Machine" exploration, creating both nostalgia and educational value.

## Glossary

- **Teletext**: A text-based information service transmitted via TV signals (1974-2012), displaying news, weather, sports, and other information on dedicated "pages"
- **Ceefax**: BBC's implementation of Teletext in the UK (1974-2012)
- **Page Number**: A 3-digit identifier (100-899) used to navigate Teletext content
- **Fastext**: Colored navigation buttons (Red, Green, Yellow, Cyan) at the bottom of Teletext screens for quick page access
- **Double-Height Text**: Teletext feature where text is displayed at twice the normal height for emphasis
- **Block Graphics**: Simple graphics created using Unicode block characters (▀ ▄ █ ▌ ▐)
- **Scanlines**: Horizontal lines visible on CRT displays, recreated for authentic retro effect
- **Time Machine**: Feature allowing users to view historical data as if browsing Teletext on a past date
- **Live Mode**: Real-time data display showing current news, weather, and financial information
- **CRT Effect**: Visual effects mimicking cathode-ray tube television displays (flicker, glow, curvature)
- **GSAP**: GreenSock Animation Platform - JavaScript animation library used for all animations

## Requirements

### Requirement 0: Overall Screen Layout Structure

**User Story:** As a user, I want a consistent screen layout across all pages, so that I always know where to find information and navigation.

#### Acceptance Criteria

1. WHEN any page is displayed THEN the System SHALL use a fixed layout structure with three zones:
   - Header Bar: 1 row, blue background, contains branding/page number/clock
   - Content Area: 20-22 rows, black background, main page content
   - Navigation Bar: 2 rows, contains Fastext buttons and page controls
2. WHEN displaying the header bar THEN the System SHALL show:
   - Left: "TELETEXT" service name in white
   - Center: Current page number in format "P.XXX" in yellow
   - Right: Live clock in format "HH:MM:SS" in white, updating every second
3. WHEN displaying the content area THEN the System SHALL:
   - Use a monospace grid of 40 columns × 22 rows
   - Apply consistent padding of 8-16px
   - Scroll content if it exceeds the visible area (rare)
4. WHEN displaying the navigation bar THEN the System SHALL show:
   - Row 1: Four Fastext colored buttons with labels (context-dependent per page)
   - Row 2: [◄ PREV] button, page number input field [___], [NEXT ►] button
5. WHEN displaying the page number input THEN the System SHALL:
   - Show a 3-digit input field styled as Teletext
   - Accept only numeric input (0-9)
   - Navigate on Enter key or when 3 digits are entered
6. WHEN displaying the screen container THEN the System SHALL:
   - Center the Teletext display horizontally on the page
   - Apply maximum width of 800px for optimal readability
   - Apply CRT effects (scanlines, vignette, subtle glow) as overlay
7. WHEN the page changes THEN the System SHALL update the header page number immediately
8. WHEN displaying any page THEN the System SHALL maintain the 4:3 aspect ratio reminiscent of CRT televisions

### Requirement 1: Application Boot Experience

**User Story:** As a user, I want to see an authentic TV boot-up animation when the application loads, so that I feel immersed in the retro Teletext experience from the first moment.

#### Acceptance Criteria

1. WHEN the application first loads THEN the System SHALL display a completely black screen for 200ms to simulate TV power-on delay
2. WHEN the boot animation begins THEN the System SHALL show a thin horizontal white line in the center that expands vertically to fill the screen (CRT warm-up effect)
3. WHEN the screen expands THEN the System SHALL display brief static/noise effect using CSS animation with random pixel patterns lasting 300-500 milliseconds
4. WHEN the static clears THEN the System SHALL show "TELETEXT REBORN" title with a typewriter text animation character by character
5. WHEN the title animation completes THEN the System SHALL fade in the subtitle "Press any key to continue..." with a blinking cursor
6. WHEN the user presses any key or clicks THEN the System SHALL transition to the home page with a smooth fade
7. WHEN the boot animation is playing THEN the System SHALL complete the entire sequence within 3 seconds maximum
8. WHEN a user has visited before (localStorage flag exists) THEN the System SHALL display a "Skip Intro" button in the bottom-right corner after 500ms
9. WHEN the Skip button is clicked THEN the System SHALL immediately fade to the home page
10. WHEN the boot sequence plays THEN the System SHALL apply a subtle CRT screen curvature effect using CSS border-radius and box-shadow

### Requirement 2: Authentic Teletext Visual Design

**User Story:** As a user, I want the interface to look exactly like authentic 1980s-90s Teletext, so that I experience genuine nostalgia and visual authenticity.

#### Acceptance Criteria

1. WHEN displaying any page THEN the System SHALL use only the 8 original Teletext colors: black (#000000), red (#FF0000), green (#00FF00), yellow (#FFFF00), blue (#0000FF), magenta (#FF00FF), cyan (#00FFFF), and white (#FFFFFF)
2. WHEN rendering text THEN the System SHALL use the "Press Start 2P" Google Font at 14-16px base size for authentic blocky appearance
3. WHEN displaying the screen THEN the System SHALL apply a scanline overlay using CSS repeating-linear-gradient with 2px spacing and 30% opacity
4. WHEN displaying the screen THEN the System SHALL apply a subtle CRT glow effect using CSS box-shadow with the primary text color
5. WHEN displaying page headers THEN the System SHALL show a blue (#0000FF) background bar containing: service name (left), page number P.XXX (center), and live clock HH:MM:SS (right)
6. WHEN displaying the header clock THEN the System SHALL update every second in real-time
7. WHEN displaying navigation THEN the System SHALL show a Fastext bar at the bottom with 4 colored buttons: Red (#FF0000), Green (#00FF00), Yellow (#FFFF00), Cyan (#00FFFF)
8. WHEN rendering important headlines THEN the System SHALL use CSS transform: scaleY(2) for double-height text effect
9. WHEN the screen is idle for more than 30 seconds THEN the System SHALL trigger a subtle brightness flicker (opacity 0.97-1.0) every 3-5 seconds
10. WHEN displaying content THEN the System SHALL maintain a 40-character line width maximum to match original Teletext constraints
11. WHEN displaying the main content area THEN the System SHALL use a black (#000000) background with yellow (#FFFF00) as the primary text color
12. WHEN displaying separators THEN the System SHALL use Unicode block characters (━, ═, ─) for horizontal lines
13. WHEN displaying the screen container THEN the System SHALL apply a subtle vignette effect (darker corners) using CSS radial-gradient

### Requirement 3: Page Navigation System

**User Story:** As a user, I want to navigate between pages using multiple methods, so that I can browse content in a way that feels authentic yet convenient.

#### Acceptance Criteria

1. WHEN a user clicks a Fastext colored button THEN the System SHALL navigate to the associated page with a smooth transition animation
2. WHEN a user enters a 3-digit page number in the page input field THEN the System SHALL navigate directly to that page
3. WHEN a user presses number keys 1-9 on their keyboard THEN the System SHALL navigate to quick-access pages (1=News, 2=Weather, 3=Finance, etc.)
4. WHEN a user clicks the Previous or Next buttons THEN the System SHALL navigate to the adjacent page number with appropriate animation
5. WHEN a user navigates to a non-existent page number THEN the System SHALL display a friendly "Page Not Found" message in Teletext style
6. WHEN page navigation occurs THEN the System SHALL animate the transition using GSAP with a brief fade or slide effect lasting 200-400 milliseconds
7. WHEN a user presses the Escape key THEN the System SHALL return to the Home page (100)

### Requirement 4: Live Mode - Home Page (Page 100)

**User Story:** As a user, I want to see a welcoming home page with quick access to all sections, so that I can easily navigate the service.

#### Acceptance Criteria

1. WHEN the home page loads THEN the System SHALL display "★ TELETEXT REBORN ★" as a double-height centered title
2. WHEN the home page loads THEN the System SHALL show the current date in format "WEDNESDAY 03 DECEMBER 2025"
3. WHEN the home page loads THEN the System SHALL display a welcome message: "Welcome to Teletext Reborn - Your retro information service"
4. WHEN the home page loads THEN the System SHALL show a navigation menu with dotted leaders:
   - "► NEWS .................. 101"
   - "► WEATHER ............... 200"
   - "► FINANCE ............... 300"
   - "► TIME MACHINE .......... 500"
   - "► SETTINGS .............. 900"
5. WHEN the home page loads THEN the System SHALL display a "TIP:" section with rotating tips about Teletext history or keyboard shortcuts
6. WHEN the user's location is known THEN the System SHALL show a mini weather widget: "[CITY]: [TEMP]°C [CONDITION]"
7. WHEN displaying the home page THEN the System SHALL animate each menu item appearing with GSAP stagger (0.1s delay between items)
8. WHEN displaying the home page THEN the System SHALL show the Fastext bar with: Red=News, Green=Weather, Yellow=Finance, Cyan=Time Machine
9. WHEN the home page loads THEN the System SHALL display "Press ? for keyboard shortcuts" hint at the bottom
10. WHEN displaying the tip THEN the System SHALL rotate through 5-10 different tips, changing every page visit

### Requirement 5: Live Mode - News Section (Pages 101-109)

**User Story:** As a user, I want to read current news headlines in Teletext format, so that I can stay informed while enjoying the retro experience.

#### Acceptance Criteria

1. WHEN the news page loads THEN the System SHALL fetch and display current headlines from a news API (NewsData.io or similar)
2. WHEN displaying news THEN the System SHALL show headlines in categories: Top Stories (101), World (102), Technology (103), Business (104), Sports (105)
3. WHEN a headline is displayed THEN the System SHALL show the headline text, source, and time since publication
4. WHEN news data is loading THEN the System SHALL display an animated "LOADING..." text with blinking cursor
5. WHEN news API fails THEN the System SHALL display a graceful error message and offer to retry
6. WHEN displaying headlines THEN the System SHALL limit text to fit the 40-character Teletext line width, truncating with ellipsis if necessary
7. WHEN the news page is displayed THEN the System SHALL auto-refresh data every 5 minutes without disrupting the user experience

### Requirement 6: Live Mode - Weather Section (Pages 200-209)

**User Story:** As a user, I want to see current weather and forecasts in Teletext style, so that I can check weather conditions with nostalgic charm.

#### Acceptance Criteria

1. WHEN the weather page loads THEN the System SHALL detect the user's location via IP geolocation or saved preference
2. WHEN displaying current weather THEN the System SHALL show temperature, conditions, humidity, and wind speed using Open-Meteo API
3. WHEN displaying the forecast THEN the System SHALL show a 5-day forecast with daily high/low temperatures and conditions
4. WHEN displaying weather conditions THEN the System SHALL use ASCII art icons (sun, cloud, rain, snow) created with block characters
5. WHEN the user has not set a location THEN the System SHALL prompt them to enter a city or allow automatic detection
6. WHEN weather data is displayed THEN the System SHALL show the location name prominently in the header
7. WHEN displaying temperature THEN the System SHALL allow toggle between Celsius and Fahrenheit via settings

### Requirement 7: Live Mode - Finance Section (Pages 300-309)

**User Story:** As a user, I want to see cryptocurrency and stock prices in Teletext format, so that I can track financial markets with retro style.

#### Acceptance Criteria

1. WHEN the finance page loads THEN the System SHALL fetch cryptocurrency prices from CoinGecko API
2. WHEN displaying crypto prices THEN the System SHALL show Bitcoin, Ethereum, and top 5 cryptocurrencies by market cap
3. WHEN displaying price changes THEN the System SHALL use green color for positive changes and red for negative changes
4. WHEN displaying prices THEN the System SHALL show current price, 24h change percentage, and 24h high/low
5. WHEN finance data is loading THEN the System SHALL display placeholder blocks that animate until data arrives
6. WHEN displaying the finance page THEN the System SHALL include a "last updated" timestamp
7. WHEN the API rate limit is reached THEN the System SHALL display cached data with a notice about the delay

### Requirement 8: Time Machine - Date Selection (Page 500)

**User Story:** As a user, I want to select any historical date to explore, so that I can see what Teletext would have shown on that day.

#### Acceptance Criteria

1. WHEN the Time Machine page loads THEN the System SHALL display "⏰ TIME MACHINE ⏰" as a double-height centered title in cyan
2. WHEN the Time Machine page loads THEN the System SHALL show the tagline "Travel back in time to see what happened on any date in history!"
3. WHEN displaying the date picker THEN the System SHALL show three dropdown selectors styled as Teletext inputs:
   - Month: January-December
   - Day: 1-31 (adjusted for selected month)
   - Year: 1940-2024
4. WHEN selecting a date THEN the System SHALL validate the date is real (no Feb 30, etc.) and within the valid range
5. WHEN the Time Machine page loads THEN the System SHALL display "QUICK JUMPS:" section with famous dates:
   - "Moon Landing - Jul 20, 1969"
   - "Berlin Wall Falls - Nov 9, 1989"
   - "Y2K - Jan 1, 2000"
   - "9/11 - Sep 11, 2001"
   - "COVID Lockdown - Mar 23, 2020"
6. WHEN a user has set their birthday in settings THEN the System SHALL show "★ Your Birthday - [DATE]" as the first quick jump option
7. WHEN a quick jump is clicked THEN the System SHALL populate the date picker with that date
8. WHEN the user clicks the "🚀 TIME TRAVEL" button THEN the System SHALL initiate the time travel animation sequence
9. WHEN displaying the date picker THEN the System SHALL show the currently selected date in large format: "[MONTH] [DAY], [YEAR]"
10. WHEN the Time Machine page loads THEN the System SHALL default to "today's date minus 50 years" as an interesting starting point
11. WHEN displaying the page THEN the System SHALL show Fastext: Red=Back to Today, Green=Events, Yellow=Weather, Cyan=Random Date

### Requirement 9: Time Machine - Historical Events (Page 501)

**User Story:** As a user, I want to see what historical events happened on my selected date, so that I can learn about history in an engaging way.

#### Acceptance Criteria

1. WHEN viewing historical events THEN the System SHALL fetch data from Wikipedia's "On This Day" API for the selected date
2. WHEN displaying events THEN the System SHALL show major historical events that occurred on that date across all years
3. WHEN displaying events THEN the System SHALL categorize them as: Events, Births, Deaths
4. WHEN an event is displayed THEN the System SHALL show the year and a brief description (max 2 lines)
5. WHEN displaying events THEN the System SHALL show at least 5 events, 3 births, and 2 deaths if available
6. WHEN the selected date is the user's birthday THEN the System SHALL show a special "Your Birthday!" banner with personalized content
7. WHEN navigating between event categories THEN the System SHALL use Fastext buttons (Red=Events, Green=Births, Yellow=Deaths)

### Requirement 10: Time Machine - Historical Weather (Page 502)

**User Story:** As a user, I want to see what the weather was like on my selected historical date, so that I can understand the conditions of that day.

#### Acceptance Criteria

1. WHEN viewing historical weather THEN the System SHALL fetch data from Open-Meteo Historical API for the selected date and user's location
2. WHEN displaying historical weather THEN the System SHALL show temperature high/low, precipitation, and general conditions
3. WHEN historical weather data is unavailable (before 1940) THEN the System SHALL display a message explaining data limitations
4. WHEN displaying historical weather THEN the System SHALL compare it to the average for that date ("5°C warmer than usual")
5. WHEN the user has not set a location THEN the System SHALL default to a major city (London) with option to change

### Requirement 11: Time Travel Animation Effect

**User Story:** As a user, I want to see a spectacular animation when traveling through time, so that the experience feels magical and memorable.

#### Acceptance Criteria

1. WHEN the user initiates time travel THEN the System SHALL play a GSAP timeline animation lasting exactly 2.5 seconds
2. WHEN the time travel animation begins THEN the System SHALL:
   - Phase 1 (0-0.3s): Apply CSS filter blur(10px) and brightness(1.5) to the screen
   - Phase 2 (0.3-0.5s): Flash the screen white (opacity overlay)
   - Phase 3 (0.5-2.0s): Show rapidly changing year counter from current year to target year
   - Phase 4 (2.0-2.5s): Unblur and reveal content
3. WHEN the year counter animates THEN the System SHALL display years in large double-height text, changing every 50ms
4. WHEN the time travel animation plays THEN the System SHALL display "TRAVELING TO..." with typewriter effect above the year counter
5. WHEN the animation reaches the target year THEN the System SHALL pause briefly (200ms) on the final date before revealing content
6. WHEN the animation completes THEN the System SHALL fade in the historical content with GSAP stagger effect on each line
7. WHEN returning to present day (clicking "Back to Today") THEN the System SHALL play a reverse animation with "RETURNING TO PRESENT..." message
8. WHEN the reverse animation plays THEN the System SHALL count years forward from historical date to current year
9. WHEN the time travel animation plays THEN the System SHALL add screen shake effect (subtle CSS transform) during the flash phase
10. WHEN the animation is playing THEN the System SHALL disable all navigation buttons to prevent interruption

### Requirement 12: User Settings and Personalization

**User Story:** As a user, I want to customize my Teletext experience, so that the service feels personalized to my preferences.

#### Acceptance Criteria

1. WHEN accessing settings (Page 900) THEN the System SHALL display "⚙️ SETTINGS" as a double-height title
2. WHEN accessing settings THEN the System SHALL show the following configurable options:
   - Location: Text input for city name with "Detect" button for auto-detection
   - Birthday: Date picker (month/day/year) for personalized features
   - Temperature: Toggle between "°C Celsius" and "°F Fahrenheit"
   - Theme: Choice between "Classic Green" (green on black) and "Full Color" (multi-color)
   - Scanlines: Toggle for scanline effect (default: on)
3. WHEN the location "Detect" button is clicked THEN the System SHALL use IP geolocation API to determine city
4. WHEN a setting is changed THEN the System SHALL save to localStorage immediately with visual confirmation ("Saved!")
5. WHEN the application loads THEN the System SHALL restore all saved preferences from localStorage before rendering
6. WHEN displaying settings THEN the System SHALL show current values highlighted in cyan for each option
7. WHEN the birthday is set THEN the System SHALL display "Your birthday: [DATE]" and enable birthday features in Time Machine
8. WHEN displaying settings THEN the System SHALL include a "Reset All" button to clear all preferences
9. WHEN Reset All is clicked THEN the System SHALL ask for confirmation before clearing localStorage
10. WHEN displaying settings THEN the System SHALL show Fastext: Red=Home, Green=Save All, Yellow=Reset, Cyan=About

### Requirement 13: Responsive Design and Accessibility

**User Story:** As a user, I want to use Teletext Reborn on any device, so that I can enjoy the experience on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN viewing on desktop THEN the System SHALL display the full Teletext interface with optimal sizing
2. WHEN viewing on tablet THEN the System SHALL adjust the layout to fit the screen while maintaining readability
3. WHEN viewing on mobile THEN the System SHALL stack navigation elements and increase touch target sizes
4. WHEN using keyboard navigation THEN the System SHALL support all navigation via keyboard shortcuts
5. WHEN a screen reader is detected THEN the System SHALL provide appropriate ARIA labels for all interactive elements
6. WHEN displaying text THEN the System SHALL maintain sufficient contrast ratios for readability (minimum 4.5:1)

### Requirement 14: Performance and Caching

**User Story:** As a user, I want the application to load quickly and work smoothly, so that I have a seamless experience.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL display interactive content within 3 seconds on a standard connection
2. WHEN API data is fetched THEN the System SHALL cache responses in localStorage with appropriate expiration times
3. WHEN cached data exists and is fresh THEN the System SHALL use cached data instead of making new API calls
4. WHEN the user is offline THEN the System SHALL display cached content with a notice about offline mode
5. WHEN animations play THEN the System SHALL maintain 60fps performance without jank or stuttering

### Requirement 15: Error Handling and Edge Cases

**User Story:** As a user, I want graceful handling of errors, so that my experience is not disrupted by technical issues.

#### Acceptance Criteria

1. WHEN any API call fails THEN the System SHALL display a user-friendly error message in Teletext style
2. WHEN an API call fails THEN the System SHALL offer a "Retry" option and fall back to cached data if available
3. WHEN the user enters an invalid page number THEN the System SHALL display a "Page Not Found" screen with navigation options
4. WHEN historical data is unavailable for a selected date THEN the System SHALL explain the limitation and suggest alternative dates
5. WHEN rate limits are exceeded THEN the System SHALL inform the user and display the time until limits reset

### Requirement 16: About and Credits Page (Page 999)

**User Story:** As a user, I want to learn about the project and its creators, so that I can understand the context and give credit.

#### Acceptance Criteria

1. WHEN viewing the About page THEN the System SHALL display information about the Teletext Reborn project
2. WHEN viewing the About page THEN the System SHALL include a brief history of original Teletext (1974-2012)
3. WHEN viewing the About page THEN the System SHALL credit all APIs and libraries used (Open-Meteo, Wikipedia, GSAP, etc.)
4. WHEN viewing the About page THEN the System SHALL display the hackathon submission information
5. WHEN viewing the About page THEN the System SHALL include links to the GitHub repository and creator information


### Requirement 17: Shareable Content Feature

**User Story:** As a user, I want to share interesting historical discoveries with friends, so that I can spread the joy of Teletext nostalgia.

#### Acceptance Criteria

1. WHEN viewing any Time Machine page THEN the System SHALL display a "Share" button in the navigation
2. WHEN the user clicks Share THEN the System SHALL generate a shareable URL that deep-links to that specific date
3. WHEN a shared URL is opened THEN the System SHALL automatically navigate to the Time Machine with the specified date loaded
4. WHEN sharing THEN the System SHALL offer options to copy link or share directly to social platforms
5. WHEN generating share content THEN the System SHALL create a preview text like "See what happened on [DATE] - Teletext Reborn"

### Requirement 18: Easter Eggs and Delightful Surprises

**User Story:** As a user, I want to discover hidden features and surprises, so that the experience feels playful and rewarding.

#### Acceptance Criteria

1. WHEN a user navigates to Page 888 THEN the System SHALL display a special "Subtitles Mode" page with fun facts about Teletext
2. WHEN a user types the Konami code (↑↑↓↓←→←→BA) THEN the System SHALL unlock a "Color Burst" mode with rainbow animations
3. WHEN viewing the Time Machine on December 31, 1999 THEN the System SHALL show a special Y2K countdown animation
4. WHEN viewing the Time Machine on the user's birthday THEN the System SHALL display animated confetti and a birthday message
5. WHEN a user visits Page 404 THEN the System SHALL display a humorous "Page Not Found" message in authentic Teletext style

### Requirement 19: Keyboard Shortcuts Reference

**User Story:** As a user, I want to know all available keyboard shortcuts, so that I can navigate efficiently like the original Teletext.

#### Acceptance Criteria

1. WHEN a user presses the "?" key THEN the System SHALL display a keyboard shortcuts overlay
2. WHEN displaying shortcuts THEN the System SHALL list: number keys (1-9), arrow keys, Escape, Enter, and special keys
3. WHEN the shortcuts overlay is displayed THEN the System SHALL allow dismissal by pressing any key or clicking outside
4. WHEN displaying the home page THEN the System SHALL show a hint about pressing "?" for keyboard shortcuts

### Requirement 20: Loading States and Micro-Interactions

**User Story:** As a user, I want engaging loading states and micro-interactions, so that waiting feels entertaining rather than frustrating.

#### Acceptance Criteria

1. WHEN any content is loading THEN the System SHALL display an animated "LOADING..." text with a blinking cursor
2. WHEN data is being fetched THEN the System SHALL show a progress indicator using block characters (░▒▓█)
3. WHEN hovering over interactive elements THEN the System SHALL provide subtle visual feedback (color change or glow)
4. WHEN clicking buttons THEN the System SHALL provide immediate tactile feedback with a brief animation
5. WHEN page content loads THEN the System SHALL animate text appearing line-by-line with GSAP stagger effect

### Requirement 21: First-Time User Onboarding

**User Story:** As a first-time user, I want a brief introduction to Teletext, so that I understand what I'm experiencing even if I never used the original.

#### Acceptance Criteria

1. WHEN a new user visits (no localStorage data) THEN the System SHALL offer an optional "What is Teletext?" introduction
2. WHEN the introduction is shown THEN the System SHALL display 3-4 slides explaining Teletext history and how to navigate
3. WHEN the introduction is shown THEN the System SHALL allow users to skip at any time
4. WHEN the introduction completes THEN the System SHALL save a flag to localStorage to not show again
5. WHEN displaying the introduction THEN the System SHALL use authentic Teletext styling with GSAP animations

### Requirement 22: Data Attribution and Transparency

**User Story:** As a user, I want to know where the data comes from, so that I can trust the information displayed.

#### Acceptance Criteria

1. WHEN displaying news content THEN the System SHALL show the source attribution (e.g., "via NewsData.io")
2. WHEN displaying weather data THEN the System SHALL credit Open-Meteo as the data source
3. WHEN displaying historical events THEN the System SHALL credit Wikipedia as the source
4. WHEN displaying financial data THEN the System SHALL credit CoinGecko as the data source
5. WHEN any data source is displayed THEN the System SHALL include a small attribution in the page footer

### Requirement 23: Offline Fallback Content

**User Story:** As a user, I want basic functionality even when offline, so that I can still enjoy the Teletext experience without internet.

#### Acceptance Criteria

1. WHEN the application detects offline status THEN the System SHALL display a notice in the header
2. WHEN offline THEN the System SHALL display cached content from previous sessions if available
3. WHEN offline THEN the System SHALL allow navigation between cached pages
4. WHEN offline THEN the System SHALL disable features that require live data with appropriate messaging
5. WHEN connection is restored THEN the System SHALL automatically refresh data and remove offline notice


### Requirement 24: Enhanced CRT Screen Effects

**User Story:** As a user, I want the screen to look like an authentic CRT television, so that the nostalgic experience is visually immersive and premium.

#### Acceptance Criteria

1. WHEN displaying the screen THEN the System SHALL apply screen curvature effect using CSS border-radius (subtle barrel distortion on edges, approximately 2-4px curve)
2. WHEN displaying text THEN the System SHALL apply phosphor glow effect using text-shadow with 2px blur radius in the text's color at 50% opacity
3. WHEN displaying the screen container THEN the System SHALL apply a glass reflection overlay using CSS linear-gradient (white to transparent, 5% opacity, positioned top-left to bottom-right)
4. WHEN displaying colored text THEN the System SHALL apply subtle RGB color separation (chromatic aberration) with 1px offset of red channel left and blue channel right
5. WHEN displaying scanlines THEN the System SHALL make every other scanline slightly dimmer (alternating 100% and 85% opacity) to simulate interlace effect
6. WHEN the screen is active THEN the System SHALL apply a subtle inner shadow to simulate the recessed CRT screen
7. WHEN displaying the outer frame THEN the System SHALL show a dark gray bezel border (8-12px) with rounded corners to simulate TV casing
8. WHEN the screen renders THEN the System SHALL apply a subtle noise texture overlay (2% opacity) to simulate CRT phosphor grain

### Requirement 25: GSAP Animation Easing Standards

**User Story:** As a user, I want animations to feel natural and polished, so that every interaction feels premium and intentional.

#### Acceptance Criteria

1. WHEN animating page transitions THEN the System SHALL use GSAP ease "power2.inOut" for smooth, professional movement
2. WHEN animating typewriter text effects THEN the System SHALL use GSAP ease "none" (linear) for authentic character-by-character reveal
3. WHEN animating the boot sequence THEN the System SHALL use GSAP ease "power4.out" for dramatic, decelerating reveal
4. WHEN animating the time travel blur effect THEN the System SHALL use GSAP ease "expo.inOut" for cinematic whoosh feeling
5. WHEN animating button hover states THEN the System SHALL use GSAP ease "power1.out" for snappy, responsive feedback (duration 0.15s)
6. WHEN animating menu item staggers THEN the System SHALL use GSAP ease "power2.out" with 0.05s stagger delay between items
7. WHEN animating error states THEN the System SHALL use GSAP ease "elastic.out(1, 0.5)" for attention-grabbing shake effect
8. WHEN animating content fade-ins THEN the System SHALL use GSAP ease "power1.inOut" with duration 0.3s
9. WHEN animating the year counter in time travel THEN the System SHALL use GSAP ease "steps(1)" for discrete number changes
10. WHEN any animation plays THEN the System SHALL ensure smooth 60fps performance by using CSS transforms and opacity only

### Requirement 26: Teletext-Authentic Loading States

**User Story:** As a user, I want loading states to feel authentic to the Teletext era, so that waiting feels entertaining and on-brand.

#### Acceptance Criteria

1. WHEN content is loading THEN the System SHALL display a block-based progress indicator using characters: ░░░░░░░░░░ (empty) → █████████░ (90%) → ██████████ (complete)
2. WHEN the progress indicator animates THEN the System SHALL fill blocks from left to right at a rate matching actual load progress
3. WHEN displaying loading text THEN the System SHALL show "LOADING" with animated dots cycling: "LOADING." → "LOADING.." → "LOADING..." → "LOADING." (500ms per state)
4. WHEN displaying a loading spinner THEN the System SHALL use rotating block characters: ◐ → ◓ → ◑ → ◒ (cycling every 150ms)
5. WHEN content is loading THEN the System SHALL display a blinking cursor (█) after the loading text, blinking at 530ms intervals
6. WHEN API data is being fetched THEN the System SHALL show "PLEASE WAIT..." in yellow text centered on screen
7. WHEN loading takes longer than 3 seconds THEN the System SHALL display "STILL LOADING - PLEASE WAIT" message
8. WHEN loading completes THEN the System SHALL briefly flash "READY" in green before showing content

### Requirement 27: Micro-Interactions and Hover States

**User Story:** As a user, I want immediate visual feedback on all interactive elements, so that the interface feels responsive and alive.

#### Acceptance Criteria

1. WHEN hovering over a Fastext button THEN the System SHALL increase brightness by 20% and add a subtle glow (box-shadow 0 0 8px) in the button's color
2. WHEN hovering over a Fastext button THEN the System SHALL display an underline animation that slides in from left to right (duration 0.2s)
3. WHEN clicking any button THEN the System SHALL apply a brief scale transform (0.95) for 100ms to simulate press feedback
4. WHEN hovering over menu items THEN the System SHALL change the text color to cyan and add a "►" prefix animation
5. WHEN hovering over clickable text THEN the System SHALL trigger a brief flicker effect (opacity 0.7 → 1.0) to simulate CRT response
6. WHEN focusing on the page number input THEN the System SHALL show a blinking cursor and highlight the field with a cyan border
7. WHEN a successful action completes THEN the System SHALL flash the affected element's border green for 300ms
8. WHEN an error occurs THEN the System SHALL flash the affected element's border red and apply a shake animation (translateX ±3px, 3 cycles, 300ms total)
9. WHEN hovering over navigation arrows (◄ ►) THEN the System SHALL scale them up by 1.2x with ease "power1.out"
10. WHEN any interactive element receives keyboard focus THEN the System SHALL display a dotted outline (2px dotted cyan) for accessibility

### Requirement 28: Strategic Color Usage System

**User Story:** As a user, I want colors to have consistent meaning throughout the application, so that I can quickly understand information at a glance.

#### Acceptance Criteria

1. WHEN displaying primary content text THEN the System SHALL use yellow (#FFFF00) as the default color
2. WHEN displaying secondary/descriptive text THEN the System SHALL use white (#FFFFFF) at 90% opacity
3. WHEN displaying interactive elements and links THEN the System SHALL use cyan (#00FFFF)
4. WHEN displaying positive values (price up, good weather, success) THEN the System SHALL use green (#00FF00)
5. WHEN displaying negative values (price down, errors, alerts) THEN the System SHALL use red (#FF0000)
6. WHEN displaying special highlights and Time Machine elements THEN the System SHALL use magenta (#FF00FF)
7. WHEN displaying headers and navigation backgrounds THEN the System SHALL use blue (#0000FF)
8. WHEN displaying backgrounds THEN the System SHALL use black (#000000)
9. WHEN displaying timestamps and metadata THEN the System SHALL use white (#FFFFFF) at 70% opacity
10. WHEN displaying disabled or unavailable options THEN the System SHALL use white (#FFFFFF) at 40% opacity

### Requirement 29: Typography Hierarchy System

**User Story:** As a user, I want clear visual hierarchy in text, so that I can quickly scan and understand page content.

#### Acceptance Criteria

1. WHEN displaying page titles THEN the System SHALL use double-height text (CSS scaleY(2)) in yellow, centered
2. WHEN displaying section headers THEN the System SHALL use 1.5x height text in cyan, uppercase, with ═══ underline
3. WHEN displaying body text THEN the System SHALL use standard height (14-16px) in yellow or white
4. WHEN displaying captions and metadata THEN the System SHALL use 0.85x size in white at 70% opacity
5. WHEN displaying navigation labels THEN the System SHALL use standard height in the respective Fastext button color
6. WHEN displaying emphasis text THEN the System SHALL use flashing animation (opacity toggle at 500ms) or inverse colors (black on color background)
7. WHEN displaying data values (prices, temperatures) THEN the System SHALL use standard height with appropriate color coding (green/red/white)
8. WHEN displaying timestamps THEN the System SHALL use format "HH:MM" or "X mins ago" in white at 70% opacity
9. WHEN displaying page numbers in content THEN the System SHALL use cyan color to indicate they are navigable
10. WHEN displaying error messages THEN the System SHALL use red text with ⚠ prefix symbol

### Requirement 30: Visual Feedback for Application States

**User Story:** As a user, I want clear visual indicators for different application states, so that I always know what's happening.

#### Acceptance Criteria

1. WHEN content is loading THEN the System SHALL display animated block progress bar and blinking cursor
2. WHEN an action succeeds THEN the System SHALL flash a green border around the affected area for 300ms
3. WHEN an error occurs THEN the System SHALL display red border, shake animation, and error message in red
4. WHEN the application is offline THEN the System SHALL display a yellow "⚡ OFFLINE" badge in the header bar
5. WHEN displaying stale/cached data THEN the System SHALL dim the content to 80% opacity and show "Last updated: X min ago" in yellow
6. WHEN hovering over interactive elements THEN the System SHALL increase brightness and add subtle glow
7. WHEN an element has keyboard focus THEN the System SHALL display a 2px dotted cyan outline
8. WHEN an element is selected/active THEN the System SHALL display inverted colors (black text on colored background)
9. WHEN a page is transitioning THEN the System SHALL show brief static effect (50ms) between pages
10. WHEN the Time Machine is active (viewing historical date) THEN the System SHALL display a magenta "TIME MACHINE ACTIVE" indicator in the header

### Requirement 31: Page Transition Choreography

**User Story:** As a user, I want page transitions to feel cinematic and intentional, so that navigation feels like a premium experience.

#### Acceptance Criteria

1. WHEN exiting a page THEN the System SHALL fade out content from bottom to top with 0.15s duration
2. WHEN exiting a page THEN the System SHALL display a brief static/noise flash (50ms) after content fades
3. WHEN entering a page THEN the System SHALL fade in the header first (0.1s), then content area (0.2s), then navigation (0.1s)
4. WHEN entering a page THEN the System SHALL animate content lines appearing with stagger effect (0.03s delay between lines)
5. WHEN navigating to adjacent pages (Prev/Next) THEN the System SHALL use horizontal slide animation (exit left/right, enter from opposite side)
6. WHEN navigating via page number input THEN the System SHALL use vertical slide animation (exit up, enter from bottom)
7. WHEN navigating via Fastext buttons THEN the System SHALL use fade transition with brief color flash matching the button pressed
8. WHEN the Time Travel animation plays THEN the System SHALL use the special blur/flash/counter sequence (defined in Requirement 11)
9. WHEN returning to a previously visited page THEN the System SHALL use faster transition (0.2s total) to feel snappy
10. WHEN any transition plays THEN the System SHALL disable navigation inputs to prevent interruption

### Requirement 32: Authentic Teletext Visual Details

**User Story:** As a user, I want authentic Teletext visual details, so that the experience feels genuinely nostalgic and accurate.

#### Acceptance Criteria

1. WHEN displaying multi-page content THEN the System SHALL show page indicator "Page 1/5" in the header area
2. WHEN displaying important alerts THEN the System SHALL use flashing text animation (opacity 0 → 1 at 500ms intervals)
3. WHEN displaying decorative borders THEN the System SHALL use block characters: ▀▄█▌▐░▒▓ for authentic graphics
4. WHEN displaying weather icons THEN the System SHALL use ASCII art composed of block characters (e.g., sun: ░░▓██▓░░)
5. WHEN displaying horizontal separators THEN the System SHALL use ━━━━━━━━━━ or ══════════ characters
6. WHEN displaying bullet points THEN the System SHALL use ► or • characters in cyan
7. WHEN displaying the clock THEN the System SHALL update every second with brief digit-change animation
8. WHEN displaying prices or numbers THEN the System SHALL right-align values and use consistent decimal places

### Requirement 33: Delightful Moments and Surprises

**User Story:** As a user, I want to discover delightful surprises throughout the experience, so that using the app feels rewarding and memorable.

#### Acceptance Criteria

1. WHEN a first-time user completes the boot sequence THEN the System SHALL display "Welcome to the future of the past!" message
2. WHEN a user visits on their birthday (if set) THEN the System SHALL display confetti animation and "Happy Birthday!" message
3. WHEN a user visits between midnight and 5am THEN the System SHALL display "Night Owl Mode" with slightly dimmer screen
4. WHEN a user visits on January 1st THEN the System SHALL display a special New Year celebration animation
5. WHEN a user shares content for the first time THEN the System SHALL display "Thanks for sharing!" confirmation
6. WHEN a user completes settings setup THEN the System SHALL display "All set! Enjoy your personalized Teletext" message
7. WHEN a user returns after 7+ days THEN the System SHALL display "Welcome back! We missed you" message on home page

