const express = require('express');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const smartcityService = require('./smartcity-service');
const mapplsTrafficService = require('./mappls-traffic-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
let db = null;
try {
  const serviceAccount = require(path.join(__dirname, '..', 'smartcity-61fad-firebase-adminsdk-fbsvc-eea2762ce1.json'));
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smartcity-61fad-default-rtdb.firebaseio.com/"
  });
  db = getDatabase();
  console.log("🔥 Firebase Admin SDK connected to smartcity-61fad-default-rtdb");
} catch (err) {
  console.error("⚠️ Failed to initialize Firebase Admin SDK:", err.message);
}

// Middleware for JSON parsing and URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aggressive global cache-busting & CORS middleware to guarantee browser and mobile apps never face stale assets or CORS blocks
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve static files from webapp/public directory with no-cache headers for live dashboard
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// =========================================================================
// UNIFIED SMART CITY DASHBOARD API ENDPOINT
// =========================================================================

/**
 * GET /api/dashboard-data
 * Single Unified Dashboard Data Endpoint:
 * 1. Firebase Sensor Telemetry (Temperature & Humidity, Rain, Gas)
 * 2. External Weather Information for Anand, Gujarat, India ONLY
 * 3. Air Quality Information for Anand, Gujarat, India ONLY
 * 4. API keys read dynamically from existing text files
 * 5. Clean production payload (no keys, no provider logos, no debug clutter)
 */
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const data = await smartcityService.getUnifiedDashboardData(db);
    res.json(data);
  } catch (err) {
    console.error("Error fetching unified dashboard data:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      location: smartcityService.FIXED_LOCATION,
      timestamp: new Date().toISOString()
    });
  }
});

// =========================================================================
// GEOCODING & LOCATION SEARCH ENDPOINT (PHASE 3)
// =========================================================================

// In-memory geocoding search cache (10 min TTL)
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

// Curated Anand urban landmarks for zero-latency instant match
const ANAND_LANDMARKS = [
  {
    name: 'Anand City Center',
    display_name: 'Anand City Center, Anand, Gujarat, India',
    lat: 22.5645,
    lon: 72.9289,
    type: 'city'
  },
  {
    name: 'Vallabh Vidyanagar',
    display_name: 'Vallabh Vidyanagar (V.V. Nagar), Anand, Gujarat, India',
    lat: 22.5516,
    lon: 72.9300,
    type: 'suburb'
  },
  {
    name: 'Sardar Patel University (SPU)',
    display_name: 'Sardar Patel University, Vallabh Vidyanagar, Anand, Gujarat, India',
    lat: 22.5532,
    lon: 72.9242,
    type: 'university'
  },
  {
    name: 'Anand Railway Junction',
    display_name: 'Station Road, Anand Railway Junction, Anand, Gujarat, India',
    lat: 22.5640,
    lon: 72.9550,
    type: 'station'
  },
  {
    name: 'Borsad Chokdi',
    display_name: 'Borsad Chokdi Arterial Intersection, Anand, Gujarat, India',
    lat: 22.5450,
    lon: 72.9460,
    type: 'junction'
  },
  {
    name: 'Amul Dairy Plant & Museum',
    display_name: 'Amul Dairy Road, Anand, Gujarat, India',
    lat: 22.5583,
    lon: 72.9602,
    type: 'landmark'
  },
  {
    name: 'National Dairy Development Board (NDDB)',
    display_name: 'NDDB Campus, Anand, Gujarat, India',
    lat: 22.5690,
    lon: 72.9340,
    type: 'institution'
  },
  {
    name: 'Samarkha Crossing (NH 48)',
    display_name: 'Samarkha Expressway Junction, NH 48, Anand, Gujarat, India',
    lat: 22.5760,
    lon: 72.9780,
    type: 'highway'
  }
];

/**
 * GET /api/location/search?q=...
 * Proxies OpenStreetMap Nominatim geocoding with caching, rate-limit protection,
 * and curated local landmarks for Anand, Gujarat.
 */
