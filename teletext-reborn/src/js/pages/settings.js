/**
 * Teletext Reborn - Settings Page (Page 900)
 * 
 * User preferences and customization:
 * - Location input with auto-detect
 * - Birthday picker for personalization
 * - Temperature unit toggle (°C/°F)
 * - Theme toggle (Classic Green / Full Color)
 * - Scanlines toggle
 * - Reset All button with confirmation
 * 
 * @module pages/settings
 * Requirements: 12.1-12.10
 */

import gsap from 'gsap';
import { PAGE_NUMBERS, getRouter } from '../router.js';
import { getStateManager } from '../state.js';
import { MONTH_NAMES } from '../utils/date.js';
import { createSeparator } from '../utils/teletext.js';
import { getLocation } from '../services/geoApi.js';
import { playSuccess, playError } from '../services/soundManager.js';

// ============================================
// Constants
// ============================================

export const PAGE_NUMBER = PAGE_NUMBERS.SETTINGS;
export const TITLE = '⚙ SETTINGS';

/** Days in each month (Feb has 29 for leap year support) */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ============================================
// State
// ============================================

let isDetectingLocation = false;
let saveMessage = null;
let saveMessageTimeout = null;

// ============================================
// Render
// ============================================

/**
 * Render the settings page
 * Requirements: 12.1-12.10
 * @returns {string} HTML content
 */
