# GSAP Animation Guide - Teletext Reborn

> **VERIFIED**: All syntax in this document is GSAP 3.x compliant.
> - Ease syntax: lowercase (e.g., `power2.out` not `Power2.easeOut`)
> - Plugin registration required for TextPlugin
> - All animation properties are GPU-accelerated (transforms, opacity, filter)

---

## Setup & Installation

```javascript
// Install
npm install gsap

// Import in main.js
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

// Register plugins ONCE at app start
gsap.registerPlugin(TextPlugin);
```

## Core Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `gsap.to()` | Animate TO values | `gsap.to(el, { opacity: 1 })` |
| `gsap.from()` | Animate FROM values | `gsap.from(el, { opacity: 0 })` |
| `gsap.fromTo()` | Animate FROM and TO | `gsap.fromTo(el, { opacity: 0 }, { opacity: 1 })` |
| `gsap.set()` | Set immediately (no animation) | `gsap.set(el, { opacity: 0 })` |
| `gsap.timeline()` | Sequence animations | `const tl = gsap.timeline()` |

## Easing Reference (Project-Specific)

| Ease | Use Case | Feel |
|------|----------|------|
| `power1.out` | Button hover | Snappy, responsive |
| `power2.out` | Menu stagger | Smooth deceleration |
| `power2.inOut` | Page transitions | Professional, balanced |
| `power4.out` | Boot sequence | Dramatic reveal |
| `expo.in` | Time travel blur start | Cinematic acceleration |
| `expo.out` | Time travel blur end | Cinematic deceleration |
| `elastic.out(1, 0.5)` | Error shake | Attention-grabbing bounce |
| `steps(1)` | Cursor blink | Discrete on/off |
| `steps(30)` | Year counter | Discrete number changes |
| `none` | Typewriter text | Linear, character-by-character |

---

## Animation Implementations


### 1. Boot Sequence (3 seconds max)

```javascript
function createBootTimeline(onComplete) {
  const tl = gsap.timeline({ onComplete });
  
  // Phase 1: Black screen (0-0.2s)
  tl.set('.screen', { opacity: 0 })
    .set('.crt-line', { scaleY: 0 })
    .to('.screen', { opacity: 1, duration: 0.2 });
  
  // Phase 2: CRT warm-up line (0.2-0.7s)
  tl.to('.crt-line', {
    scaleY: 1,
    duration: 0.5,
    ease: 'power4.out'
  });
  
  // Phase 3: Static noise (0.7-1.2s)
  tl.to('.static-overlay', { opacity: 1, duration: 0.1 })
    .to('.static-overlay', { opacity: 0, duration: 0.4, ease: 'power2.out' });
  
  // Phase 4: Typewriter title (1.2-2.5s)
  tl.to('.boot-title', {
    text: 'TELETEXT REBORN',
    duration: 1.3,
    ease: 'none'
  });
  
  // Phase 5: Subtitle fade (2.5-3.0s)
  tl.from('.boot-subtitle', {
    opacity: 0,
    duration: 0.5,
    ease: 'power1.inOut'
  });
  
  return tl;
}
```

### 2. Page Transitions (0.3-0.4s)

```javascript
function createPageTransition(direction = 'fade') {
  const tl = gsap.timeline();
  const yOffset = direction === 'up' ? -20 : 20;
  
  // Exit current page
  tl.to('.content-area', {
    opacity: 0,
    y: yOffset,
    duration: 0.15,
    ease: 'power2.in'
  });
  
  // Brief static flash
  tl.to('.static-overlay', { opacity: 0.5, duration: 0.025 })
    .to('.static-overlay', { opacity: 0, duration: 0.025 });
  
  // Enter new page
  tl.from('.content-area', {
    opacity: 0,
    y: -yOffset,
    duration: 0.2,
    ease: 'power2.out'
  });
  
  // Stagger content lines
  tl.from('.content-line', {
    opacity: 0,
    duration: 0.1,
    stagger: 0.03,
    ease: 'power1.out'
  }, '-=0.1');
  
  return tl;
}
```