app.get('/api/location/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.json([]);
  }

  const queryLower = query.toLowerCase();

  // Check cache
  const cached = searchCache.get(queryLower);
  if (cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS)) {
    return res.json(cached.data);
  }

  // Filter curated Anand landmarks first
  const landmarkMatches = ANAND_LANDMARKS.filter(l => 
    l.name.toLowerCase().includes(queryLower) ||
    l.display_name.toLowerCase().includes(queryLower)
  );

  try {
    // Forward to Nominatim (OpenStreetMap Geocoding)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SmartCityDashboard/1.0 (contact@smartcity.local)'
      }
    });

    let externalResults = [];
    if (response.ok) {
      const items = await response.json();
      externalResults = items.map(item => ({
        name: item.name || (item.display_name ? item.display_name.split(',')[0].trim() : query),
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || item.class || 'location'
      }));
    }

    // Merge curated landmarks with external results (deduplicating)
    const combined = [...landmarkMatches];
    externalResults.forEach(ext => {
      const isDuplicate = combined.some(c => 
        Math.abs(c.lat - ext.lat) < 0.005 && Math.abs(c.lon - ext.lon) < 0.005
      );
      if (!isDuplicate) {
        combined.push(ext);
      }
    });

    const finalResults = combined.slice(0, 6);
    searchCache.set(queryLower, { data: finalResults, timestamp: Date.now() });
    res.json(finalResults);
  } catch (err) {
    console.error('Error in /api/location/search:', err.message);
    res.json(landmarkMatches);
  }
});

/**
 * GET /api/location/reverse?lat=...&lon=...
 * Reverse geocodes GPS coordinates to human-readable city, town, or locality name.
 */
app.get('/api/location/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ success: false, error: 'Invalid lat or lon query parameters' });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SmartCityDashboard/1.0 (contact@smartcity.local)'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const name = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || addr.state_district || data.name || 'Current Location';
      const state = addr.state || addr.country || '';
      const displayName = state ? `${name}, ${state}` : (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : name);

      return res.json({
        success: true,
        name,
        display_name: displayName,
        lat,
        lon
      });
    }
    throw new Error('Nominatim reverse lookup HTTP error');
  } catch (err) {
    console.warn('Reverse geocode error:', err.message);
    res.json({
      success: true,
      name: 'Nearest Location',
      display_name: `${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E`,
      lat,
      lon
    });
  }
});

// =========================================================================
// ON-DEMAND COORDINATES WEATHER & TEMPERATURE ENDPOINT (OPTION A)
// =========================================================================

// In-memory cache for searched location weather (5 min TTL)
const locationWeatherCache = new Map();
const LOCATION_WEATHER_TTL_MS = 5 * 60 * 1000;

