/**
 * Teletext Reborn - Horoscope Service
 * 
 * Generates daily horoscope content with mystical predictions,
 * lucky numbers, star ratings, and compatibility information.
 * 
 * Uses deterministic generation based on date for consistency.
 * 
 * @module services/horoscopeService
 * Requirements: 27.3-27.5, 28.4-28.8, 29.2-29.5, 32.5-32.7
 */

// ============================================
// Zodiac Signs Data
// ============================================

/**
 * All 12 zodiac signs with symbols, elements, and date ranges
 * @type {Array<Object>}
 */
export const ZODIAC_SIGNS = [
  { id: 1, name: 'Aries', symbol: '♈', element: 'fire', dateRange: 'Mar 21 - Apr 19', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { id: 2, name: 'Taurus', symbol: '♉', element: 'earth', dateRange: 'Apr 20 - May 20', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { id: 3, name: 'Gemini', symbol: '♊', element: 'air', dateRange: 'May 21 - Jun 20', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { id: 4, name: 'Cancer', symbol: '♋', element: 'water', dateRange: 'Jun 21 - Jul 22', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { id: 5, name: 'Leo', symbol: '♌', element: 'fire', dateRange: 'Jul 23 - Aug 22', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { id: 6, name: 'Virgo', symbol: '♍', element: 'earth', dateRange: 'Aug 23 - Sep 22', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { id: 7, name: 'Libra', symbol: '♎', element: 'air', dateRange: 'Sep 23 - Oct 22', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { id: 8, name: 'Scorpio', symbol: '♏', element: 'water', dateRange: 'Oct 23 - Nov 21', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { id: 9, name: 'Sagittarius', symbol: '♐', element: 'fire', dateRange: 'Nov 22 - Dec 21', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { id: 10, name: 'Capricorn', symbol: '♑', element: 'earth', dateRange: 'Dec 22 - Jan 19', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { id: 11, name: 'Aquarius', symbol: '♒', element: 'air', dateRange: 'Jan 20 - Feb 18', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { id: 12, name: 'Pisces', symbol: '♓', element: 'water', dateRange: 'Feb 19 - Mar 20', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 }
];

/**
 * Element colors matching Teletext palette
 */
export const ELEMENT_COLORS = {
  fire: '#FF0000',    // Red
  earth: '#00FF00',   // Green
  air: '#00FFFF',     // Cyan
  water: '#FF00FF'    // Magenta
};

/**
 * Teletext color names for lucky color generation
 */
const TELETEXT_COLORS = ['RED', 'GREEN', 'YELLOW', 'CYAN', 'MAGENTA', 'WHITE'];

/**
 * Compatibility matrix - signs that work well together
 */
const COMPATIBILITY = {
  1: [5, 9, 3, 7],      // Aries: Leo, Sagittarius, Gemini, Libra
  2: [6, 10, 4, 8],     // Taurus: Virgo, Capricorn, Cancer, Scorpio
  3: [7, 11, 1, 5],     // Gemini: Libra, Aquarius, Aries, Leo
  4: [8, 12, 2, 6],     // Cancer: Scorpio, Pisces, Taurus, Virgo
  5: [1, 9, 3, 7],      // Leo: Aries, Sagittarius, Gemini, Libra
  6: [2, 10, 4, 8],     // Virgo: Taurus, Capricorn, Cancer, Scorpio
  7: [3, 11, 1, 5],     // Libra: Gemini, Aquarius, Aries, Leo
  8: [4, 12, 2, 6],     // Scorpio: Cancer, Pisces, Taurus, Virgo
  9: [1, 5, 3, 7],      // Sagittarius: Aries, Leo, Gemini, Libra
  10: [2, 6, 4, 8],     // Capricorn: Taurus, Virgo, Cancer, Scorpio
  11: [3, 7, 1, 9],     // Aquarius: Gemini, Libra, Aries, Sagittarius
  12: [4, 8, 2, 6]      // Pisces: Cancer, Scorpio, Taurus, Virgo
};


// ============================================
// Mystical Predictions Pool (50+ phrases)
// ============================================

const PREDICTIONS = [
  "The stars align in your favor today. New opportunities await in unexpected places.",
  "A chance encounter could lead to exciting developments. Stay open to possibilities.",
  "Your creative energy is at its peak. Channel it into projects close to your heart.",
  "Financial matters require careful attention. Review your plans before committing.",
  "Romance is in the air. Express your feelings to someone special today.",
  "Trust your instincts today. Your inner voice knows the path forward.",
  "A long-awaited message brings welcome news. Patience has paid off.",
  "Focus on self-care today. Your wellbeing is the foundation of success.",
  "An old friend may reach out with surprising news. Keep communication open.",
  "Your hard work is about to be recognized. Stay humble but confident.",
  "Travel plans may shift unexpectedly. Embrace the adventure that follows.",
  "A creative solution emerges for a persistent problem. Think outside the box.",
  "Family matters take center stage. Show your loved ones you care.",
  "Your charm is magnetic today. Use it wisely in social situations.",
  "A financial opportunity presents itself. Do your research before diving in.",
  "The universe rewards your positive attitude. Keep spreading good vibes.",
  "A secret admirer may reveal themselves. Be open to unexpected connections.",
  "Your leadership skills shine today. Others look to you for guidance.",
  "Take time to reflect on recent achievements. You have come far.",
  "A challenging situation resolves itself naturally. Trust the process.",
  "Your intuition is especially strong today. Follow your gut feelings.",
  "New beginnings are on the horizon. Prepare for positive change.",
  "A mentor figure offers valuable advice. Listen with an open mind.",
  "Your energy attracts abundance. Stay focused on your goals.",
  "Communication flows easily today. Express yourself clearly and honestly.",
  "A surprise gift or gesture brightens your day. Pay it forward.",
  "Your patience is tested but rewarded. Stay calm under pressure.",
  "Creative inspiration strikes unexpectedly. Capture your ideas quickly.",
  "A health goal becomes more achievable. Small steps lead to big results.",
  "Your social circle expands in meaningful ways. Welcome new connections.",
  "Past efforts bear fruit today. Celebrate your accomplishments.",
  "A decision you have been avoiding becomes clearer. Trust yourself.",
  "Your optimism inspires those around you. Lead by example.",
  "Financial stability improves gradually. Stay the course.",
  "A romantic gesture strengthens an important bond. Show your appreciation.",
  "Your adaptability serves you well today. Go with the flow.",
  "An unexpected invitation leads to memorable experiences. Say yes.",
  "Your determination overcomes obstacles. Nothing can stop you now.",
  "A peaceful resolution emerges from conflict. Choose harmony.",
  "Your generosity returns to you tenfold. Keep giving freely.",
  "A long-term goal moves closer to reality. Stay focused and persistent.",
  "Your unique perspective is valued today. Share your insights.",
  "A moment of clarity illuminates your path. The way forward is clear.",
  "Your resilience is your greatest strength. Keep pushing forward.",
  "Unexpected support arrives when you need it most. Accept help graciously.",
  "Your positive energy transforms challenges into opportunities.",
  "A creative project gains momentum. Your vision is becoming reality.",
  "Your kindness makes a lasting impression. Small acts matter.",
  "The stars encourage bold action today. Take that leap of faith.",
  "Your inner wisdom guides you true. Listen to your heart."
];

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a hash from a date for deterministic randomness
 * @param {Date} date - Date to hash
 * @returns {number} Hash value
 */
export function hashDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (year * 10000 + month * 100 + day) % 1000;
}

/**
 * Seeded random number generator
 * @param {number} seed - Seed value
 * @returns {number} Pseudo-random number
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate 6 unique lucky numbers between 1-49
 * @param {number} signId - Zodiac sign ID (1-12)
 * @param {number} dateHash - Hash of current date
 * @returns {number[]} Array of 6 unique numbers
 */
export function generateLuckyNumbers(signId, dateHash) {
  const numbers = new Set();
  let seed = signId * 1000 + dateHash;
  
  while (numbers.size < 6) {
    seed = (seed * 9301 + 49297) % 233280;
    const num = (seed % 49) + 1;
    numbers.add(num);
  }
  
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate a star rating (1-5) for a category
 * @param {number} signId - Zodiac sign ID
 * @param {number} dateHash - Hash of current date
 * @param {string} type - Rating type ('love', 'money', 'health')
 * @returns {number} Rating 1-5
 */
export function generateRating(signId, dateHash, type) {
  const typeOffset = type === 'love' ? 0 : type === 'money' ? 100 : 200;
  const seed = signId * 1000 + dateHash + typeOffset;
  const random = seededRandom(seed);
  return Math.floor(random * 5) + 1;
}

/**
 * Get compatible signs for a zodiac sign
 * @param {number} signId - Zodiac sign ID
 * @returns {string[]} Array of 2 compatible sign names
 */
export function getCompatibleSigns(signId) {
  const compatibleIds = COMPATIBILITY[signId] || [1, 5];
  const selected = compatibleIds.slice(0, 2);
  return selected.map(id => ZODIAC_SIGNS.find(s => s.id === id)?.name || 'Unknown');
}

/**
 * Get zodiac sign from birthday
 * @param {number} month - Birth month (1-12)
 * @param {number} day - Birth day (1-31)
 * @returns {Object|null} Zodiac sign object or null
 */
export function getSignFromBirthday(month, day) {
  for (const sign of ZODIAC_SIGNS) {
    // Handle Capricorn which spans year boundary
    if (sign.id === 10) {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return sign;
      }
    } else {
      if (month === sign.startMonth && day >= sign.startDay) {
        return sign;
      }
      if (month === sign.endMonth && day <= sign.endDay) {
        return sign;
      }
    }
  }
  return null;
}

/**
 * Get a zodiac sign by ID
 * @param {number} signId - Sign ID (1-12)
 * @returns {Object|null} Zodiac sign object
 */
export function getSignById(signId) {
  return ZODIAC_SIGNS.find(s => s.id === signId) || null;
}

/**
 * Generate lucky color for a sign
 * @param {number} signId - Zodiac sign ID
 * @param {number} dateHash - Hash of current date
 * @returns {string} Color name
 */
export function generateLuckyColor(signId, dateHash) {
  const seed = signId * 100 + dateHash;
  const index = Math.floor(seededRandom(seed) * TELETEXT_COLORS.length);
  return TELETEXT_COLORS[index];
}

/**
 * Get daily horoscope for a zodiac sign
 * @param {number} signId - Zodiac sign ID (1-12)
 * @returns {Object} Complete horoscope data
 */
export function getDailyHoroscope(signId) {
  const sign = getSignById(signId);
  if (!sign) {
    return null;
  }
  
  const today = new Date();
  const dateHash = hashDate(today);
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
    date: today.toISOString().split('T')[0]
  };
}

/**
 * Get all zodiac signs
 * @returns {Array} All 12 zodiac signs
 */
export function getAllSigns() {
  return ZODIAC_SIGNS;
}

/**
 * Get element color for a sign
 * @param {string} element - Element name
 * @returns {string} Hex color code
 */
export function getElementColor(element) {
  return ELEMENT_COLORS[element] || '#FFFF00';
}

/**
 * Format star rating as string
 * @param {number} rating - Rating 1-5
 * @returns {string} Star string like "★★★☆☆"
 */
export function formatStarRating(rating) {
  const filled = '★'.repeat(Math.min(5, Math.max(0, rating)));
  const empty = '☆'.repeat(5 - filled.length);
  return filled + empty;
}