### 3. Time Travel Animation (2.5s)

```javascript
function createTimeTravelTimeline(targetYear, onComplete) {
  const tl = gsap.timeline({ onComplete });
  
  // Phase 1: Blur and brighten (0-0.3s)
  tl.to('.screen', {
    filter: 'blur(10px) brightness(1.5)',
    duration: 0.3,
    ease: 'expo.in'
  });
  
  // Phase 2: White flash + shake (0.3-0.5s)
  tl.to('.flash-overlay', { opacity: 1, duration: 0.1, ease: 'power4.in' })
    .to('.flash-overlay', { opacity: 0, duration: 0.1, ease: 'power4.out' });
  
  tl.to('.screen', {
    x: '+=3',
    duration: 0.05,
    repeat: 3,
    yoyo: true,
    ease: 'none'
  }, '-=0.2');
  
  // Phase 3: Year counter (0.5-2.0s)
  tl.set('.year-counter', { innerText: new Date().getFullYear() })
    .to('.year-counter', {
      innerText: targetYear,
      duration: 1.5,
      ease: 'steps(30)',
      snap: { innerText: 1 },
      modifiers: {
        innerText: (value) => Math.round(value)
      }
    });
  
  // Typewriter "TRAVELING TO..."
  tl.to('.travel-text', {
    text: `TRAVELING TO ${targetYear}...`,
    duration: 0.8,
    ease: 'none'
  }, 0.5);
  
  // Phase 4: Unblur and reveal (2.0-2.5s)
  tl.to('.screen', {
    filter: 'blur(0px) brightness(1)',
    duration: 0.3,
    ease: 'expo.out'
  });
  
  tl.from('.historical-content', {
    opacity: 0,
    y: 10,
    duration: 0.2,
    stagger: 0.05,
    ease: 'power2.out'
  });
  
  return tl;
}
```


### 4. Micro-Interactions

```javascript
// Button hover effect
// NOTE: Use CSS classes for boxShadow with currentColor, or pass color as parameter
function onButtonHover(element, glowColor = '#FFFF00') {
  gsap.to(element, {
    filter: 'brightness(1.2)',
    boxShadow: `0 0 8px ${glowColor}`,
    duration: 0.15,
    ease: 'power1.out'
  });
}

function onButtonHoverOut(element) {
  gsap.to(element, {
    filter: 'brightness(1)',
    boxShadow: '0 0 0px transparent',
    duration: 0.15,
    ease: 'power1.out'
  });
}

// Button click effect
function onButtonClick(element) {
  gsap.to(element, {
    scale: 0.95,
    duration: 0.1,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1
  });
}

// Error shake animation
function shakeError(element) {
  gsap.to(element, {
    x: '+=3',
    duration: 0.1,
    repeat: 5,
    yoyo: true,
    ease: 'elastic.out(1, 0.5)'
  });
}

// Success flash
function flashSuccess(element) {
  gsap.to(element, {
    borderColor: '#00FF00',
    duration: 0.15,
    repeat: 1,
    yoyo: true,
    ease: 'power1.inOut'
  });
}

// Blinking cursor
function createCursorBlink(cursorElement) {
  return gsap.to(cursorElement, {
    opacity: 0,
    duration: 0.53,
    repeat: -1,
    yoyo: true,
    ease: 'steps(1)'
  });
}

// Menu item stagger
function staggerMenuItems(items) {
  gsap.from(items, {
    opacity: 0,
    x: -10,
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out'
  });
}

// Loading dots animation
function animateLoadingDots(element) {
  const tl = gsap.timeline({ repeat: -1 });
  tl.to(element, { text: 'LOADING.', duration: 0.5, ease: 'none' })
    .to(element, { text: 'LOADING..', duration: 0.5, ease: 'none' })
    .to(element, { text: 'LOADING...', duration: 0.5, ease: 'none' });
  return tl;
}
```

---

## Timeline Position Parameters

