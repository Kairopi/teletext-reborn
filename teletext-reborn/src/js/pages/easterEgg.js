/**
 * Teletext Reborn - Easter Egg Page (Page 888)
 * 
 * Displays fun facts about Teletext history
 * Requirement 18.1: Page 888 displays Teletext facts
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';

// Teletext Fun Facts
const TELETEXT_FACTS = [
  { title: 'THE BIRTH OF TELETEXT', fact: 'Teletext was invented by the BBC in 1974. The first service was called CEEFAX (See Facts).', year: '1974' },
  { title: 'WORLD FIRST', fact: 'The UK was the first country in the world to have a public Teletext service.', year: '1974' },
  { title: 'THE 8 COLORS', fact: 'Teletext could only display 8 colors: Black, Red, Green, Yellow, Blue, Magenta, Cyan, and White.', year: 'TECH' },
  { title: '40 CHARACTERS', fact: 'Each line could only show 40 characters. This is why headlines were always short!', year: 'TECH' },
  { title: 'PAGE 100', fact: 'Page 100 was always the index page. Page numbers went from 100 to 899.', year: 'TECH' },
  { title: 'FASTEXT BUTTONS', fact: 'The colored buttons (Red, Green, Yellow, Cyan) were added in 1983 for faster navigation.', year: '1983' },
  { title: 'BAMBOOZLE!', fact: 'The quiz game Bamboozle! on Channel 4 Teletext was incredibly popular in the 90s.', year: '1990s' },
  { title: 'FOOTBALL SCORES', fact: 'Checking football scores on Teletext was a Saturday ritual for millions of fans.', year: 'CULTURE' },
  { title: 'TELETEXT HOLIDAYS', fact: 'Teletext Holidays became one of the biggest travel agencies in the UK!', year: '1990s' },
  { title: 'THE END', fact: 'Teletext was switched off on October 23, 2012 when the UK completed digital switchover.', year: '2012' },
  { title: 'HIDDEN PAGES', fact: 'Page 888 was traditionally used for subtitles. You found our secret page!', year: 'SECRET' },
  { title: 'DIGITISER', fact: 'Digitiser on Channel 4 Teletext was a legendary video game magazine with bizarre humor.', year: '1993' },
];

let currentFactIndex = 0;
let factRotationInterval = null;

function wrapText(text) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    if ((currentLine + ' ' + word).trim().length <= 38) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.map(line => `<div class="content-line">${line}</div>`).join('');
}

export function render() {
  const fact = TELETEXT_FACTS[currentFactIndex];
  return `
    <div class="teletext-page easter-egg-page">
      <div class="teletext-page-title phosphor-glow" style="color: #FF00FF;">
        🥚 SECRET PAGE 888 🥚
      </div>
      <div class="teletext-page-subtitle" style="color: #00FFFF; text-align: center; margin: 8px 0;">
        TELETEXT FUN FACTS
      </div>
      <div class="separator-double" style="color: #FF00FF;">════════════════════════════════════════</div>
      <div class="fact-container" id="fact-container" style="padding: 16px 0;">
        <div class="fact-year" style="color: #00FF00; margin-bottom: 8px;">[ ${fact.year} ]</div>
        <div class="fact-title" style="color: #FFFF00; margin-bottom: 12px; font-size: 12px;">${fact.title}</div>
        <div class="fact-text" style="color: #FFFFFF; line-height: 1.6;">${wrapText(fact.fact)}</div>
      </div>
      <div class="separator-light" style="color: #00FFFF;">────────────────────────────────────────</div>
      <div class="fact-counter" style="color: #FF00FF; text-align: center; margin: 8px 0;">FACT ${currentFactIndex + 1} OF ${TELETEXT_FACTS.length}</div>
      <div style="color: #FFFFFF; opacity: 0.7; text-align: center; margin-top: 16px; font-size: 10px;">TIP: TYPE "BURST" FOR A SURPRISE!</div>
      <div style="color: #00FFFF; opacity: 0.7; text-align: center; font-size: 10px;">🌈 COLOR BURST MODE 🌈</div>
    </div>
  `;
}

function rotateFact() {
  currentFactIndex = (currentFactIndex + 1) % TELETEXT_FACTS.length;
  const container = document.getElementById('fact-container');
  if (container) {
    const fact = TELETEXT_FACTS[currentFactIndex];
    gsap.to(container, {
      opacity: 0, duration: 0.2, ease: 'power1.in',
      onComplete: () => {
        container.innerHTML = `
          <div class="fact-year" style="color: #00FF00; margin-bottom: 8px;">[ ${fact.year} ]</div>
          <div class="fact-title" style="color: #FFFF00; margin-bottom: 12px; font-size: 12px;">${fact.title}</div>
          <div class="fact-text" style="color: #FFFFFF; line-height: 1.6;">${wrapText(fact.fact)}</div>
        `;
        const counter = document.querySelector('.fact-counter');
        if (counter) counter.textContent = `FACT ${currentFactIndex + 1} OF ${TELETEXT_FACTS.length}`;
        gsap.to(container, { opacity: 1, duration: 0.3, ease: 'power1.out' });
      }
    });
  }
}

export function onMount() {
  factRotationInterval = setInterval(rotateFact, 5000);
  gsap.from('.fact-container', { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' });
}

export function onUnmount() {
  if (factRotationInterval) { clearInterval(factRotationInterval); factRotationInterval = null; }
}

export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
    cyan: { label: 'ABOUT', page: PAGE_NUMBERS.ABOUT },
  };
}

export function resetState() { currentFactIndex = 0; }