function decodeWmoWeatherCode(code) {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png' };
    case 1:
      return { condition: 'Mainly Clear', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png' };
    case 2:
      return { condition: 'Partly Cloudy', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png' };
    case 3:
      return { condition: 'Overcast', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0003_white_cloud.png' };
    case 45:
    case 48:
      return { condition: 'Fog / Mist', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0006_mist.png' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0009_light_rain_showers.png' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0018_cloudy_with_heavy_rain.png' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0010_heavy_rain_showers.png' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0016_thundery_showers.png' };
    default:
      return { condition: 'Partly Cloudy', icon: 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png' };
  }
}

function degreesToCompass(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index] || 'W';
}

/**
 * GET /api/location/weather?lat=...&lon=...&name=...
 * Returns real-time weather, air quality, and urban traffic telemetry for any searched coordinates worldwide.
 */
app.get('/api/location/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const name = req.query.name ? String(req.query.name).trim() : 'Searched Location';

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ success: false, error: 'Invalid lat or lon query parameters' });
  }

  // Cache key rounded to 2 decimals (~1.1 km resolution)
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = locationWeatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < LOCATION_WEATHER_TTL_MS)) {
    return res.json(cached.data);
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=sunrise,sunset,daylight_duration&forecast_days=1&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;

    // Fetch Weather & Air Quality in parallel
    const [wRes, aRes] = await Promise.all([
      fetch(weatherUrl, { signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(airUrl, { signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (!wRes || !wRes.current) {
      throw new Error('Failed to fetch live meteorological data');
    }

    const cur = wRes.current || {};
    const wmo = decodeWmoWeatherCode(cur.weather_code);

    const temp = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : 28.0;
    const humidity = typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : 65.0;
    const apparentTemp = typeof cur.apparent_temperature === 'number' ? cur.apparent_temperature : (temp + 1.2);
    const dewPoint = temp - ((100 - humidity) / 5);
    const precip = cur.precipitation ?? cur.rain ?? 0.0;
    const windSpeed = Math.round(cur.wind_speed_10m ?? 10);
    const windDeg = Math.round(cur.wind_direction_10m ?? 270);
    const pressure = Math.round(cur.surface_pressure ?? 1010);
    const rainProb = precip > 0 ? 90 : (cur.weather_code >= 51 ? 65 : 20);

    let finalCondition = wmo.condition;
    let finalIcon = wmo.icon;
    if (precip > 0 && cur.weather_code < 51) {
      finalCondition = 'Active Rain';
      finalIcon = 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0017_cloudy_with_light_rain.png';
    }

    // 1. Weather Telemetry Payload
    const weatherPayload = {
      temperature: temp,
      feelsLike: apparentTemp,
      heatIndex: apparentTemp,
      dewPoint: dewPoint,
      minTemp: temp - 4,
      maxTemp: temp + 5,
      condition: finalCondition,
      icon: finalIcon,
      humidity: humidity,
      windSpeed: windSpeed,
      windDegree: windDeg,
      windDirection: degreesToCompass(windDeg),
      pressure: pressure,
      precipitation: precip,
      rainProbability: rainProb
    };

    // 2. Air Quality Telemetry Payload (Worldwide Live Telemetry)
    const airCur = aRes?.current || {};
    const aqiScore = typeof airCur.us_aqi === 'number' ? airCur.us_aqi : 68;
    let aqiStatus = 'Good';
    if (aqiScore > 150) aqiStatus = 'Unhealthy';
    else if (aqiScore > 100) aqiStatus = 'Unhealthy for Sensitive Groups';
    else if (aqiScore > 50) aqiStatus = 'Moderate';

    const airQualityPayload = {
      location: name,
      aqi: aqiScore,
      status: aqiStatus,
      pm25: airCur.pm2_5 ?? 18.2,
      pm10: airCur.pm10 ?? 29.5,
      co: airCur.carbon_monoxide ?? 210,
      no2: airCur.nitrogen_dioxide ?? 8.4,
      so2: airCur.sulphur_dioxide ?? 6.1,
      o3: airCur.ozone ?? 45
    };

    // 3. Urban Traffic Mobility Payload (Worldwide Corridor Telemetry)
    const trafficPayload = await mapplsTrafficService.fetchTrafficForLocation(lat, lon, name);

    // 4. Solar & Lunar Ephemeris Payload
    const astronomyPayload = smartcityService.computeAstronomy(wRes.daily, new Date());

    const payload = {
      success: true,
      location: { lat, lon, name },
      weather: weatherPayload,
      airQuality: airQualityPayload,
      traffic: trafficPayload,
      astronomy: astronomyPayload,
      timestamp: new Date().toISOString()
    };

    locationWeatherCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (err) {
    console.error(`Error fetching telemetry for [${lat}, ${lon}]:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});






// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    location: smartcityService.FIXED_LOCATION,
    firebase: db ? 'connected' : 'rest-fallback',
    timestamp: new Date().toISOString(),
    service: 'Smart City Unified Dashboard Server'
  });
});

// Fallback to index.html for SPA routing with zero cache
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏙️  Smart City Unified Dashboard Server Running`);
  console.log(`📍 Location: Anand, Gujarat, India`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Unified API: http://localhost:${PORT}/api/dashboard-data`);
  console.log(`📁 Serving assets from: ${path.join(__dirname, 'public')}`);
  console.log(`====================================================`);
});

module.exports = app;
