/**
 * Teletext Reborn - News API Service (Enhanced)
 * 
 * Multi-source news fetching with fallback chain:
 * 1. RSS2JSON (BBC feeds) - Primary, 10,000 requests/day
 * 2. NewsData.io - Secondary fallback
 * 3. Mock data - Final fallback (DEMO MODE)
 * 
 * @module services/newsApi
 * Requirements: 5.1-5.7
 */

import { truncateToWidth } from '../utils/teletext.js';
import { formatRelativeTime } from '../utils/date.js';

// ============================================
// Constants
// ============================================

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';
const NEWSDATA_API = 'https://newsdata.io/api/1/news';
const NEWSDATA_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const DEBUG = import.meta.env.DEV || false;

function debugLog(message, data) {
  if (DEBUG) console.debug(`[NewsAPI] ${message}`, data !== undefined ? data : '');
}

const RSS_FEEDS = {
  top: 'https://feeds.bbci.co.uk/news/rss.xml',
  world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  technology: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
};

export const NEWS_CATEGORIES = {
  top: { page: 101, label: 'TOP STORIES', apiCategory: 'top' },
  world: { page: 102, label: 'WORLD', apiCategory: 'world' },
  technology: { page: 103, label: 'TECH', apiCategory: 'technology' },
  business: { page: 104, label: 'BUSINESS', apiCategory: 'business' },
  sports: { page: 105, label: 'SPORTS', apiCategory: 'sports' },
};

export const PAGE_TO_CATEGORY = {
  101: 'top', 102: 'world', 103: 'technology', 104: 'business', 105: 'sports',
};

const MAX_HEADLINES = 10;
const MAX_HEADLINE_LENGTH = 42;
const CACHE_TTL = 5 * 60 * 1000;

let isDemoMode = false;
let lastError = null;

// ============================================
// Cache Management
// ============================================

function getCacheKey(category) { return `teletext_news_${category}`; }

function getFromCache(category) {
  try {
    const stored = localStorage.getItem(getCacheKey(category));
    if (stored) {
      const entry = JSON.parse(stored);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        debugLog('Cache hit', category);
        return entry.data;
      }
    }
  } catch (e) { debugLog('Cache error', e); }
  return null;
}

