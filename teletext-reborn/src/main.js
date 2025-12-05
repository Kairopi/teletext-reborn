/**
 * Teletext Reborn - Main Entry Point
 * 
 * This is the application entry point that initializes the Teletext experience.
 */

// Import CSS styles in correct order
import './styles/teletext.css'    // Color palette and typography
import './styles/crt-effects.css' // CRT visual effects
import './styles/main.css'        // Layout and responsive styles

// Import application modules
import { getTeletextScreen } from './js/app.js';
import { getRouter } from './js/router.js';
import { initAudioOnInteraction } from './js/services/soundManager.js';

/**
 * Initialize the Teletext Reborn application
 */
function initApp() {
  const appContainer = document.querySelector('#app');
  
  if (!appContainer) {
    console.error('App container not found');
    return;
  }
  
  // Initialize audio on first user interaction (browser autoplay policy)
  initAudioOnInteraction();
  
  // Initialize the router and keyboard shortcuts
  const router = getRouter();
  router.initKeyboardShortcuts();
  
  // Initialize and render the main screen
  // The screen.render() method now automatically loads the home page
  const screen = getTeletextScreen('app');
  screen.render();
  
  console.log('Teletext Reborn initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