export function render() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  
  const locationCity = settings.location?.city || '';
  const birthday = settings.birthday || { month: 1, day: 1 };
  const tempUnit = settings.temperatureUnit || 'celsius';
  const theme = settings.theme || 'color';
  const scanlinesOn = settings.scanlinesEnabled !== false;
  const soundOn = settings.sound !== false;
  
  // Format birthday display (Req 12.7)
  const birthdayDisplay = settings.birthday 
    ? `YOUR BIRTHDAY: ${MONTH_NAMES[birthday.month - 1]} ${birthday.day}`
    : '';
  
  return `
    <div class="settings-page teletext-page">
      <!-- Title (Req 12.1) - Double-height -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        ${TITLE}
      </div>
      
      <div class="separator" style="color: var(--tt-cyan);">
        ${createSeparator('═', 40)}
      </div>
      
      <div class="teletext-page-content">
        <!-- Location Setting (Req 12.2, 12.3) -->
        <div class="setting-group" style="margin: 6px 0;">
          <div class="content-line" style="color: var(--tt-cyan);">
            LOCATION
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <input type="text" 
                   id="setting-location" 
                   class="teletext-input" 
                   value="${escapeHtml(locationCity)}"
                   placeholder="Enter city..."
                   aria-label="Location city name"
                   style="flex: 1; max-width: 160px;">
            <button id="detect-location" 
                    class="fastext-button fastext-button--cyan" 
                    style="font-size: 8px;"
                    aria-label="Auto-detect location">
              ${isDetectingLocation ? '...' : 'DETECT'}
            </button>
          </div>
        </div>
        
        <!-- Birthday Setting (Req 12.2, 12.7) -->
        <div class="setting-group" style="margin: 8px 0;">
          <div class="content-line" style="color: var(--tt-cyan);">
            BIRTHDAY
          </div>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <select id="setting-birthday-month" 
                    class="teletext-select" 
                    style="width: 100px;"
                    aria-label="Birthday month">
              ${MONTH_NAMES.map((name, i) => 
                `<option value="${i + 1}" ${i + 1 === birthday.month ? 'selected' : ''}>${name.substring(0, 3)}</option>`
              ).join('')}
            </select>
            <select id="setting-birthday-day" 
                    class="teletext-select" 
                    style="width: 55px;"
                    aria-label="Birthday day">
              ${Array.from({length: DAYS_IN_MONTH[birthday.month - 1]}, (_, i) => 
                `<option value="${i + 1}" ${i + 1 === birthday.day ? 'selected' : ''}>${i + 1}</option>`
              ).join('')}
            </select>
          </div>
          ${birthdayDisplay ? `
          <div class="content-line" style="color: var(--tt-green); margin-top: 4px; font-size: 9px;">
            ${birthdayDisplay}
          </div>
          ` : ''}
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 6px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Temperature Unit (Req 12.2) -->
        <div class="setting-group" style="margin: 6px 0;">
          <div class="content-line" style="color: var(--tt-cyan);">
            TEMPERATURE UNIT
          </div>
          <div style="display: flex; gap: 12px; margin-top: 4px;">
            <label class="setting-radio" style="color: ${tempUnit === 'celsius' ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="radio" name="temp-unit" value="celsius" ${tempUnit === 'celsius' ? 'checked' : ''}>
              °C CELSIUS
            </label>
            <label class="setting-radio" style="color: ${tempUnit === 'fahrenheit' ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="radio" name="temp-unit" value="fahrenheit" ${tempUnit === 'fahrenheit' ? 'checked' : ''}>
              °F FAHRENHEIT
            </label>
          </div>
        </div>
        
        <!-- Theme Toggle (Req 12.2) -->
        <div class="setting-group" style="margin: 8px 0;">
          <div class="content-line" style="color: var(--tt-cyan);">
            THEME
          </div>
          <div style="display: flex; gap: 12px; margin-top: 4px;">
            <label class="setting-radio" style="color: ${theme === 'classic' ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="radio" name="theme" value="classic" ${theme === 'classic' ? 'checked' : ''}>
              CLASSIC GREEN
            </label>
            <label class="setting-radio" style="color: ${theme === 'color' ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="radio" name="theme" value="color" ${theme === 'color' ? 'checked' : ''}>
              FULL COLOR
            </label>
          </div>
        </div>
        
        <!-- Display & Sound Options -->
        <div class="setting-group" style="margin: 8px 0;">
          <div class="content-line" style="color: var(--tt-cyan);">
            DISPLAY & SOUND
          </div>
          <div style="margin-top: 4px;">
            <label class="setting-toggle" style="display: block; margin: 4px 0; color: ${scanlinesOn ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="checkbox" id="setting-scanlines" ${scanlinesOn ? 'checked' : ''}>
              SCANLINES ${scanlinesOn ? '(ON)' : '(OFF)'}
            </label>
            <label class="setting-toggle" style="display: block; margin: 4px 0; color: ${soundOn ? 'var(--tt-yellow)' : 'var(--tt-white)'};">
              <input type="checkbox" id="setting-sound" ${soundOn ? 'checked' : ''}>
              SOUND FX ${soundOn ? '(ON)' : '(OFF)'}
            </label>
          </div>
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 6px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Actions (Req 12.8, 12.9) -->
        <div class="setting-actions" style="display: flex; gap: 12px; margin: 8px 0;">
          <button id="save-settings" 
                  class="fastext-button fastext-button--green"
                  aria-label="Save all settings">
            SAVE
          </button>
          <button id="reset-settings" 
                  class="fastext-button fastext-button--red"
                  aria-label="Reset all settings to defaults">
            RESET ALL
          </button>
        </div>
        
        <!-- Save Message (Req 12.4) -->
        <div id="save-message" 
             class="content-line" 
             style="color: var(--tt-green); margin-top: 6px; min-height: 1.4em;"
             role="status"
             aria-live="polite">
          ${saveMessage || ''}
        </div>
      </div>
      
      <div class="teletext-page-footer" style="text-align: center;">
        SETTINGS AUTO-SAVE ON CHANGE
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Called after page is mounted
 */
export function onMount() {
  attachEventHandlers();
  animateContent();
}

/**
 * Called before page unmounts
 */
export function onUnmount() {
  if (saveMessageTimeout) {
    clearTimeout(saveMessageTimeout);
    saveMessageTimeout = null;
  }
  saveMessage = null;
}

/**
 * Get Fastext buttons (Req 12.10)
 * Red=Home, Green=Save All, Yellow=Reset, Cyan=About
 */
export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'SAVE', action: saveSettings },
    yellow: { label: 'RESET', action: confirmReset },
    cyan: { label: 'ABOUT', page: PAGE_NUMBERS.ABOUT },
  };
}

// ============================================
// Event Handlers
// ============================================

function attachEventHandlers() {
  // Location detect (Req 12.3)
  const detectBtn = document.getElementById('detect-location');
  if (detectBtn) {
    detectBtn.addEventListener('click', detectLocation);
  }
  
  // Birthday month change - update days
  const monthSelect = document.getElementById('setting-birthday-month');
  if (monthSelect) {
    monthSelect.addEventListener('change', updateBirthdayDays);
  }
  
  // Save button
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }
  
  // Reset button (Req 12.8, 12.9)
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', confirmReset);
  }
  
  // Auto-save on change (Req 12.4)
  const inputs = document.querySelectorAll('.settings-page input, .settings-page select');
  inputs.forEach(input => {
    input.addEventListener('change', autoSave);
  });
}

/**
 * Update birthday day options when month changes
 */
function updateBirthdayDays() {
  const monthSelect = document.getElementById('setting-birthday-month');
  const daySelect = document.getElementById('setting-birthday-day');
  if (!monthSelect || !daySelect) return;
  
  const month = parseInt(monthSelect.value, 10);
  const maxDays = DAYS_IN_MONTH[month - 1];
  const currentDay = parseInt(daySelect.value, 10);
  
  daySelect.innerHTML = Array.from({length: maxDays}, (_, i) => 
    `<option value="${i + 1}" ${i + 1 === Math.min(currentDay, maxDays) ? 'selected' : ''}>${i + 1}</option>`
  ).join('');
}

/**
 * Detect location using IP geolocation (Req 12.3)
 */
async function detectLocation() {
  if (isDetectingLocation) return;
  
  isDetectingLocation = true;
  const detectBtn = document.getElementById('detect-location');
  if (detectBtn) detectBtn.textContent = '...';
  
  try {
    const location = await getLocation();
    if (location && location.city) {
      const input = document.getElementById('setting-location');
      if (input) {
        input.value = location.city;
        showMessage('LOCATION DETECTED!', 'var(--tt-green)');
        autoSave();
      }
    } else {
      showMessage('DETECTION FAILED', 'var(--tt-red)');
    }
  } catch (error) {
    playError();
    showMessage('DETECTION FAILED', 'var(--tt-red)');
  } finally {
    isDetectingLocation = false;
    if (detectBtn) detectBtn.textContent = 'DETECT';
  }
}

/**
 * Save all settings to localStorage (Req 12.4)
 */
function saveSettings() {
  const stateManager = getStateManager();
  
  const location = document.getElementById('setting-location')?.value || '';
  const birthdayMonth = parseInt(document.getElementById('setting-birthday-month')?.value, 10) || 1;
  const birthdayDay = parseInt(document.getElementById('setting-birthday-day')?.value, 10) || 1;
  const tempUnit = document.querySelector('input[name="temp-unit"]:checked')?.value || 'celsius';
  const theme = document.querySelector('input[name="theme"]:checked')?.value || 'color';
  const scanlines = document.getElementById('setting-scanlines')?.checked !== false;
  const sound = document.getElementById('setting-sound')?.checked !== false;
  
  stateManager.updateSettings({
    location: location ? { city: location } : null,
    birthday: { month: birthdayMonth, day: birthdayDay },
    temperatureUnit: tempUnit,
    theme,
    scanlinesEnabled: scanlines,
    sound,
  });
  
  // Apply scanlines immediately
  applyScanlinesEffect(scanlines);
  
  // Apply theme immediately
  applyTheme(theme);
  
  // Play success sound
  playSuccess();
  
  showMessage('SETTINGS SAVED!', 'var(--tt-green)');
}

/**
 * Auto-save on any setting change (Req 12.4)
 */
function autoSave() {
  saveSettings();
}

/**
 * Confirm and reset all settings (Req 12.8, 12.9)
 */
function confirmReset() {
  // Req 12.9: Ask for confirmation before clearing
  if (confirm('RESET ALL SETTINGS TO DEFAULT?\n\nThis will clear all your preferences.')) {
    const stateManager = getStateManager();
    stateManager.resetSettings();
    
    // Re-apply default effects
    applyScanlinesEffect(true);
    applyTheme('color');
    
    showMessage('SETTINGS RESET!', 'var(--tt-yellow)');
    
    // Re-render page to show defaults
    const router = getRouter();
    router.navigate(PAGE_NUMBERS.SETTINGS);
  }
}

/**
 * Apply scanlines effect to screen
 * @param {boolean} enabled - Whether scanlines are enabled
 */
function applyScanlinesEffect(enabled) {
  const screen = document.querySelector('.teletext-screen');
  if (screen) {
    screen.classList.toggle('scanlines-disabled', !enabled);
  }
  
  const scanlines = document.querySelector('.scanlines');
  if (scanlines) {
    scanlines.style.display = enabled ? 'block' : 'none';
  }
}

/**
 * Apply theme to the application
 * @param {string} theme - 'classic' or 'color'
 */
function applyTheme(theme) {
  const app = document.querySelector('.teletext-app');
  if (app) {
    app.classList.toggle('theme-classic', theme === 'classic');
    app.classList.toggle('theme-color', theme === 'color');
  }
  
  // For classic green theme, override primary color
  document.documentElement.style.setProperty(
    '--color-primary', 
    theme === 'classic' ? 'var(--tt-green)' : 'var(--tt-yellow)'
  );
}

/**
 * Show a temporary message (Req 12.4 - visual confirmation)
 * @param {string} text - Message text
 * @param {string} color - CSS color value
 */
function showMessage(text, color) {
  saveMessage = text;
  const msgEl = document.getElementById('save-message');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.style.color = color;
    
    gsap.fromTo(msgEl, 
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power1.out' }
    );
  }
  
  if (saveMessageTimeout) clearTimeout(saveMessageTimeout);
  saveMessageTimeout = setTimeout(() => {
    saveMessage = null;
    if (msgEl) {
      gsap.to(msgEl, { opacity: 0, duration: 0.3, ease: 'power1.out' });
    }
  }, 2000);
}

/**
 * Animate content on mount
 */
function animateContent() {
  const groups = document.querySelectorAll('.setting-group');
  if (groups.length > 0) {
    gsap.from(groups, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      stagger: 0.06,
      ease: 'power2.out'
    });
  }
}

// ============================================
// Exports
// ============================================

/**
 * Reset settings page state (for testing)
 */
export function resetSettingsPageState() {
  isDetectingLocation = false;
  saveMessage = null;
  if (saveMessageTimeout) {
    clearTimeout(saveMessageTimeout);
    saveMessageTimeout = null;
  }
}
