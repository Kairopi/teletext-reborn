/**
 * Teletext Reborn - Sound Manager
 * 
 * Minimal, tasteful sound effects using Web Audio API.
 * All sounds are synthesized (no external files needed).
 * Sounds are optional and can be toggled in settings.
 * 
 * @module services/soundManager
 */

import { getStateManager } from '../state.js';

// ============================================
// Audio Context
// ============================================

let audioContext = null;

/**
 * Get or create the audio context
 * @returns {AudioContext|null}
 */
function getAudioContext() {
  if (!audioContext && typeof AudioContext !== 'undefined') {
    try {
      audioContext = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  return audioContext;
}

/**
 * Check if sound is enabled in settings
 * @returns {boolean}
 */
function isSoundEnabled() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  return settings.sound !== false;
}

// ============================================
// Sound Effects (Synthesized)
// ============================================

/**
 * Play a subtle click sound (for button presses)
 */
export function playClick() {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
  
  gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
}

/**
 * Play a brief static burst (for page transitions)
 */
export function playStatic() {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  // Create white noise
  const bufferSize = ctx.sampleRate * 0.05; // 50ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  source.start(ctx.currentTime);
}

/**
 * Play a success sound (for saves, confirmations)
 */
export function playSuccess() {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
  oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
  
  gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

/**
 * Play an error sound (for errors)
 */
export function playError() {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

/**
 * Play time travel whoosh sound
 */
export function playTimeTravel() {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  // Sweeping oscillator
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(100, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.5);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
  
  gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
  gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.5);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 1);
}

// ============================================
// Cleanup
// ============================================

/**
 * Close the audio context (for cleanup)
 */
export function closeAudio() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

/**
 * Initialize audio on first user interaction
 * (Required by browser autoplay policies)
 */
export function initAudioOnInteraction() {
  const handler = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    document.removeEventListener('click', handler);
    document.removeEventListener('keydown', handler);
  };
  
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('keydown', handler, { once: true });
}
