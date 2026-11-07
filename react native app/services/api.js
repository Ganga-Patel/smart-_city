// Unified Telemetry API Service for WebApp & Vercel Sync
import { API_CONFIG } from '../constants/Config';
import { Platform } from 'react-native';

let activeBaseUrl = Platform.OS === 'web' ? API_CONFIG.localUrl : API_CONFIG.lanUrl;

export function setActiveBaseUrl(url) {
  if (url && typeof url === 'string') {
    activeBaseUrl = url.trim().replace(/\/+$/, '');
  }
}

export function getActiveBaseUrl() {
  return activeBaseUrl;
}

/**
 * Fetch unified dashboard telemetry payload from WebApp / Vercel backend
 */
export async function fetchUnifiedDashboardData(overrideUrl = null) {
  const targetBase = (overrideUrl || activeBaseUrl || API_CONFIG.lanUrl).replace(/\/+$/, '');
  const url = `${targetBase}/api/dashboard-data`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success && !json.firebaseSensor) {
      throw new Error(json.error || 'Invalid API payload');
    }

    return parseUnifiedPayload(json);
  } catch (err) {
    clearTimeout(timeoutId);

    // Fallback: if we were trying LAN URL on web, or vice versa, attempt fallback
    if (!overrideUrl && targetBase !== API_CONFIG.localUrl && Platform.OS === 'web') {
      try {
        const fallbackRes = await fetch(`${API_CONFIG.localUrl}/api/dashboard-data`);
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          activeBaseUrl = API_CONFIG.localUrl;
          return parseUnifiedPayload(json);
        }
      } catch (fallbackErr) {
        // Continue to rethrow original error
      }
    }

    throw err;
  }
}

/**
 * Parses and normalizes unified payload into structured telemetry
 */
export function parseUnifiedPayload(raw) {
  const fb = raw.firebaseSensor || {};
  const weather = raw.cityWeather || {};
  const air = raw.airQuality || {};
  const traffic = raw.traffic || {};
  const astronomy = raw.astronomy || {};

  // Temperature & humidity prioritizing live physical sensor (DHT22)
  const sensorTemp = typeof fb.temperature === 'number' ? fb.temperature : parseFloat(fb.temperature) || 26.0;
  const sensorHumidity = typeof fb.humidity === 'number' ? fb.humidity : parseFloat(fb.humidity) || 47.0;

  // Rain: value 0 = raining/wet, 1 = dry
  const rainRaw = fb.rain?.value !== undefined ? fb.rain.value : 1;
  const rainDetected = fb.rain?.isRaining !== undefined ? fb.rain.isRaining : (rainRaw === 0);

  // Gas: MQ2 DO value 0 = alert, 1 = safe
  const gasRaw = fb.gas?.value !== undefined ? fb.gas.value : 1;
  const gasAlert = fb.gas?.isAlert !== undefined ? fb.gas.isAlert : (gasRaw === 0);
  const gasPpm = gasAlert ? 450 : 120;

  return {
    // Sensor Telemetry (matches physical hardware on ESP8266)
    temperature: sensorTemp,
    humidity: sensorHumidity,
    rainRaw: rainRaw,
    rainDetected: rainDetected,
    gasRaw: gasRaw,
    gasPpm: gasPpm,
    gasAlert: gasAlert,
    pirMotion: false,
    irObstacle: false,
    reedLocked: true,

    // City Atmospheric Weather (Anand, Gujarat)
    cityWeather: {
      temperature: weather.temperature ?? 34.0,
      feelsLike: weather.feelsLike ?? 33.0,
      condition: weather.condition || 'Sunny',
      icon: weather.icon || '',
      humidity: weather.humidity ?? 25,
      windSpeed: weather.windSpeed ?? 9,
      windDirection: weather.windDirection || 'NE',
      windDegree: weather.windDegree ?? 46,
      pressure: weather.pressure ?? 1013,
      uvIndex: weather.uvIndex ?? 5,
      visibility: weather.visibility ?? 10,
      cloudCover: weather.cloudCover ?? 9,
      precipitation: weather.precipitation ?? 0.0,
      rainProbability: weather.rainProbability ?? 15,
      rainStatus: weather.rainStatus || '0.0 mm (No Active Rain)'
    },

    // Air Quality Index (Anand, Gujarat)
    airQuality: {
      aqi: air.aqi ?? 78,
      status: air.status || 'Moderate',
      pm25: air.pm25 ?? 32.4,
      pm10: air.pm10 ?? 49.7,
      co: air.co ?? 212,
      no2: air.no2 ?? 3.3,
      so2: air.so2 ?? 9.4,
      o3: air.o3 ?? 155,
      location: air.location || raw.location || 'Anand, Gujarat, India'
    },

    // Traffic Flow (Anand, Gujarat)
    traffic: {
      currentSpeed: traffic.currentSpeed ?? 38,
      freeFlowSpeed: traffic.freeFlowSpeed ?? 50,
      congestionIndex: traffic.congestionIndex ?? 22,
      status: traffic.status || 'Smooth Flow',
      travelTimeSec: traffic.travelTimeSec ?? 155,
      delaySeconds: traffic.delaySeconds ?? 25,
      corridors: traffic.corridors || []
    },

    // Solar & Lunar Ephemeris
    astronomy: astronomy,

    // Metadata
    location: raw.location || 'Anand, Gujarat, India',
    timestamp: Date.now(),
    sourceNode: 'node_01',
    dataSource: 'webapp_api'
  };
}

/**
 * Starts continuous live polling for unified telemetry
 */
export function startUnifiedPolling(onDataCallback, onConnectionCallback, intervalMs = 5000) {
  let isMounted = true;
  let timerId = null;

  async function poll() {
    if (!isMounted) return;
    try {
      const data = await fetchUnifiedDashboardData();
      if (isMounted) {
        if (onConnectionCallback) onConnectionCallback(true);
        if (onDataCallback) onDataCallback(data);
      }
    } catch (err) {
      if (isMounted) {
        if (onConnectionCallback) onConnectionCallback(false);
      }
    } finally {
      if (isMounted) {
        timerId = setTimeout(poll, intervalMs);
      }
    }
  }

  // Initial immediate poll
  poll();

  // Return cancel subscription callback
  return () => {
    isMounted = false;
    if (timerId) clearTimeout(timerId);
  };
}
