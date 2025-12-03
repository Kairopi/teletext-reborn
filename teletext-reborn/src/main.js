/**
 * Teletext Reborn - Main Entry Point
 * 
 * This is the application entry point that initializes the Teletext experience.
 */

// Import CSS styles in correct order
import './styles/teletext.css'    // Color palette and typography
import './styles/crt-effects.css' // CRT visual effects
import './styles/main.css'        // Layout and responsive styles

// Application will be initialized here
// TODO: Import and initialize app.js when implemented

/**
 * Initialize the Teletext Reborn application
 */
function initApp() {
  const app = document.querySelector('#app');
  
  if (!app) {
    console.error('App container not found');
    return;
  }
  
  // Render initial screen structure for CSS testing
  app.innerHTML = `
    <div class="teletext-app">
      <div class="tv-bezel">
        <div class="teletext-screen crt-container">
          <!-- CRT Effects Overlays -->
          <div class="scanlines"></div>
          <div class="vignette"></div>
          <div class="glass-reflection"></div>
          <div class="noise-overlay"></div>
          <div class="static-overlay"></div>
          <div class="flash-overlay"></div>
          
          <!-- Header Bar -->
          <header class="header-bar" role="banner" aria-label="Teletext header">
            <span class="header-service-name phosphor-glow">TELETEXT</span>
            <span class="header-page-number phosphor-glow">P.100</span>
            <span class="header-clock phosphor-glow" id="clock">00:00:00</span>
          </header>
          
          <!-- Content Area -->
          <main class="content-area" role="main" aria-label="Main content" data-page="100">
            <div class="content-grid">
              <div class="content-line double-height text-center">★ TELETEXT REBORN ★</div>
              <div class="content-line">&nbsp;</div>
              <div class="content-line section-header">Welcome</div>
              <div class="content-line separator-heavy"></div>
              <div class="content-line">&nbsp;</div>
              <div class="content-line body-text">Your retro information service</div>
              <div class="content-line body-text">is loading...</div>
              <div class="content-line">&nbsp;</div>
              <div class="content-line">
                <span class="loading-text">LOADING</span>
                <span class="loading-cursor">█</span>
              </div>
              <div class="content-line">&nbsp;</div>
              <div class="content-line caption">Press ? for keyboard shortcuts</div>
            </div>
          </main>
          
          <!-- Navigation Bar -->
          <nav class="navigation-bar" role="navigation" aria-label="Page navigation">
            <!-- Fastext Buttons -->
            <div class="fastext-bar">
              <button class="fastext-button fastext-button--red" aria-label="Navigate to News">NEWS</button>
              <button class="fastext-button fastext-button--green" aria-label="Navigate to Weather">WEATHER</button>
              <button class="fastext-button fastext-button--yellow" aria-label="Navigate to Finance">FINANCE</button>
              <button class="fastext-button fastext-button--cyan" aria-label="Navigate to Time Machine">TIME</button>
            </div>
            
            <!-- Page Navigation -->
            <div class="page-nav-bar">
              <button class="nav-arrow" aria-label="Previous page">◄ PREV</button>
              <input 
                type="text" 
                class="page-input" 
                maxlength="3" 
                placeholder="___" 
                aria-label="Enter page number"
                inputmode="numeric"
                pattern="[0-9]*"
              >
              <button class="nav-arrow" aria-label="Next page">NEXT ►</button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  `;
  
  // Start the clock
  startClock();
  
  console.log('Teletext Reborn initialized');
}

/**
 * Update the header clock every second
 */
function startClock() {
  const clockElement = document.getElementById('clock');
  
  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    if (clockElement) {
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
  }
  
  // Update immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
