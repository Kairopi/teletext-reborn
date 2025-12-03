# API Integration & Error Handling Patterns

## API Overview

| API | Endpoint | Purpose | Cache TTL | Rate Limit |
|-----|----------|---------|-----------|------------|
| Open-Meteo | api.open-meteo.com | Current weather | 15 min | Unlimited |
| Open-Meteo Archive | archive-api.open-meteo.com | Historical weather | 24 hours | Unlimited |
| Wikipedia | api.wikimedia.org | On This Day events | 24 hours | Unlimited |
| NewsData.io | newsdata.io | News headlines | 5 min | 200/day |
| CoinGecko | api.coingecko.com | Crypto prices | 1 min | 50/min |
| IP-API | ip-api.com | Geolocation | Session | 45/min |

---

## Fetch Wrapper Pattern

```javascript
// ALWAYS use this pattern for API calls
async function fetchWithRetry(url, options = {}, retries = 3) {
  const cacheKey = `api_${url}`;
  const cached = getCache(cacheKey);
  
  if (cached && !isExpired(cached)) {
    return cached.data;
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setCache(cacheKey, data, getTTL(url));
      return data;
      
    } catch (error) {
      if (attempt === retries) {
        // Return cached data if available, even if stale
        if (cached) {
          return { ...cached.data, _stale: true };
        }
        throw error;
      }
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## Caching Strategy

### Cache Structure
```javascript
{
  key: "api_weather_london",
  data: { /* API response */ },
  timestamp: 1701619200000,
  ttl: 900000, // 15 minutes in ms
  _stale: false
}
```

### Cache Operations
```javascript
// Save to cache
function setCache(key, data, ttl) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl
    }));
  } catch (e) {
    // localStorage full - clear old entries
    clearOldCache();
  }
}

