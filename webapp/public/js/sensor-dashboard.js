/**
 * Smart City IoT Minimal Sensor Dashboard Controller
 * Displays ONLY: Temperature, Humidity, Gas, Rain, Heat Index + 12-Hour Analysis
 * Zero Dummy Data Policy • 100% Actual Firebase RTDB / Hardware Telemetry
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, onValue, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

// Official Firebase Realtime Database Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6BVnaEqgXYZK2MdRDxSK0lXiLWa7zDDc",
  authDomain: "smartcity-61fad.firebaseapp.com",
  databaseURL: "https://smartcity-61fad-default-rtdb.firebaseio.com",
  projectId: "smartcity-61fad",
  storageBucket: "smartcity-61fad.appspot.com",
  messagingSenderId: "367252086307",
  appId: "1:367252086307:web:86b5daefc70b8f41639d67"
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY_12H = 'smartcity_sensor_12h_log';

class MinimalSensorDashboardApp {
  constructor() {
    this.app = null;
    this.db = null;
    this.isConnected = false;
    this.isFahrenheit = false;
    this.activeChartTab = 'climate'; // 'climate' | 'gas' | 'rain'

    // 12-Hour Rolling Buffer of Actual Readings
    this.historyBuffer = this.loadStored12hHistory();

    // Chart.js instance
    this.chart = null;

    this.hasReceivedWebSocketData = false;
    this.lastPacketTimestamp = null;
  }

  async init() {
    console.log('🚀 Initializing Minimal Sensor Dashboard...');
    this.initTheme();
    this.bindControls();
    this.initChart();
    this.initFirebase();
    this.render12hStats();

    if (window.lucide) window.lucide.createIcons();
  }

  // Load actual readings persisted across the 12-hour window
  loadStored12hHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_12H);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const cutoff = Date.now() - TWELVE_HOURS_MS;
      return parsed.filter(item => item && typeof item.timestamp === 'number' && item.timestamp >= cutoff);
    } catch (e) {
      return [];
    }
  }

  save12hHistory() {
    try {
      const cutoff = Date.now() - TWELVE_HOURS_MS;
      this.historyBuffer = this.historyBuffer.filter(item => item && item.timestamp >= cutoff);
      localStorage.setItem(STORAGE_KEY_12H, JSON.stringify(this.historyBuffer.slice(-200)));
    } catch (e) {}
  }

  // =========================================================================
  // 1. THEME MANAGEMENT (Synchronized with City Dashboard)
  // =========================================================================
  initTheme() {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('smartcity_theme') || localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    let isLight = savedTheme === 'light' || (!savedTheme && prefersLight);

    const applyTheme = (light) => {
      if (light) {
        html.classList.add('light-theme');
        html.classList.remove('dark');
        this.updateThemeIcon(true);
      } else {
        html.classList.remove('light-theme');
        html.classList.add('dark');
        this.updateThemeIcon(false);
      }
      localStorage.setItem('smartcity_theme', light ? 'light' : 'dark');
      localStorage.setItem('theme', light ? 'light' : 'dark');
      if (window.lucide) window.lucide.createIcons();
    };

    applyTheme(isLight);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        isLight = !html.classList.contains('light-theme');
        applyTheme(isLight);
      });
    }
  }

  updateThemeIcon(isLight) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // =========================================================================
  // 2. FIREBASE REAL-TIME TELEMETRY INGESTION
  // =========================================================================
  initFirebase() {
    try {
      this.app = initializeApp(FIREBASE_CONFIG);
      this.db = getDatabase(this.app);

      // Connection state listener
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        this.updateConnectionStatus(snap.val() === true);
      });

      // Immediate snapshot read
      get(ref(this.db, '/')).then((snapshot) => {
        if (snapshot.exists()) {
          this.hasReceivedWebSocketData = true;
          this.handleIncomingData(snapshot.val(), 'Direct Snapshot');
        }
      }).catch(() => {
        this.triggerRestFallback();
      });

      // Real-time listener on /smartcity (ESP8266 node)
      const smartcityRef = ref(this.db, 'smartcity');
      onValue(smartcityRef, (snapshot) => {
        if (snapshot.exists()) {
          this.hasReceivedWebSocketData = true;
          this.handleIncomingData({ smartcity: snapshot.val() }, 'Live Stream');
        }
      }, () => {
        this.triggerRestFallback();
      });

      // Backup check if WebSockets delayed
      setTimeout(() => {
        if (!this.hasReceivedWebSocketData) {
          this.triggerRestFallback();
        }
      }, 2000);

    } catch (err) {
      this.triggerRestFallback();
    }
  }

  async triggerRestFallback() {
    try {
      const localRes = await fetch('/api/sensors', { cache: 'no-store' });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData?.raw) {
          this.handleIncomingData(localData.raw, 'Live Connected');
          this.updateConnectionStatus(true);
          return;
        } else if (localData?.sensors) {
          this.handleIncomingData({ smartcity: localData.sensors }, 'Live Connected');
          this.updateConnectionStatus(true);
          return;
        }
      }
    } catch (e) {}

    // Fallback to /api/dashboard-data
    try {
      const dashRes = await fetch('/api/dashboard-data', { cache: 'no-store' });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData?.firebaseSensor) {
          this.handleIncomingData({ smartcity: dashData.firebaseSensor }, 'Live Connected');
          this.updateConnectionStatus(true);
        }
      }
    } catch (e) {
      this.updateConnectionStatus(false);
    }
  }

  // =========================================================================
  // 3. SENSOR TELEMETRY PROCESSING (STRICTLY ACTUAL DATA ONLY)
  // =========================================================================
  handleIncomingData(rawPayload, sourceLabel = 'Live') {
    if (!rawPayload) return;

    const smartcity = rawPayload.smartcity || {};
    const sensor = rawPayload.sensor || {};

    // 1. Temperature (°C)
    let temp = null;
    if (smartcity.DHT22?.temperature !== undefined) {
      temp = parseFloat(smartcity.DHT22.temperature);
    } else if (smartcity.temperature !== undefined) {
      temp = parseFloat(smartcity.temperature);
    } else if (sensor.temperature?.value !== undefined) {
      temp = parseFloat(sensor.temperature.value);
    }

    // 2. Humidity (%)
    let humidity = null;
    if (smartcity.DHT22?.humidity !== undefined) {
      humidity = parseFloat(smartcity.DHT22.humidity);
    } else if (smartcity.humidity !== undefined) {
      humidity = parseFloat(smartcity.humidity);
    } else if (sensor.humidity?.value !== undefined) {
      humidity = parseFloat(sensor.humidity.value);
    }

    // 3. Rain Sensor (DO: 0 = Water/Wet, 1 = Dry)
    let rainRaw = 1;
    if (smartcity.Rain?.value !== undefined) {
      rainRaw = parseInt(smartcity.Rain.value, 10);
    } else if (smartcity.rain?.value !== undefined) {
      rainRaw = parseInt(smartcity.rain.value, 10);
    } else if (rawPayload.rain !== undefined) {
      rainRaw = typeof rawPayload.rain === 'object' ? parseInt(rawPayload.rain.value ?? 1, 10) : parseInt(rawPayload.rain, 10);
    }

    // 4. Gas Sensor (DO: 0 = Alert, 1 = Safe Ambient)
    let mq2Raw = 1;
    if (smartcity.MQ2?.value !== undefined) {
      mq2Raw = parseInt(smartcity.MQ2.value, 10);
    } else if (smartcity.gas?.value !== undefined) {
      mq2Raw = parseInt(smartcity.gas.value, 10);
    } else if (rawPayload.gas !== undefined) {
      mq2Raw = typeof rawPayload.gas === 'object' ? parseInt(rawPayload.gas.value ?? 1, 10) : parseInt(rawPayload.gas, 10);
    }

    const timestamp = Date.now();
    this.lastPacketTimestamp = timestamp;

    // Heat Index (Rothfusz regression equation)
    let heatIndex = null;
    if (temp != null && humidity != null && !isNaN(temp) && !isNaN(humidity)) {
      const TF = temp * 1.8 + 32;
      let HIF = 0.5 * (TF + 61.0 + ((TF - 68.0) * 1.2) + (humidity * 0.094));
      if (HIF >= 80) {
        HIF = -42.379 + 2.04901523 * TF + 10.14333127 * humidity - 0.22475541 * TF * humidity
              - 0.00683783 * TF * TF - 0.05481717 * humidity * humidity
              + 0.00122874 * TF * TF * humidity + 0.00085282 * TF * humidity * humidity
              - 0.00000199 * TF * TF * humidity * humidity;
      }
      heatIndex = (HIF - 32) / 1.8;
    }

    const currentRecord = {
      temperature: temp,
      humidity: humidity,
      rainRaw: isNaN(rainRaw) ? 1 : rainRaw,
      isRaining: rainRaw === 0,
      mq2Raw: isNaN(mq2Raw) ? 1 : mq2Raw,
      isGasAlert: mq2Raw === 0,
      heatIndex: heatIndex,
      timestamp: timestamp
    };

    // Append to 12-hour actual history buffer
    this.historyBuffer.push(currentRecord);
    this.save12hHistory();

    // Render live sensor cards
    this.renderLiveCards(currentRecord);

    // Compute & render 12-hour min, max, average
    this.render12hStats();

    // Update 12-hour charts
    this.update12hChart();

    // Update Last Updated time
    this.updateLastUpdatedTime(timestamp);
  }

  // =========================================================================
  // 4. RENDER TOP 4 SENSOR CARDS + HEAT INDEX
  // =========================================================================
  renderLiveCards(r) {
    // 1. Temperature Card
    const tempValEl = document.getElementById('tempValue');
    const tempUnitEl = document.getElementById('tempUnit');
    const tempBadgeEl = document.getElementById('tempStatusBadge');
    const tempRangeBar = document.getElementById('tempRangeBar');

    if (r.temperature != null && !isNaN(r.temperature)) {
      const displayTemp = this.isFahrenheit ? (r.temperature * 9/5 + 32) : r.temperature;
      if (tempValEl) tempValEl.textContent = displayTemp.toFixed(1);
      if (tempUnitEl) tempUnitEl.textContent = this.isFahrenheit ? '°F' : '°C';

      if (tempBadgeEl) {
        if (r.temperature > 36) {
          tempBadgeEl.textContent = 'High Heat Alert';
          tempBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30';
        } else if (r.temperature < 15) {
          tempBadgeEl.textContent = 'Cool';
          tempBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30';
        } else {
          tempBadgeEl.textContent = 'Optimal';
          tempBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        }
      }

      if (tempRangeBar) {
        const pct = Math.max(5, Math.min(100, (r.temperature / 50) * 100));
        tempRangeBar.style.width = `${pct}%`;
      }
    }

    // 2. Humidity Card
    const humValEl = document.getElementById('humidityValue');
    const humBadgeEl = document.getElementById('humidityStatusBadge');
    const humRangeBar = document.getElementById('humidityRangeBar');

    if (r.humidity != null && !isNaN(r.humidity)) {
      if (humValEl) humValEl.textContent = r.humidity.toFixed(1);
      if (humRangeBar) humRangeBar.style.width = `${Math.min(100, Math.max(0, r.humidity))}%`;

      if (humBadgeEl) {
        if (r.humidity < 35) {
          humBadgeEl.textContent = 'Dry Air';
          humBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30';
        } else if (r.humidity > 70) {
          humBadgeEl.textContent = 'High Moisture';
          humBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
        } else {
          humBadgeEl.textContent = 'Comfortable';
          humBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        }
      }
    }

    // 3. Gas & Air Safety Card
    const gasBadgeEl = document.getElementById('gasStatusBadge');
    const gasTitleEl = document.getElementById('gasValueTitle');
    const gasDescEl = document.getElementById('gasValueDesc');
    const gasIconBox = document.getElementById('gasIconBox');
    const gasIcon = document.getElementById('gasIcon');
    const gasRangeBar = document.getElementById('gasRangeBar');

    if (r.isGasAlert) {
      if (gasBadgeEl) {
        gasBadgeEl.textContent = 'Gas Alert!';
        gasBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse';
      }
      if (gasTitleEl) gasTitleEl.textContent = 'Hazardous Gas Detected';
      if (gasDescEl) gasDescEl.textContent = 'Threshold breached on sensor';
      if (gasIconBox) gasIconBox.className = 'p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30';
      if (gasIcon) gasIcon.setAttribute('data-lucide', 'alert-triangle');
      if (gasRangeBar) gasRangeBar.style.width = '100%';
    } else {
      if (gasBadgeEl) {
        gasBadgeEl.textContent = 'Air Safe';
        gasBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      }
      if (gasTitleEl) gasTitleEl.textContent = 'Nominal / Clean Air';
      if (gasDescEl) gasDescEl.textContent = 'Gases well below threshold limits';
      if (gasIconBox) gasIconBox.className = 'p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      if (gasIcon) gasIcon.setAttribute('data-lucide', 'shield-check');
      if (gasRangeBar) gasRangeBar.style.width = '15%';
    }

    // 4. Rain Card
    const rainBadgeEl = document.getElementById('rainStatusBadge');
    const rainTitleEl = document.getElementById('rainValueTitle');
    const rainDescEl = document.getElementById('rainValueDesc');
    const rainIconBox = document.getElementById('rainIconBox');
    const rainIcon = document.getElementById('rainIcon');
    const rainRangeBar = document.getElementById('rainRangeBar');

    if (r.isRaining) {
      if (rainBadgeEl) {
        rainBadgeEl.textContent = 'Precipitation Alert';
        rainBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse';
      }
      if (rainTitleEl) rainTitleEl.textContent = 'Precipitation Active';
      if (rainDescEl) rainDescEl.textContent = 'Moisture detected on physical surface';
      if (rainIconBox) rainIconBox.className = 'p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      if (rainIcon) rainIcon.setAttribute('data-lucide', 'cloud-rain');
      if (rainRangeBar) rainRangeBar.style.width = '100%';
    } else {
      if (rainBadgeEl) {
        rainBadgeEl.textContent = 'Dry Surface';
        rainBadgeEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      }
      if (rainTitleEl) rainTitleEl.textContent = 'Clear & Dry';
      if (rainDescEl) rainDescEl.textContent = 'Zero precipitation detected on plate';
      if (rainIconBox) rainIconBox.className = 'p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20';
      if (rainIcon) rainIcon.setAttribute('data-lucide', 'sun');
      if (rainRangeBar) rainRangeBar.style.width = '5%';
    }

    // 5. Heat Index Highlight Card
    const heatValEl = document.getElementById('heatIndexValue');
    const heatUnitEl = document.getElementById('heatIndexUnit');
    const heatStatusEl = document.getElementById('heatStatusBadge');
    const heatDeltaEl = document.getElementById('heatDeltaText');

    if (r.heatIndex != null && !isNaN(r.heatIndex)) {
      const displayHI = this.isFahrenheit ? (r.heatIndex * 9/5 + 32) : r.heatIndex;
      if (heatValEl) heatValEl.textContent = displayHI.toFixed(1);
      if (heatUnitEl) heatUnitEl.textContent = this.isFahrenheit ? '°F' : '°C';

      if (heatStatusEl) {
        if (r.heatIndex >= 38) {
          heatStatusEl.textContent = 'Extreme Heat';
          heatStatusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30';
        } else if (r.heatIndex >= 28) {
          heatStatusEl.textContent = 'Caution / Warm';
          heatStatusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30';
        } else {
          heatStatusEl.textContent = 'Comfortable';
          heatStatusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        }
      }

      if (heatDeltaEl && r.temperature != null) {
        const diff = r.heatIndex - r.temperature;
        heatDeltaEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}°C vs Base`;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // 5. 12-HOUR STATISTICAL ANALYSIS (MIN, MAX, AVERAGE)
  // =========================================================================
  render12hStats() {
    const cutoff = Date.now() - TWELVE_HOURS_MS;
    const records = this.historyBuffer.filter(r => r && r.timestamp >= cutoff);

    const countEl = document.getElementById('dataPointsCount');
    if (countEl) {
      countEl.textContent = `${records.length} Actual Point${records.length === 1 ? '' : 's'}`;
    }

    const temps = records.map(r => r.temperature).filter(t => t != null && !isNaN(t));
    const hums = records.map(r => r.humidity).filter(h => h != null && !isNaN(h));
    const gasAlerts = records.filter(r => r.isGasAlert).length;
    const rainEvents = records.filter(r => r.isRaining).length;

    // Temperature (12h)
    const tMinEl = document.getElementById('statTempMin');
    const tMaxEl = document.getElementById('statTempMax');
    const tAvgEl = document.getElementById('statTempAvg');
    if (temps.length > 0) {
      const minT = Math.min(...temps);
      const maxT = Math.max(...temps);
      const avgT = temps.reduce((a, b) => a + b, 0) / temps.length;
      const unit = this.isFahrenheit ? '°F' : '°C';
      const toDisp = (v) => this.isFahrenheit ? (v * 9/5 + 32).toFixed(1) : v.toFixed(1);

      if (tMinEl) tMinEl.textContent = `${toDisp(minT)}${unit}`;
      if (tMaxEl) tMaxEl.textContent = `${toDisp(maxT)}${unit}`;
      if (tAvgEl) tAvgEl.textContent = `${toDisp(avgT)}${unit}`;
    } else {
      if (tMinEl) tMinEl.textContent = '--';
      if (tMaxEl) tMaxEl.textContent = '--';
      if (tAvgEl) tAvgEl.textContent = '--';
    }

    // Humidity (12h)
    const hMinEl = document.getElementById('statHumMin');
    const hMaxEl = document.getElementById('statHumMax');
    const hAvgEl = document.getElementById('statHumAvg');
    if (hums.length > 0) {
      const minH = Math.min(...hums);
      const maxH = Math.max(...hums);
      const avgH = hums.reduce((a, b) => a + b, 0) / hums.length;

      if (hMinEl) hMinEl.textContent = `${minH.toFixed(0)}%`;
      if (hMaxEl) hMaxEl.textContent = `${maxH.toFixed(0)}%`;
      if (hAvgEl) hAvgEl.textContent = `${avgH.toFixed(0)}%`;
    } else {
      if (hMinEl) hMinEl.textContent = '--';
      if (hMaxEl) hMaxEl.textContent = '--';
      if (hAvgEl) hAvgEl.textContent = '--';
    }

    // Gas Safety (12h)
    const gasStateEl = document.getElementById('statGasState');
    const gasAlertsEl = document.getElementById('statGasAlerts');
    if (gasStateEl) {
      gasStateEl.textContent = gasAlerts === 0 ? '100% Safe' : `${gasAlerts} Alerts`;
      gasStateEl.className = gasAlerts === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
    }
    if (gasAlertsEl) {
      gasAlertsEl.textContent = `${gasAlerts} Event${gasAlerts === 1 ? '' : 's'}`;
    }

    // Precipitation (12h)
    const rainEventsEl = document.getElementById('statRainEvents');
    const rainCondEl = document.getElementById('statRainCondition');
    if (rainEventsEl) {
      rainEventsEl.textContent = `${rainEvents} Event${rainEvents === 1 ? '' : 's'}`;
    }
    if (rainCondEl) {
      rainCondEl.textContent = rainEvents > 0 ? 'Moisture Active' : 'Dry Ground';
      rainCondEl.className = rainEvents > 0 ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold';
    }
  }

  // =========================================================================
  // 6. 12-HOUR TELEMETRY GRAPHS (ZERO DUMMY DATA)
  // =========================================================================
  initChart() {
    const canvas = document.getElementById('twelveHourChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Temperature',
            data: [],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            borderWidth: 2.5,
            pointRadius: 3,
            tension: 0.3,
            fill: true,
            yAxisID: 'yLeft'
          },
          {
            label: 'Humidity (%)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderWidth: 2.5,
            pointRadius: 3,
            tension: 0.3,
            fill: true,
            yAxisID: 'yRight'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 29, 0.95)',
            titleColor: '#e2e8f0',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            padding: 10,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' }, maxTicksLimit: 8 }
          },
          yLeft: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: {
              color: '#f43f5e',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${v}${this.isFahrenheit ? '°F' : '°C'}`
            }
          },
          yRight: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#38bdf8',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });

    this.update12hChart();
  }

  update12hChart() {
    if (!this.chart) return;

    const overlay = document.getElementById('chartLoadingOverlay');
    const cutoff = Date.now() - TWELVE_HOURS_MS;
    const records = this.historyBuffer.filter(r => r && r.timestamp >= cutoff);

    if (records.length > 0 && overlay) {
      overlay.classList.add('hidden');
    }

    const labels = records.map(r => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    });

    const activeTab = this.activeChartTab;

    if (activeTab === 'climate') {
      const temps = records.map(r => {
        if (r.temperature == null) return null;
        return this.isFahrenheit ? +(r.temperature * 9/5 + 32).toFixed(1) : +(r.temperature).toFixed(1);
      });
      const hums = records.map(r => r.humidity != null ? +r.humidity.toFixed(1) : null);

      this.chart.data.labels = labels;
      this.chart.data.datasets = [
        {
          label: `Temperature (${this.isFahrenheit ? '°F' : '°C'})`,
          data: temps,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
          borderWidth: 2.5,
          pointRadius: records.length > 30 ? 0 : 3,
          tension: 0.3,
          fill: true,
          yAxisID: 'yLeft'
        },
        {
          label: 'Humidity (%)',
          data: hums,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderWidth: 2.5,
          pointRadius: records.length > 30 ? 0 : 3,
          tension: 0.3,
          fill: true,
          yAxisID: 'yRight'
        }
      ];

      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.ticks.color = '#f43f5e';
      this.chart.options.scales.yLeft.ticks.callback = (v) => `${v}${this.isFahrenheit ? '°F' : '°C'}`;

      this.chart.options.scales.yRight.display = true;
      this.chart.options.scales.yRight.min = 0;
      this.chart.options.scales.yRight.max = 100;
      this.chart.options.scales.yRight.ticks.color = '#38bdf8';
      this.chart.options.scales.yRight.ticks.callback = (v) => `${v}%`;

    } else if (activeTab === 'gas') {
      const gasLevels = records.map(r => r.isGasAlert ? 1 : 0);

      this.chart.data.labels = labels;
      this.chart.data.datasets = [
        {
          label: 'Gas Safety State (0=Safe, 1=Alert)',
          data: gasLevels,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          stepped: true,
          fill: true,
          yAxisID: 'yLeft'
        }
      ];

      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.ticks.color = '#10b981';
      this.chart.options.scales.yLeft.ticks.callback = (v) => v === 0 ? 'Safe' : 'Alert';
      this.chart.options.scales.yRight.display = false;

    } else if (activeTab === 'rain') {
      const rainLevels = records.map(r => r.isRaining ? 1 : 0);

      this.chart.data.labels = labels;
      this.chart.data.datasets = [
        {
          label: 'Precipitation State (0=Dry, 1=Rain)',
          data: rainLevels,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          stepped: true,
          fill: true,
          yAxisID: 'yLeft'
        }
      ];

      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.ticks.color = '#06b6d4';
      this.chart.options.scales.yLeft.ticks.callback = (v) => v === 0 ? 'Dry' : 'Wet';
      this.chart.options.scales.yRight.display = false;
    }

    this.chart.update('none');
  }

  // =========================================================================
  // 7. CONTROLS, CLOCK & STATUS
  // =========================================================================
  bindControls() {
    // Unit Toggle
    const unitBtn = document.getElementById('tempUnitToggleBtn');
    if (unitBtn) {
      unitBtn.addEventListener('click', () => {
        this.isFahrenheit = !this.isFahrenheit;
        unitBtn.textContent = this.isFahrenheit ? '°F / °C' : '°C / °F';
        
        const lastRec = this.historyBuffer[this.historyBuffer.length - 1];
        if (lastRec) this.renderLiveCards(lastRec);
        this.render12hStats();
        this.update12hChart();
      });
    }

    // Refresh Button
    const refreshBtn = document.getElementById('manualRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const icon = document.getElementById('refreshIcon');
        if (icon) icon.classList.add('animate-spin');
        this.triggerRestFallback().finally(() => {
          setTimeout(() => {
            if (icon) icon.classList.remove('animate-spin');
          }, 600);
        });
      });
    }

    // Graph Tabs
    const btnClimate = document.getElementById('btnTabClimate');
    const btnGas = document.getElementById('btnTabGas');
    const btnRain = document.getElementById('btnTabRain');
    const label = document.getElementById('chartActiveMetricLabel');

    const setTab = (tab) => {
      this.activeChartTab = tab;
      [btnClimate, btnGas, btnRain].forEach(b => {
        if (b) {
          b.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition';
        }
      });

      if (tab === 'climate') {
        if (btnClimate) btnClimate.className = 'px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold transition';
        if (label) label.textContent = 'Temperature & Humidity Trend';
      } else if (tab === 'gas') {
        if (btnGas) btnGas.className = 'px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold transition';
        if (label) label.textContent = 'Gas & Air Safety Timeline';
      } else if (tab === 'rain') {
        if (btnRain) btnRain.className = 'px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold transition';
        if (label) label.textContent = 'Precipitation Detection Timeline';
      }

      this.update12hChart();
    };

    if (btnClimate) btnClimate.addEventListener('click', () => setTab('climate'));
    if (btnGas) btnGas.addEventListener('click', () => setTab('gas'));
    if (btnRain) btnRain.addEventListener('click', () => setTab('rain'));
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    const badge = document.getElementById('connectionBadge');
    const text = document.getElementById('connectionStatusText');
    if (!badge || !text) return;

    if (connected) {
      badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-sm';
      text.textContent = 'Live Connected';
      badge.querySelector('.animate-ping')?.classList.remove('bg-rose-400');
      badge.querySelector('.animate-ping')?.classList.add('bg-emerald-400');
    } else {
      badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold shadow-sm';
      text.textContent = 'Reconnecting...';
      badge.querySelector('.animate-ping')?.classList.remove('bg-emerald-400');
      badge.querySelector('.animate-ping')?.classList.add('bg-rose-400');
    }
  }

  updateLastUpdatedTime(timestamp) {
    const el = document.getElementById('lastUpdatedText');
    if (el) {
      el.textContent = new Date(timestamp).toLocaleTimeString('en-GB');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new MinimalSensorDashboardApp();
  window.sensorDashboardApp = app;
  app.init();
});