```javascript
const tl = gsap.timeline();

// Sequential (default)
tl.to(a, { x: 100 })
  .to(b, { x: 100 });  // Starts after 'a' completes

// Overlap with previous
tl.to(a, { x: 100 })
  .to(b, { x: 100 }, '-=0.2');  // Starts 0.2s before 'a' ends

// Start at same time as previous
tl.to(a, { x: 100 })
  .to(b, { x: 100 }, '<');  // Starts when 'a' starts

// Absolute position
tl.to(a, { x: 100 })
  .to(b, { x: 100 }, 1.5);  // Starts at 1.5s from timeline start

// Labels
tl.add('phase2', 1)
  .to(a, { x: 100 }, 'phase2')
  .to(b, { x: 100 }, 'phase2+=0.2');
```

---

## Performance Rules (CRITICAL)

### DO Animate (GPU-accelerated)
```javascript
// These use CSS transforms - FAST
gsap.to(el, { x: 100 });        // translateX
gsap.to(el, { y: 100 });        // translateY
gsap.to(el, { scale: 1.2 });    // scale
gsap.to(el, { rotation: 45 });  // rotate
gsap.to(el, { opacity: 0.5 });  // opacity
gsap.to(el, { filter: 'blur(5px)' }); // filter
```

### DON'T Animate (Causes reflow - SLOW)
```javascript
// NEVER animate these - causes layout thrashing
gsap.to(el, { width: 100 });    // BAD
gsap.to(el, { height: 100 });   // BAD
gsap.to(el, { top: 100 });      // BAD
gsap.to(el, { left: 100 });     // BAD
gsap.to(el, { margin: 10 });    // BAD
gsap.to(el, { padding: 10 });   // BAD
```


---

## Cleanup & Memory Management

```javascript
// Store references for cleanup
let bootTimeline = null;
let cursorTween = null;

function startBoot() {
  bootTimeline = createBootTimeline();
}

function cleanup() {
  // Kill specific tweens
  if (bootTimeline) {
    bootTimeline.kill();
    bootTimeline = null;
  }
  
  if (cursorTween) {
    cursorTween.kill();
    cursorTween = null;
  }
  
  // Kill all tweens on an element
  gsap.killTweensOf('.content-area');
  
  // Kill all tweens (nuclear option)
  gsap.killTweensOf('*');
}

// Call cleanup on page navigation
function onPageUnmount() {
  cleanup();
}
```

---

## Common Mistakes to Avoid

### 1. Wrong Ease Syntax
```javascript
// WRONG - old syntax
gsap.to(el, { ease: 'Power2.easeOut' });

// CORRECT - GSAP 3 syntax
gsap.to(el, { ease: 'power2.out' });
```

### 2. Forgetting to Register Plugins
```javascript
// WRONG - TextPlugin won't work
import { TextPlugin } from 'gsap/TextPlugin';
gsap.to(el, { text: 'Hello' }); // FAILS

// CORRECT - Register first
import { TextPlugin } from 'gsap/TextPlugin';
gsap.registerPlugin(TextPlugin);
gsap.to(el, { text: 'Hello' }); // WORKS
```

### 3. Not Killing Animations
```javascript
// WRONG - Memory leak, conflicting animations
function animate() {
  gsap.to(el, { x: 100 });
}
animate(); // Called multiple times = multiple tweens!

// CORRECT - Kill existing first
function animate() {
  gsap.killTweensOf(el);
  gsap.to(el, { x: 100 });
}

// OR use overwrite
function animate() {
  gsap.to(el, { x: 100, overwrite: 'auto' });
}
```

### 4. Animating Wrong Properties
```javascript
// WRONG - Causes layout thrashing
gsap.to(el, { left: '100px' });

// CORRECT - Use transforms
gsap.to(el, { x: 100 });
```

---

## Debugging Tips

```javascript
// Slow down all animations
gsap.globalTimeline.timeScale(0.1);

// Speed up for testing
gsap.globalTimeline.timeScale(2);

// Pause all animations
gsap.globalTimeline.pause();

// Resume
gsap.globalTimeline.resume();

// Log animation progress
const tl = gsap.timeline({
  onStart: () => console.log('Timeline started'),
  onComplete: () => console.log('Timeline complete'),
  onUpdate: () => console.log('Progress:', tl.progress())
});
```

