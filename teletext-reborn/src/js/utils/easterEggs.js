/**
 * Teletext Reborn - Easter Eggs System
 * 
 * Implements:
 * - Konami code detection (↑↑↓↓←→←→BA)
 * - Color Burst mode with rainbow animations
 * - Y2K countdown on Dec 31, 1999
 * - Birthday confetti animation
 * 
 * Requirements: 18.1-18.5
 */

import gsap from 'gsap';

// ============================================
// Secret Code Detection (Type "BURST")
// ============================================

/**
 * Secret code sequence: Type "BURST" to activate Color Burst mode
 * Simple 5-letter word that's easy to remember and type
 */
const SECRET_CODE = ['b', 'u', 'r', 's', 't'];

/**
 * Current position in secret code sequence
 * @type {number}
 */
let codeIndex = 0;

/**
 * Timeout to reset code if user pauses too long
 * @type {number|null}
 */
let codeResetTimeout = null;

/**
 * Whether Color Burst mode is active
 * @type {boolean}
 */
let colorBurstActive = false;

/**
 * Color Burst animation timeline
 * @type {gsap.core.Timeline|null}
 */
let colorBurstTimeline = null;

/**
 * Secret code keydown handler
 * @type {Function|null}
 */
let konamiHandler = null;

/**
 * Initialize secret code detection
 * Requirement 18.2: Listen for "BURST" sequence to activate Color Burst
 */
export function initKonamiCode() {
  if (konamiHandler) return; // Already initialized
  
  konamiHandler = (event) => {
    // Ignore if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const key = event.key.toLowerCase();
    
    // Only process letter keys
    if (key.length !== 1 || !/[a-z]/.test(key)) {
      return;
    }
    
    // Clear previous timeout
    if (codeResetTimeout) {
      clearTimeout(codeResetTimeout);
    }
    
    // Check if key matches expected sequence
    if (key === SECRET_CODE[codeIndex]) {
      codeIndex++;
      
      // Check if sequence complete
      if (codeIndex === SECRET_CODE.length) {
        codeIndex = 0;
        activateColorBurst();
      } else {
        // Reset after 2 seconds of no input
        codeResetTimeout = setTimeout(() => {
          codeIndex = 0;
        }, 2000);
      }
    } else {
      // Reset if wrong key, but check if this key starts the sequence
      codeIndex = key === SECRET_CODE[0] ? 1 : 0;
      
      if (codeIndex === 1) {
        codeResetTimeout = setTimeout(() => {
          codeIndex = 0;
        }, 2000);
      }
    }
  };
  
  document.addEventListener('keydown', konamiHandler);
}

/**
 * Destroy secret code detection
 */
export function destroyKonamiCode() {
  if (konamiHandler) {
    document.removeEventListener('keydown', konamiHandler);
    konamiHandler = null;
  }
  if (codeResetTimeout) {
    clearTimeout(codeResetTimeout);
    codeResetTimeout = null;
  }
  codeIndex = 0;
}

/**
 * Check if Konami code detection is active
 * @returns {boolean}
 */
export function isKonamiActive() {
  return konamiHandler !== null;
}

// ============================================
// Color Burst Mode
// ============================================

/**
 * Teletext colors for rainbow effect
 */
const RAINBOW_COLORS = [
  '#FF0000', // Red
  '#FF00FF', // Magenta
  '#0000FF', // Blue
  '#00FFFF', // Cyan
  '#00FF00', // Green
  '#FFFF00', // Yellow
];

/**
 * Activate Color Burst mode with rainbow animations
 * Requirement 18.2: Activate Color Burst mode with rainbow animations
 */
