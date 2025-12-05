/**
 * Teletext Reborn - 404 Not Found Page
 * 
 * Displays a humorous "Page Not Found" message in Teletext style
 * Requirement 18.5: Humorous not found message
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';

// Humorous 404 messages
const ERROR_MESSAGES = [
  { title: 'OOPS!', message: 'THIS PAGE HAS GONE TO GET MILK AND NEVER CAME BACK.' },
  { title: 'ERROR 404', message: 'PAGE NOT FOUND. HAVE YOU TRIED TURNING IT OFF AND ON AGAIN?' },
  { title: 'WHOOPS!', message: 'THIS PAGE IS ON A TEA BREAK. PLEASE TRY AGAIN LATER.' },
  { title: 'BLIMEY!', message: 'THIS PAGE HAS DONE A RUNNER. LAST SEEN HEADING TO PAGE 100.' },
  { title: 'CRIKEY!', message: 'THE PAGE YOU SEEK EXISTS ONLY IN YOUR IMAGINATION.' },
  { title: 'OH DEAR!', message: 'THIS PAGE WAS LOST IN THE DIGITAL SWITCHOVER OF 2012.' },
  { title: 'SORRY!', message: 'THIS PAGE IS BUFFERING... SINCE 1985.' },
  { title: 'NOPE!', message: 'PAGE NOT FOUND. BLAME THE MILLENNIUM BUG.' },
];

let currentMessage = null;

export function render() {
  // Pick a random message
  currentMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
  
  return `
    <div class="teletext-page not-found-page">
      <div class="teletext-page-title phosphor-glow" style="color: #FF0000;">
        ⚠ ${currentMessage.title} ⚠
      </div>
      
      <div class="separator-double" style="color: #FF0000; margin: 12px 0;">════════════════════════════════════════</div>
      
      <div class="error-ascii" style="color: #FFFF00; text-align: center; font-size: 10px; line-height: 1.2; margin: 16px 0;">
        <pre style="font-family: 'Press Start 2P', monospace;">
    ╔═══════════════╗
    ║   4   0   4   ║
    ║  ┌─┐ ┌─┐ ┌─┐  ║
    ║  │█│ │ │ │█│  ║
    ║  └─┘ └─┘ └─┘  ║
    ╚═══════════════╝
        </pre>
      </div>
      
      <div class="error-message" style="color: #FFFFFF; text-align: center; margin: 16px 0; line-height: 1.6;">
        ${currentMessage.message}
      </div>
      
      <div class="separator-light" style="color: #00FFFF; margin: 16px 0;">────────────────────────────────────────</div>
      
      <div class="error-suggestions" style="color: #00FFFF; margin: 16px 0;">
        <div style="margin-bottom: 8px;">SUGGESTIONS:</div>
        <div style="color: #FFFFFF; margin-left: 16px;">► CHECK THE PAGE NUMBER</div>
        <div style="color: #FFFFFF; margin-left: 16px;">► PRESS RED FOR HOME</div>
        <div style="color: #FFFFFF; margin-left: 16px;">► TRY PAGE 888 FOR A SURPRISE</div>
      </div>
      
      <div class="error-hint" style="color: #FF00FF; text-align: center; margin-top: 16px; font-size: 10px;">
        VALID PAGES: 100-109, 200-209, 300-309, 500-502, 888, 900, 999
      </div>
    </div>
  `;
}

export function onMount() {
  // Shake animation for the title
  gsap.from('.not-found-page .teletext-page-title', {
    x: -5,
    duration: 0.1,
    repeat: 5,
    yoyo: true,
    ease: 'power1.inOut'
  });
  
  // Fade in content
  gsap.from('.error-message, .error-suggestions', {
    opacity: 0,
    y: 10,
    duration: 0.5,
    stagger: 0.2,
    ease: 'power2.out',
    delay: 0.3
  });
}

export function onUnmount() {
  gsap.killTweensOf('.not-found-page *');
}

export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    cyan: { label: 'SECRET', page: PAGE_NUMBERS.EASTER_EGG },
  };
}