function saveToCache(category, data) {
  try {
    localStorage.setItem(getCacheKey(category), JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) { debugLog('Cache save error', e); }
}

function getStaleCache(category) {
  try {
    const stored = localStorage.getItem(getCacheKey(category));
    if (stored) {
      const entry = JSON.parse(stored);
      return { ...entry.data, _stale: true };
    }
  } catch (e) { /* ignore */ }
  return null;
}


// ============================================
// RSS2JSON Fetcher (Primary)
// ============================================

async function fetchFromRSS2JSON(category) {
  const feedUrl = RSS_FEEDS[category];
  if (!feedUrl) throw new Error(`No RSS feed for: ${category}`);
  
  const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(feedUrl)}`;
  debugLog('Fetching RSS2JSON', category);
  
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`RSS2JSON: ${response.status}`);
  
  const data = await response.json();
  if (data.status !== 'ok' || !data.items?.length) throw new Error('No RSS items');
  
  debugLog('RSS2JSON success', { category, count: data.items.length });
  return parseRSSResponse(data, category);
}

function parseRSSResponse(data, category) {
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const articles = (data.items || []).slice(0, MAX_HEADLINES).map(item => {
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    return {
      title: item.title || 'NO TITLE',
      description: item.description || '',
      source: 'BBC',
      pubDate, timeAgo: formatRelativeTime(pubDate),
      link: item.link || null,
      imageUrl: item.thumbnail || item.enclosure?.link || null,
    };
  });
  
  return {
    category, categoryLabel: categoryInfo.label, pageNumber: categoryInfo.page,
    articles, totalResults: articles.length, lastUpdated: new Date(),
    _source: 'BBC via RSS', _stale: false, _demo: false,
  };
}

// ============================================
// NewsData.io Fetcher (Secondary)
// ============================================

async function fetchFromNewsData(category) {
  if (!NEWSDATA_API_KEY) throw new Error('No NewsData API key');
  
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const url = `${NEWSDATA_API}?apikey=${NEWSDATA_API_KEY}&language=en&category=${categoryInfo.apiCategory}`;
  
  debugLog('Fetching NewsData', category);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`NewsData: ${response.status}`);
  
  const data = await response.json();
  if (!data.results?.length) throw new Error('No NewsData results');
  
  debugLog('NewsData success', { category, count: data.results.length });
  return parseNewsDataResponse(data, category);
}

function parseNewsDataResponse(data, category) {
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const articles = (data.results || []).slice(0, MAX_HEADLINES).map(item => {
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    return {
      title: item.title || 'NO TITLE',
      description: item.description || '',
      source: item.source_id || item.source_name || 'NEWS',
      pubDate, timeAgo: formatRelativeTime(pubDate),
      link: item.link || null,
      imageUrl: item.image_url || null,
    };
  });
  
  return {
    category, categoryLabel: categoryInfo.label, pageNumber: categoryInfo.page,
    articles, totalResults: articles.length, lastUpdated: new Date(),
    _source: 'NewsData.io', _stale: false, _demo: false,
  };
}

// ============================================
// Mock Data (Final Fallback)
// ============================================

const MOCK_HEADLINES = {
  top: [
    { title: 'GLOBAL LEADERS MEET FOR CLIMATE SUMMIT', source: 'DEMO', timeAgo: '2H AGO' },
    { title: 'TECH GIANTS ANNOUNCE NEW AI INITIATIVES', source: 'DEMO', timeAgo: '3H AGO' },
    { title: 'MARKETS RALLY ON POSITIVE ECONOMIC DATA', source: 'DEMO', timeAgo: '4H AGO' },
    { title: 'SCIENTISTS MAKE BREAKTHROUGH DISCOVERY', source: 'DEMO', timeAgo: '5H AGO' },
    { title: 'WORLD CUP QUALIFIERS BEGIN THIS WEEK', source: 'DEMO', timeAgo: '6H AGO' },
    { title: 'NEW SPACE MISSION LAUNCHES SUCCESSFULLY', source: 'DEMO', timeAgo: '7H AGO' },
    { title: 'HEALTH EXPERTS ISSUE NEW GUIDELINES', source: 'DEMO', timeAgo: '8H AGO' },
    { title: 'ENTERTAINMENT AWARDS CEREMONY TONIGHT', source: 'DEMO', timeAgo: '9H AGO' },
  ],
  world: [
    { title: 'UN SECURITY COUNCIL HOLDS EMERGENCY MEETING', source: 'DEMO', timeAgo: '1H AGO' },
    { title: 'EUROPEAN UNION ANNOUNCES NEW TRADE DEAL', source: 'DEMO', timeAgo: '2H AGO' },
    { title: 'ASIA PACIFIC LEADERS SUMMIT CONCLUDES', source: 'DEMO', timeAgo: '3H AGO' },
    { title: 'MIDDLE EAST PEACE TALKS RESUME', source: 'DEMO', timeAgo: '4H AGO' },
    { title: 'AFRICAN NATIONS FORM NEW ALLIANCE', source: 'DEMO', timeAgo: '5H AGO' },
    { title: 'LATIN AMERICA ECONOMIC FORUM OPENS', source: 'DEMO', timeAgo: '6H AGO' },
  ],
  technology: [
    { title: 'NEW SMARTPHONE FEATURES REVOLUTIONARY AI', source: 'DEMO', timeAgo: '1H AGO' },
    { title: 'QUANTUM COMPUTING REACHES NEW MILESTONE', source: 'DEMO', timeAgo: '2H AGO' },
    { title: 'CYBERSECURITY EXPERTS WARN OF NEW THREAT', source: 'DEMO', timeAgo: '3H AGO' },
    { title: 'ELECTRIC VEHICLE SALES HIT RECORD HIGH', source: 'DEMO', timeAgo: '4H AGO' },
    { title: 'SOCIAL MEDIA PLATFORM LAUNCHES NEW FEATURE', source: 'DEMO', timeAgo: '5H AGO' },
    { title: 'ROBOTICS COMPANY UNVEILS HUMANOID ROBOT', source: 'DEMO', timeAgo: '6H AGO' },
  ],
  business: [
    { title: 'STOCK MARKETS REACH ALL-TIME HIGHS', source: 'DEMO', timeAgo: '1H AGO' },
    { title: 'CENTRAL BANK ANNOUNCES INTEREST RATE DECISION', source: 'DEMO', timeAgo: '2H AGO' },
    { title: 'MAJOR MERGER CREATES INDUSTRY GIANT', source: 'DEMO', timeAgo: '3H AGO' },
    { title: 'STARTUP RAISES RECORD FUNDING ROUND', source: 'DEMO', timeAgo: '4H AGO' },
    { title: 'OIL PRICES FLUCTUATE ON SUPPLY CONCERNS', source: 'DEMO', timeAgo: '5H AGO' },
    { title: 'RETAIL SALES EXCEED EXPECTATIONS', source: 'DEMO', timeAgo: '6H AGO' },
  ],
  sports: [
    { title: 'CHAMPIONSHIP FINAL SET FOR WEEKEND', source: 'DEMO', timeAgo: '1H AGO' },
    { title: 'STAR PLAYER SIGNS RECORD CONTRACT', source: 'DEMO', timeAgo: '2H AGO' },
    { title: 'OLYMPIC COMMITTEE ANNOUNCES HOST CITY', source: 'DEMO', timeAgo: '3H AGO' },
    { title: 'TENNIS GRAND SLAM ENTERS FINAL STAGES', source: 'DEMO', timeAgo: '4H AGO' },
    { title: 'FOOTBALL LEAGUE STANDINGS UPDATE', source: 'DEMO', timeAgo: '5H AGO' },
    { title: 'MOTORSPORT SEASON FINALE APPROACHES', source: 'DEMO', timeAgo: '6H AGO' },
  ],
};

function getMockData(category) {
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const headlines = MOCK_HEADLINES[category] || MOCK_HEADLINES.top;
  const articles = headlines.map(h => ({
    title: h.title, description: '', source: h.source,
    pubDate: new Date(), timeAgo: h.timeAgo, link: null, imageUrl: null,
  }));
  
  return {
    category, categoryLabel: categoryInfo.label, pageNumber: categoryInfo.page,
    articles, totalResults: articles.length, lastUpdated: new Date(),
    _source: 'DEMO MODE', _stale: false, _demo: true,
  };
}


// ============================================
// Main API Functions
// ============================================

/**
 * Fetch news with fallback chain: RSS2JSON -> NewsData -> Mock
 */
export async function getNews(category = 'top') {
  const validCategory = NEWS_CATEGORIES[category] ? category : 'top';
  
  // Check cache first
  const cached = getFromCache(validCategory);
  if (cached) {
    isDemoMode = cached._demo || false;
    return cached;
  }
  
  // Try RSS2JSON (Primary - BBC feeds)
  try {
    const data = await fetchFromRSS2JSON(validCategory);
    saveToCache(validCategory, data);
    isDemoMode = false;
    lastError = null;
    return data;
  } catch (rssError) {
    debugLog('RSS2JSON failed', rssError.message);
    lastError = rssError.message;
  }
  
  // Try NewsData.io (Secondary)
  try {
    const data = await fetchFromNewsData(validCategory);
    saveToCache(validCategory, data);
    isDemoMode = false;
    lastError = null;
    return data;
  } catch (newsDataError) {
    debugLog('NewsData failed', newsDataError.message);
    lastError = newsDataError.message;
  }
  
  // Try stale cache
  const staleData = getStaleCache(validCategory);
  if (staleData) return staleData;
  
  // Final fallback: Mock data
  debugLog('Using DEMO MODE');
  isDemoMode = true;
  const mockData = getMockData(validCategory);
  saveToCache(validCategory, mockData);
  return mockData;
}

export async function getNewsByPage(pageNumber) {
  const category = PAGE_TO_CATEGORY[pageNumber];
  return category ? getNews(category) : getMockData('top');
}

export function isInDemoMode() { return isDemoMode; }
export function getLastError() { return lastError; }

export function formatHeadline(article) {
  // Strip HTML tags from description
  const cleanDesc = (article.description || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  
  return {
    title: truncateToWidth(article.title, MAX_HEADLINE_LENGTH),
    description: cleanDesc ? truncateToWidth(cleanDesc, 80) : '',
    source: truncateToWidth((article.source || 'NEWS').toUpperCase(), 12),
    timeAgo: article.timeAgo || '',
    fullTitle: article.title,
    link: article.link,
  };
}

export function formatHeadlines(articles) {
  return Array.isArray(articles) ? articles.map(formatHeadline) : [];
}

export function getNewsCategories() {
  return Object.entries(NEWS_CATEGORIES).map(([key, value]) => ({ id: key, ...value }));
}

export function isNewsPage(pageNumber) { return pageNumber >= 101 && pageNumber <= 109; }

export function getCategoryForPage(pageNumber) {
  const category = PAGE_TO_CATEGORY[pageNumber];
  return category ? { id: category, ...NEWS_CATEGORIES[category] } : null;
}

export function clearNewsCache(category) {
  try {
    if (category) {
      localStorage.removeItem(getCacheKey(category));
    } else {
      Object.keys(NEWS_CATEGORIES).forEach(cat => localStorage.removeItem(getCacheKey(cat)));
    }
  } catch (e) { /* ignore */ }
}

export function hasValidCache(category) { return getFromCache(category) !== null; }

// ============================================
// Auto-Refresh
// ============================================

let autoRefreshInterval = null;
const refreshCallbacks = new Set();

export function startAutoRefresh(onRefresh) {
  if (onRefresh) refreshCallbacks.add(onRefresh);
  
  if (!autoRefreshInterval) {
    debugLog('Starting auto-refresh');
    autoRefreshInterval = setInterval(async () => {
      for (const category of Object.keys(NEWS_CATEGORIES)) {
        try {
          const data = await getNews(category);
          refreshCallbacks.forEach(cb => { try { cb(category, data); } catch (e) { /* ignore */ } });
        } catch (e) { debugLog('Auto-refresh error', e); }
      }
    }, CACHE_TTL);
  }
  
  return () => {
    if (onRefresh) refreshCallbacks.delete(onRefresh);
    if (refreshCallbacks.size === 0 && autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  };
}

export function stopAutoRefresh() {
  if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
  refreshCallbacks.clear();
}

// ============================================
// Exports for Testing
// ============================================

export function getMockNews(category = 'top') { return getMockData(category); }
export function canMakeRequest() { return true; }
export function getRemainingRequests() { return 9999; }
export { CACHE_TTL, MAX_HEADLINES, MAX_HEADLINE_LENGTH };
