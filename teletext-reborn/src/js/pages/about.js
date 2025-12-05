/**
 * Teletext Reborn - About Page (Page 999)
 * 
 * Project information and credits:
 * - Project description
 * - Teletext history (1974-2012)
 * - API credits
 * - Hackathon info
 * 
 * @module pages/about
 * Requirements: 16.1-16.5
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { createSeparator } from '../utils/teletext.js';

// ============================================
// Constants
// ============================================

export const PAGE_NUMBER = PAGE_NUMBERS.ABOUT;
export const TITLE = '★ ABOUT ★';

// ============================================
// Render
// ============================================

/**
 * Render the about page
 * @returns {string} HTML content
 */
export function render() {
  return `
    <div class="about-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <!-- Project Info -->
        <div class="content-line" style="color: var(--tt-cyan);">
          TELETEXT REBORN
        </div>
        <div class="content-line" style="color: var(--tt-white); margin-top: 4px;">
          A NOSTALGIC REVIVAL OF THE ICONIC
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          TELETEXT INFORMATION SERVICE
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- History -->
        <div class="content-line" style="color: var(--tt-cyan);">
          TELETEXT HISTORY
        </div>
        <div class="content-line" style="color: var(--tt-white); margin-top: 4px;">
          • LAUNCHED: 1974 (BBC CEEFAX)
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • PEAK: 20M+ UK VIEWERS DAILY
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • DISCONTINUED: 2012
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • FEATURES: 8 COLORS, 40x25 GRID
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Features -->
        <div class="content-line" style="color: var(--tt-cyan);">
          FEATURES
        </div>
        <div class="content-line" style="color: var(--tt-green); margin-top: 4px;">
          ► LIVE NEWS, WEATHER, FINANCE
        </div>
        <div class="content-line" style="color: var(--tt-green);">
          ► TIME MACHINE (1940-TODAY)
        </div>
        <div class="content-line" style="color: var(--tt-green);">
          ► AUTHENTIC CRT EFFECTS
        </div>
        <div class="content-line" style="color: var(--tt-green);">
          ► GSAP ANIMATIONS
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Credits -->
        <div class="content-line" style="color: var(--tt-cyan);">
          DATA SOURCES
        </div>
        <div class="content-line" style="color: var(--tt-white); margin-top: 4px;">
          • WEATHER: OPEN-METEO.COM
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • HISTORY: WIKIPEDIA API
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • NEWS: NEWSDATA.IO
        </div>
        <div class="content-line" style="color: var(--tt-white);">
          • CRYPTO: COINLORE API
        </div>
        
        <div class="separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Tech -->
        <div class="content-line" style="color: var(--tt-cyan);">
          BUILT WITH
        </div>
        <div class="content-line" style="color: var(--tt-magenta); margin-top: 4px;">
          VANILLA JS • GSAP • VITE
        </div>
        <div class="content-line" style="color: var(--tt-magenta);">
          PRESS START 2P FONT
        </div>
      </div>
      
      <div class="teletext-page-footer" style="text-align: center; color: var(--tt-yellow);">
        HACKATHON 2025 • RESURRECTION
      </div>
    </div>
  `;
}

/**
 * Called after page is mounted
 */
export function onMount() {
  animateContent();
}

/**
 * Called before page unmounts
 */
export function onUnmount() {
  const lines = document.querySelectorAll('.about-page .content-line');
  if (lines.length > 0) {
    gsap.killTweensOf(lines);
  }
}

/**
 * Get Fastext buttons
 */
export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'SETTINGS', page: PAGE_NUMBERS.SETTINGS },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  };
}

// ============================================
// Animation
// ============================================

function animateContent() {
  const lines = document.querySelectorAll('.about-page .content-line');
  if (lines.length > 0) {
    gsap.from(lines, {
      opacity: 0,
      x: -8,
      duration: 0.2,
      stagger: 0.03,
      ease: 'power2.out'
    });
  }
}
