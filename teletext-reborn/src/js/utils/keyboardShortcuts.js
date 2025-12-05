/**
 * Teletext Reborn - Keyboard Shortcuts Overlay
 * 
 * Displays keyboard shortcuts when "?" is pressed
 * Requirements: 19.1-19.4
 */

import gsap from 'gsap';

let overlayElement = null;
let isVisible = false;
let keyHandler = null;

const SHORTCUTS = [
  { key: '1', action: 'NEWS' },
  { key: '2', action: 'WEATHER' },
  { key: '3', action: 'FINANCE' },
  { key: '4', action: 'TIME MACHINE' },
  { key: '5', action: 'HISTORICAL EVENTS' },
  { key: '6', action: 'HISTORICAL WEATHER' },
  { key: '7', action: 'EASTER EGG (888)' },
  { key: '8', action: 'SETTINGS' },
  { key: '9', action: 'ABOUT' },
  { key: '←/→', action: 'PREV/NEXT PAGE' },
  { key: '↑/↓', action: 'HISTORY BACK/FWD' },
  { key: 'ESC', action: 'GO HOME' },
  { key: '?', action: 'THIS HELP' },
];

const SECRET_HINT = '↑↑↓↓←→←→BA = COLOR BURST MODE!';

export function initKeyboardShortcutsOverlay() {
  if (keyHandler) return;
  
  keyHandler = (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    // If overlay is visible, handle close keys
    if (isVisible) {
      // Close on Escape or any key except modifier keys
      if (event.key === 'Escape' || 
          (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) {
        event.preventDefault();
        event.stopPropagation();
        hideShortcutsOverlay();
      }
      return;
    }
    
    // If overlay is NOT visible, open on "?" key
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      event.stopPropagation();
      showShortcutsOverlay();
    }
  };
  
  document.addEventListener('keydown', keyHandler);
}

export function destroyKeyboardShortcutsOverlay() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  hideShortcutsOverlay();
}

export function toggleShortcutsOverlay() {
  if (isVisible) {
    hideShortcutsOverlay();
  } else {
    showShortcutsOverlay();
  }
}

export function showShortcutsOverlay() {
  if (isVisible) return;
  isVisible = true;
  
  overlayElement = document.createElement('div');
  overlayElement.id = 'keyboard-shortcuts-overlay';
  overlayElement.className = 'shortcuts-overlay';
  overlayElement.innerHTML = createOverlayHTML();
  document.body.appendChild(overlayElement);
  
  addOverlayStyles();
  
  overlayElement.addEventListener('click', (e) => {
    if (e.target === overlayElement) hideShortcutsOverlay();
  });
  
  gsap.fromTo(overlayElement, 
    { opacity: 0 },
    { opacity: 1, duration: 0.2, ease: 'power1.out' }
  );
  
  gsap.fromTo(overlayElement.querySelector('.shortcuts-modal'),
    { scale: 0.9, y: -20 },
    { scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)' }
  );
}

export function hideShortcutsOverlay() {
  if (!isVisible || !overlayElement) return;
  
  gsap.to(overlayElement, {
    opacity: 0,
    duration: 0.2,
    ease: 'power1.in',
    onComplete: () => {
      if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
      }
      isVisible = false;
    }
  });
}

function createOverlayHTML() {
  const shortcutRows = SHORTCUTS.map(s => 
    `<div class="shortcut-row">
      <span class="shortcut-key">${s.key}</span>
      <span class="shortcut-action">${s.action}</span>
    </div>`
  ).join('');
  
  return `
    <div class="shortcuts-modal">
      <div class="shortcuts-title">⌨ KEYBOARD SHORTCUTS</div>
      <div class="shortcuts-separator">════════════════════════════════</div>
      <div class="shortcuts-list">${shortcutRows}</div>
      <div class="shortcuts-separator">────────────────────────────────</div>
      <div class="shortcuts-secret">${SECRET_HINT}</div>
      <div class="shortcuts-close">PRESS ANY KEY OR CLICK TO CLOSE</div>
    </div>
  `;
}

function addOverlayStyles() {
  if (document.getElementById('shortcuts-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'shortcuts-styles';
  style.textContent = `
    .shortcuts-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Press Start 2P', monospace;
    }
    .shortcuts-modal {
      background: #000;
      border: 4px solid #00FFFF;
      padding: 24px 32px;
      max-width: 500px;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
    }
    .shortcuts-title {
      color: #FFFF00;
      font-size: 14px;
      text-align: center;
      margin-bottom: 16px;
    }
    .shortcuts-separator {
      color: #00FFFF;
      text-align: center;
      margin: 12px 0;
      font-size: 10px;
    }
    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .shortcut-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .shortcut-key {
      color: #00FF00;
      min-width: 80px;
    }
    .shortcut-action {
      color: #FFFFFF;
      text-align: right;
    }
    .shortcuts-secret {
      color: #FF00FF;
      font-size: 9px;
      text-align: center;
      margin-top: 12px;
    }
    .shortcuts-close {
      color: #FFFFFF;
      opacity: 0.6;
      font-size: 8px;
      text-align: center;
      margin-top: 16px;
    }
  `;
  document.head.appendChild(style);
}

export function isShortcutsVisible() { return isVisible; }