// Get from cache
function getCache(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

// Check expiration
function isExpired(cached) {
  return Date.now() - cached.timestamp > cached.ttl;
}
```

---

## Error Handling Patterns

### Error Types
```javascript
const ErrorTypes = {
  NETWORK: 'network',      // No connection
  TIMEOUT: 'timeout',      // Request timed out
  RATE_LIMIT: 'rate_limit', // API rate limited
  NOT_FOUND: 'not_found',  // 404 response
  SERVER: 'server',        // 5xx response
  PARSE: 'parse',          // JSON parse error
  VALIDATION: 'validation' // Invalid input
};
```

### Error Messages (Teletext Style)
```javascript
const ErrorMessages = {
  network: {
    title: 'CONNECTION LOST',
    message: 'Please check your internet connection',
    action: 'RETRY'
  },
  timeout: {
    title: 'SERVICE SLOW',
    message: 'The service is taking too long',
    action: 'RETRY'
  },
  rate_limit: {
    title: 'SERVICE BUSY',
    message: 'Using cached data - please wait',
    action: 'WAIT'
  },
  not_found: {
    title: 'PAGE NOT FOUND',
    message: 'This page does not exist',
    action: 'HOME'
  },
  server: {
    title: 'SERVICE ERROR',
    message: 'Something went wrong',
    action: 'RETRY'
  },
  parse: {
    title: 'DATA ERROR',
    message: 'Could not read the data',
    action: 'RETRY'
  },
  validation: {
    title: 'INVALID INPUT',
    message: 'Please check your entry',
    action: 'FIX'
  }
};
```

### Error Display Component
```javascript
function showError(type, customMessage = null) {
  const error = ErrorMessages[type];
  
  return `
    <div class="error-container">
      <div class="error-icon">⚠</div>
      <div class="error-title double-height">${error.title}</div>
      <div class="error-message">${customMessage || error.message}</div>
      <div class="error-actions">
        ${error.action === 'RETRY' ? '<button class="fastext-button--red">RETRY</button>' : ''}
        <button class="fastext-button--cyan">HOME</button>
      </div>
    </div>
  `;
}
```

---

## API-Specific Patterns

### Weather API
```javascript
async function getWeather(lat, lon) {
  const data = await fetchWithRetry(
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}&` +
    `current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&` +
    `daily=temperature_2m_max,temperature_2m_min,weather_code&` +
    `forecast_days=5&timezone=auto`
  );
  
  return {
    current: {
      temperature: data.current.temperature_2m,
      condition: weatherCodeToText(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m
    },
    forecast: data.daily.time.map((date, i) => ({
      date,
      high: data.daily.temperature_2m_max[i],
      low: data.daily.temperature_2m_min[i],
      condition: weatherCodeToText(data.daily.weather_code[i])
    })),
    _stale: data._stale
  };
}
```

### Historical Weather API
```javascript
async function getHistoricalWeather(lat, lon, date) {
  // Check if date is valid (after 1940)
  if (date < new Date('1940-01-01')) {
    return {
      error: true,
      message: 'Historical data only available from 1940'
    };
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const data = await fetchWithRetry(
    `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${lat}&longitude=${lon}&` +
    `start_date=${dateStr}&end_date=${dateStr}&` +
    `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code`
  );
  
  return {
    date: dateStr,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    precipitation: data.daily.precipitation_sum[0],
    condition: weatherCodeToText(data.daily.weather_code[0]),
    _stale: data._stale
  };
}
```

### Wikipedia On This Day API
```javascript
async function getOnThisDay(month, day) {
  const data = await fetchWithRetry(
    `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`
  );
  
  return {
    events: (data.events || []).slice(0, 10).map(e => ({
      year: e.year,
      description: truncateText(e.text, 80)
    })),
    births: (data.births || []).slice(0, 5).map(b => ({
      year: b.year,
      description: truncateText(b.text, 80)
    })),
    deaths: (data.deaths || []).slice(0, 3).map(d => ({
      year: d.year,
      description: truncateText(d.text, 80)
    })),
    _stale: data._stale
  };
}
```

---

## Offline Support

### Detection
```javascript
function isOnline() {
  return navigator.onLine;
}

// Listen for changes
window.addEventListener('online', () => {
  hideOfflineBadge();
  refreshCurrentPage();
});

window.addEventListener('offline', () => {
  showOfflineBadge();
});
```

### Offline Behavior
1. Show "⚡ OFFLINE" badge in header (yellow)
2. Display cached content with stale indicator
3. Disable features requiring live data
4. Show "Last updated: X min ago" timestamp
5. Auto-refresh when connection restored

---

## Rate Limit Handling

### NewsData.io (200/day)
```javascript
let newsRequestCount = parseInt(localStorage.getItem('news_requests') || '0');
let newsRequestDate = localStorage.getItem('news_request_date');

function canMakeNewsRequest() {
  const today = new Date().toDateString();
  if (newsRequestDate !== today) {
    newsRequestCount = 0;
    newsRequestDate = today;
    localStorage.setItem('news_request_date', today);
  }
  return newsRequestCount < 200;
}

function trackNewsRequest() {
  newsRequestCount++;
  localStorage.setItem('news_requests', newsRequestCount.toString());
}
```

### CoinGecko (50/min)
```javascript
const cryptoRequestTimes = [];

function canMakeCryptoRequest() {
  const oneMinuteAgo = Date.now() - 60000;
  const recentRequests = cryptoRequestTimes.filter(t => t > oneMinuteAgo);
  return recentRequests.length < 50;
}

function trackCryptoRequest() {
  cryptoRequestTimes.push(Date.now());
  // Clean up old entries
  const oneMinuteAgo = Date.now() - 60000;
  while (cryptoRequestTimes[0] < oneMinuteAgo) {
    cryptoRequestTimes.shift();
  }
}
```

---

## Testing API Integration

### Mock Responses
```javascript
// Use for testing without hitting real APIs
const mockWeather = {
  current: { temperature: 15, condition: 'Partly Cloudy', humidity: 65, windSpeed: 12 },
  forecast: [
    { date: '2025-12-03', high: 18, low: 10, condition: 'Sunny' },
    // ... more days
  ]
};
```

### Error Simulation
```javascript
// Force error states for testing
function simulateError(type) {
  switch (type) {
    case 'network': throw new Error('Network error');
    case 'timeout': throw new Error('Timeout');
    case 'rate_limit': throw new Error('429 Too Many Requests');
  }
}
```