---

## Quick Reference Card

| Animation | Duration | Ease | Method |
|-----------|----------|------|--------|
| Boot CRT line | 0.5s | power4.out | to() |
| Boot typewriter | 1.3s | none | to() + TextPlugin |
| Page exit | 0.15s | power2.in | to() |
| Page enter | 0.2s | power2.out | from() |
| Content stagger | 0.1s + 0.03s/item | power1.out | from() + stagger |
| Time travel blur | 0.3s | expo.in/out | to() |
| Year counter | 1.5s | steps(30) | to() + snap |
| Button hover | 0.15s | power1.out | to() |
| Button click | 0.1s | power2.out | to() + yoyo |
| Error shake | 0.3s total | elastic.out | to() + repeat |
| Cursor blink | 0.53s | steps(1) | to() + repeat:-1 |
| Menu stagger | 0.3s + 0.05s/item | power2.out | from() + stagger |

---

## Checklist Before Committing Animation Code

- [ ] Correct ease syntax (lowercase, e.g., 'power2.out')
- [ ] TextPlugin registered if using text animations
- [ ] Only animating transform/opacity/filter properties
- [ ] Timeline stored for cleanup
- [ ] Cleanup called on unmount
- [ ] Duration matches spec exactly
- [ ] Tested at normal speed (timeScale 1)
- [ ] No console errors
- [ ] 60fps performance verified

---

## GSAP 3 Syntax Verification Reference

### Confirmed Working Syntax:
```javascript
// Easing - ALL LOWERCASE in GSAP 3
ease: 'power1.out'      // ✓ Correct
ease: 'power2.inOut'    // ✓ Correct
ease: 'expo.in'         // ✓ Correct
ease: 'elastic.out(1, 0.5)'  // ✓ Correct with parameters
ease: 'steps(30)'       // ✓ Correct for stepped
ease: 'none'            // ✓ Correct for linear

// WRONG - Old GSAP 2 syntax (DO NOT USE)
ease: 'Power2.easeOut'  // ✗ WRONG
ease: Power2.easeOut    // ✗ WRONG
ease: 'Linear.easeNone' // ✗ WRONG

// Timeline position parameters
.to(el, {}, '<')        // ✓ Start of previous
.to(el, {}, '>')        // ✓ End of previous (default)
.to(el, {}, '-=0.2')    // ✓ 0.2s before previous ends
.to(el, {}, '+=0.2')    // ✓ 0.2s after previous ends
.to(el, {}, 1.5)        // ✓ Absolute 1.5s from start

// Stagger
stagger: 0.05           // ✓ Simple
stagger: { each: 0.05, from: 'start' }  // ✓ Advanced

// Repeat
repeat: -1              // ✓ Infinite
repeat: 3               // ✓ 3 additional times (4 total)
yoyo: true              // ✓ Reverse on repeat

// Snap (for number animations)
snap: { innerText: 1 }  // ✓ Round to nearest 1
snap: 'innerText'       // ✓ Shorthand for snap to 1
```

### TextPlugin Specifics:
```javascript
// MUST register before use
import { TextPlugin } from 'gsap/TextPlugin';
gsap.registerPlugin(TextPlugin);

// Basic usage
gsap.to(el, { text: 'Hello World', duration: 1 });

// Character by character (default)
gsap.to(el, { text: { value: 'Hello', delimiter: '' }, duration: 1 });

// Word by word
gsap.to(el, { text: { value: 'Hello World', delimiter: ' ' }, duration: 1 });
```

### Filter Animation:
```javascript
// Single filter
gsap.to(el, { filter: 'blur(10px)' });

// Multiple filters
gsap.to(el, { filter: 'blur(10px) brightness(1.5)' });

// Back to normal
gsap.to(el, { filter: 'blur(0px) brightness(1)' });
// OR
gsap.to(el, { filter: 'none' });
```