export function activateColorBurst() {
  if (colorBurstActive) {
    deactivateColorBurst();
    return;
  }
  
  colorBurstActive = true;
  
  // Create Color Burst overlay
  const overlay = document.createElement('div');
  overlay.id = 'color-burst-overlay';
  overlay.className = 'color-burst-overlay';
  overlay.innerHTML = `
    <div class="color-burst-message">
      <div class="color-burst-title">🌈 COLOR BURST MODE 🌈</div>
      <div class="color-burst-subtitle">SECRET CODE ACTIVATED!</div>
      <div class="color-burst-hint">Press ESC to exit</div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Add CSS for Color Burst
  addColorBurstStyles();
  
  // Create rainbow animation timeline
  colorBurstTimeline = gsap.timeline({ repeat: -1 });
  
  // Animate screen border through rainbow colors
  const screen = document.querySelector('.teletext-screen');
  if (screen) {
    screen.classList.add('color-burst-active');
    
    RAINBOW_COLORS.forEach((color, index) => {
      colorBurstTimeline.to(screen, {
        boxShadow: `0 0 30px ${color}, inset 0 0 20px ${color}`,
        duration: 0.3,
        ease: 'power1.inOut'
      }, index * 0.3);
    });
  }
  
  // Animate text colors
  const textElements = document.querySelectorAll('.phosphor-glow, .teletext-page-title');
  textElements.forEach((el, i) => {
    gsap.to(el, {
      color: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: i * 0.1
    });
  });
  
  // Show overlay with animation
  gsap.fromTo(overlay, 
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
  );
  
  // Auto-hide message after 3 seconds
  gsap.to(overlay.querySelector('.color-burst-message'), {
    opacity: 0,
    y: -20,
    duration: 0.5,
    delay: 3,
    ease: 'power2.in'
  });
  
  // Listen for ESC to deactivate
  document.addEventListener('keydown', handleColorBurstEscape);
  
  // Play sound effect if available
  try {
    const { playSuccess } = require('../services/soundManager.js');
    playSuccess();
  } catch (e) {
    // Sound not available
  }
}

/**
 * Handle ESC key to exit Color Burst mode
 * @param {KeyboardEvent} event
 */
function handleColorBurstEscape(event) {
  if (event.key === 'Escape' && colorBurstActive) {
    deactivateColorBurst();
  }
}

/**
 * Deactivate Color Burst mode
 */
export function deactivateColorBurst() {
  if (!colorBurstActive) return;
  
  colorBurstActive = false;
  
  // Kill timeline
  if (colorBurstTimeline) {
    colorBurstTimeline.kill();
    colorBurstTimeline = null;
  }
  
  // Kill all color tweens
  gsap.killTweensOf('.phosphor-glow, .teletext-page-title');
  
  // Remove overlay
  const overlay = document.getElementById('color-burst-overlay');
  if (overlay) {
    gsap.to(overlay, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => overlay.remove()
    });
  }
  
  // Reset screen
  const screen = document.querySelector('.teletext-screen');
  if (screen) {
    screen.classList.remove('color-burst-active');
    gsap.to(screen, {
      boxShadow: 'none',
      duration: 0.3
    });
  }
  
  // Reset text colors
  const textElements = document.querySelectorAll('.phosphor-glow, .teletext-page-title');
  textElements.forEach(el => {
    gsap.to(el, {
      color: '',
      duration: 0.3,
      clearProps: 'color'
    });
  });
  
  // Remove escape listener
  document.removeEventListener('keydown', handleColorBurstEscape);
}

/**
 * Check if Color Burst mode is active
 * @returns {boolean}
 */
export function isColorBurstActive() {
  return colorBurstActive;
}

/**
 * Add Color Burst CSS styles
 */
function addColorBurstStyles() {
  if (document.getElementById('color-burst-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'color-burst-styles';
  style.textContent = `
    .color-burst-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .color-burst-message {
      background: rgba(0, 0, 0, 0.9);
      border: 4px solid;
      border-image: linear-gradient(90deg, #FF0000, #FF00FF, #0000FF, #00FFFF, #00FF00, #FFFF00) 1;
      padding: 24px 48px;
      text-align: center;
      font-family: 'Press Start 2P', monospace;
    }
    
    .color-burst-title {
      font-size: 18px;
      color: #FFFF00;
      margin-bottom: 12px;
      animation: rainbow-text 2s linear infinite;
    }
    
    .color-burst-subtitle {
      font-size: 12px;
      color: #00FFFF;
      margin-bottom: 8px;
    }
    
    .color-burst-hint {
      font-size: 10px;
      color: #FFFFFF;
      opacity: 0.7;
    }
    
    @keyframes rainbow-text {
      0% { color: #FF0000; }
      16% { color: #FF00FF; }
      33% { color: #0000FF; }
      50% { color: #00FFFF; }
      66% { color: #00FF00; }
      83% { color: #FFFF00; }
      100% { color: #FF0000; }
    }
    
    .color-burst-active {
      animation: rainbow-border 2s linear infinite;
    }
    
    @keyframes rainbow-border {
      0% { box-shadow: 0 0 30px #FF0000, inset 0 0 20px #FF0000; }
      16% { box-shadow: 0 0 30px #FF00FF, inset 0 0 20px #FF00FF; }
      33% { box-shadow: 0 0 30px #0000FF, inset 0 0 20px #0000FF; }
      50% { box-shadow: 0 0 30px #00FFFF, inset 0 0 20px #00FFFF; }
      66% { box-shadow: 0 0 30px #00FF00, inset 0 0 20px #00FF00; }
      83% { box-shadow: 0 0 30px #FFFF00, inset 0 0 20px #FFFF00; }
      100% { box-shadow: 0 0 30px #FF0000, inset 0 0 20px #FF0000; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// Confetti Animation (Birthday)
// ============================================

/**
 * Create confetti animation for birthday
 * Requirement 18.4: Birthday confetti animation
 */
export function createConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.id = 'confetti-container';
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // Add confetti styles
  addConfettiStyles();
  
  // Create confetti pieces
  const colors = ['#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF'];
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confettiContainer.appendChild(confetti);
    
    // Animate each piece
    gsap.fromTo(confetti, 
      {
        y: -20,
        x: 0,
        rotation: 0,
        opacity: 1
      },
      {
        y: window.innerHeight + 20,
        x: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
        ease: 'power1.out',
        onComplete: () => confetti.remove()
      }
    );
  }
  
  // Remove container after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 7000);
}

/**
 * Add confetti CSS styles
 */
function addConfettiStyles() {
  if (document.getElementById('confetti-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'confetti-styles';
  style.textContent = `
    .confetti-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      overflow: hidden;
    }
    
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      top: 0;
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// Y2K Countdown
// ============================================

/**
 * Check if date is Y2K (Dec 31, 1999)
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isY2K(date) {
  return date.getMonth() === 11 && 
         date.getDate() === 31 && 
         date.getFullYear() === 1999;
}

/**
 * Create Y2K countdown animation
 * Requirement 18.3: Y2K countdown on Dec 31, 1999
 * @returns {string} HTML for Y2K countdown
 */
export function createY2KCountdown() {
  return `
    <div class="y2k-countdown">
      <div class="y2k-title double-height" style="color: #FF0000;">
        ⚠ Y2K ALERT ⚠
      </div>
      <div class="y2k-message" style="color: #FFFF00; margin: 16px 0;">
        THE MILLENNIUM BUG IS COMING!
      </div>
      <div class="y2k-timer" style="color: #00FFFF; font-size: 18px;">
        COUNTDOWN TO CHAOS:
      </div>
      <div class="y2k-clock" id="y2k-clock" style="color: #00FF00; font-size: 24px; margin: 12px 0;">
        23:59:59
      </div>
      <div class="y2k-warning" style="color: #FF00FF; margin-top: 16px;">
        WILL YOUR COMPUTER SURVIVE?
      </div>
      <div class="y2k-hint" style="color: #FFFFFF; opacity: 0.7; margin-top: 8px; font-size: 10px;">
        (Spoiler: It did!)
      </div>
    </div>
  `;
}

/**
 * Start Y2K countdown animation
 */
export function startY2KCountdown() {
  const clockEl = document.getElementById('y2k-clock');
  if (!clockEl) return;
  
  let hours = 23;
  let minutes = 59;
  let seconds = 59;
  
  const interval = setInterval(() => {
    seconds--;
    if (seconds < 0) {
      seconds = 59;
      minutes--;
      if (minutes < 0) {
        minutes = 59;
        hours--;
        if (hours < 0) {
          clearInterval(interval);
          clockEl.textContent = '00:00:00';
          clockEl.style.color = '#FF0000';
          
          // Flash effect
          gsap.to(clockEl, {
            opacity: 0,
            duration: 0.2,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
              clockEl.textContent = 'HAPPY NEW MILLENNIUM!';
              clockEl.style.fontSize = '14px';
              createConfetti();
            }
          });
          return;
        }
      }
    }
    
    clockEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 100); // Fast countdown for demo
  
  return interval;
}

// ============================================
// Birthday Detection
// ============================================

/**
 * Check if today is user's birthday
 * @param {Object} birthday - Birthday object { month, day }
 * @returns {boolean}
 */
export function isBirthday(birthday) {
  if (!birthday || !birthday.month || !birthday.day) return false;
  
  const today = new Date();
  return today.getMonth() + 1 === birthday.month && 
         today.getDate() === birthday.day;
}

/**
 * Create birthday message
 * @returns {string} HTML for birthday message
 */
export function createBirthdayMessage() {
  return `
    <div class="birthday-banner" style="text-align: center; padding: 16px; background: #000; border: 2px solid #FF00FF;">
      <div class="birthday-title double-height" style="color: #FF00FF;">
        🎂 HAPPY BIRTHDAY! 🎂
      </div>
      <div class="birthday-message" style="color: #FFFF00; margin-top: 12px;">
        WISHING YOU A FANTASTIC DAY!
      </div>
      <div class="birthday-confetti" style="color: #00FFFF; margin-top: 8px;">
        🎉 🎈 🎁 🎊 🎉
      </div>
    </div>
  `;
}

/**
 * Show birthday celebration
 */
export function showBirthdayCelebration() {
  createConfetti();
  
  // Play success sound if available
  try {
    const { playSuccess } = require('../services/soundManager.js');
    playSuccess();
  } catch (e) {
    // Sound not available
  }
}

// ============================================
// Reset for Testing
// ============================================

/**
 * Reset all Easter egg state (for testing)
 */
export function resetEasterEggs() {
  destroyKonamiCode();
  deactivateColorBurst();
  codeIndex = 0;
}
