# Implementation Plan: TV Listings & Horoscopes

- [x] 1. Update Router Configuration


  - [x] 1.1 Add page ranges 450-463 and 600-609 to VALID_PAGE_RANGES

  - [x] 1.2 Update QUICK_ACCESS_PAGES: key 4 → 450 (Horoscopes), key 6 → 600 (TV Guide)

  - _Requirements: 31.1, 31.2, 31.3, 31.4_

- [x] 2. Create Horoscope Service





  - [x] 2.1 Create horoscopeService.js with ZODIAC_SIGNS constant (12 signs with symbols, elements, date ranges)




  - [x] 2.2 Implement generateLuckyNumbers(signId, dateHash) - 6 unique numbers 1-49


  - [x] 2.3 Implement generateRating(signId, dateHash, type) - returns 1-5

  - [x] 2.4 Implement getDailyHoroscope(signId) - returns full horoscope object




  - [x] 2.5 Add PREDICTIONS array with 50+ mystical phrases
  - [x] 2.6 Implement getCompatibleSigns(signId) - returns 2 compatible signs
  - [x] 2.7 Implement getSignFromBirthday(month, day) - returns zodiac sign
  - _Requirements: 28.4, 28.5, 28.6, 28.7, 28.8, 32.5, 32.6, 32.7_


- [x] 2.8 Write property test for lucky numbers uniqueness and range

  - **Property 1: Lucky Numbers Uniqueness**
  - **Validates: Requirements 28.6, 29.2**



- [x] 2.9 Write property test for star rating range


  - **Property 6: Star Rating Range**
  - **Validates: Requirements 28.5**

- [x] 3. Create Horoscopes Page Component

  - [x] 3.1 Create horoscopes.js with render(pageNumber) function
  - [x] 3.2 Implement index page (450) with 4x3 zodiac grid layout
  - [x] 3.3 Implement individual sign pages (451-462) with full horoscope display
  - [x] 3.4 Implement lucky numbers page (463) with slot machine animation
  - [x] 3.5 Add star twinkle CSS animation for decorative stars
  - [x] 3.6 Implement getFastextButtons() for each page type
  - [x] 3.7 Implement onMount() with GSAP animations (menu stagger, star twinkle)
  - [x] 3.8 Implement onUnmount() to cleanup animations
  - [x] 3.9 Highlight user's zodiac sign if birthday is set in settings
  - _Requirements: 27.1-27.9, 28.1-28.11, 29.1-29.6_

- [x] 3.10 Write property test for zodiac sign coverage


  - **Property 3: Zodiac Sign Coverage**
  - **Validates: Requirements 27.3**

- [x] 4. Checkpoint - Verify Horoscopes Feature





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create TVmaze API Service

  - [x] 5.1 Create tvmazeApi.js with getSchedule(country, date) function
  - [x] 5.2 Implement parseSchedule(data) to transform API response
  - [x] 5.3 Add caching with 15-minute TTL
  - [x] 5.4 Implement error handling with cache fallback
  - [x] 5.5 Add formatShowForDisplay(show) helper
  - [x] 5.6 Add getGenreIcon(genres) helper - returns 🎬/⚽/📰 or empty
  - _Requirements: 32.1, 32.2, 32.3, 32.4_

- [x] 5.7 Write property test for TV schedule time ordering
  - **Property 4: TV Schedule Time Ordering**
  - **Validates: Requirements 25.3**

- [x] 5.8 Write property test for cache TTL compliance

  - **Property 5: Cache TTL Compliance**
  - **Validates: Requirements 32.3**

- [x] 6. Create TV Listings Page Component
  - [x] 6.1 Create tvListings.js with render(pageNumber) function
  - [x] 6.2 Implement index page (600) with menu and highlights
  - [x] 6.3 Implement "Now On TV" page (601) with current shows
  - [x] 6.4 Implement "Tonight" page (602) with prime time schedule
  - [x] 6.5 Implement "Tomorrow" page (603) with next day schedule
  - [x] 6.6 Add loading state "CHECKING SCHEDULES..." with blinking cursor
  - [x] 6.7 Add error state with retry button
  - [x] 6.8 Implement getFastextButtons() for each page type
  - [x] 6.9 Implement onMount() with data fetching and animations
  - [x] 6.10 Implement onUnmount() to cleanup intervals
  - [x] 6.11 Add auto-refresh every 5 minutes for live pages
  - _Requirements: 24.1-24.8, 25.1-25.9, 26.1-26.8_

- [x] 7. Update App.js Page Registry
  - [x] 7.1 Import tvListingsPage and horoscopesPage modules
  - [x] 7.2 Add pages 600-609 to PAGE_REGISTRY pointing to tvListingsPage
  - [x] 7.3 Add pages 450-463 to PAGE_REGISTRY pointing to horoscopesPage
  - [x] 7.4 Add Fastext configurations for new pages
  - _Requirements: 24.11, 25.8, 26.8, 27.8, 28.11_

- [x] 8. Update Home Page Navigation
  - [x] 8.1 Add "► TV GUIDE .............. 600" to home page menu
  - [x] 8.2 Add "► HOROSCOPES ............ 450" to home page menu
  - _Requirements: 30.1, 30.2_

- [x] 9. Final Checkpoint - Full Integration Test
  - All 772 tests pass ✓
