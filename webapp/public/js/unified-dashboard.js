/**
 * Smart City Unified Dashboard Controller
 * 
 * Clean, modern orchestrator fulfilling:
 * 1. Real-time Firebase Sensor Telemetry (Temperature & Humidity)
 * 2. Weather & Air Quality data for Anand, Gujarat, India ONLY
 * 3. Single unified, clean dashboard without API clutter or technical metadata
 * 4. Comprehensive Temperature Unit conversion (°C <-> °F) with dynamic symbol updates
 * 5. Automatic live periodic polling without page reload
 */

class SmartCityDashboard {
  constructor() {
    this.unit = localStorage.getItem('smartcity_temp_unit') || 'C'; // 'C' or 'F'
    this.pollIntervalMs = 10000; // 10 seconds
    this.timerId = null;
    this.chart = null;
    this.historyData = {
      labels: [],
      sensorTemp: [],
      cityTemp: [],
      sensorHumidity: [],
      aqi: []
    };
    this.latestData = null;
  }

  init() {
    console.log('🏙️ Initializing Smart City Unified Dashboard for Anand, Gujarat, India...');
    this.setupUnitToggle();
    this.setupRefreshButton();
    this.initChart();
    this.fetchData();
    this.startPolling();
  }

  /**
   * Temperature conversion utility:
   * Celsius <-> Fahrenheit
   */
  convertTemp(celsius) {
    if (typeof celsius !== 'number' || isNaN(celsius)) {
      return { val: '--', unit: `°${this.unit}` };
    }
    if (this.unit === 'F') {
      const f = (celsius * 9 / 5) + 32;
      return { val: f.toFixed(1), unit: '°F' };
    }
    return { val: celsius.toFixed(1), unit: '°C' };
  }

  setupUnitToggle() {
    const btnC = document.getElementById('unitToggleC');
    const btnF = document.getElementById('unitToggleF');

    this.updateUnitButtonsUI();

    if (btnC) {
      btnC.addEventListener('click', () => {
        if (this.unit !== 'C') {
          this.unit = 'C';
          localStorage.setItem('smartcity_temp_unit', 'C');
          this.updateUnitButtonsUI();
          this.renderAllTemperatures();
          this.updateChartData();
        }
      });
    }

    if (btnF) {
      btnF.addEventListener('click', () => {
        if (this.unit !== 'F') {
          this.unit = 'F';
          localStorage.setItem('smartcity_temp_unit', 'F');
          this.updateUnitButtonsUI();
          this.renderAllTemperatures();
          this.updateChartData();
        }
      });
    }
  }

  updateUnitButtonsUI() {
    const btnC = document.getElementById('unitToggleC');
    const btnF = document.getElementById('unitToggleF');

    if (btnC && btnF) {
      if (this.unit === 'C') {
        btnC.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-sky-500 text-white shadow-md shadow-sky-500/20 transition cursor-pointer';
        btnF.className = 'px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer';
      } else {
        btnF.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-sky-500 text-white shadow-md shadow-sky-500/20 transition cursor-pointer';
        btnC.className = 'px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer';
      }
    }
  }

  setupRefreshButton() {
    const refreshBtn = document.getElementById('manualRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchData(true);
      });
    }
  }

  startPolling() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.fetchData(false);
    }, this.pollIntervalMs);
  }

  async fetchData(isManual = false) {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon && isManual) refreshIcon.classList.add('animate-spin');

    try {
      const res = await fetch('/api/dashboard-data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load telemetry');

      this.latestData = data;
      this.renderDashboard(data);
      this.recordHistory(data);
      this.updateLastSyncText();
    } catch (err) {
      console.error('Error fetching unified dashboard data:', err);
    } finally {
      if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
  }

  renderDashboard(data) {
    const fb = data.firebaseSensor || {};
    const weather = data.cityWeather || {};
    const air = data.airQuality || {};

    // 1. Render all Temperature Displays
    this.renderAllTemperatures();

    // 2. Render Firebase Humidity
    const fbHumidEl = document.getElementById('sensorHumidityVal');
    if (fbHumidEl) fbHumidEl.textContent = typeof fb.humidity === 'number' ? fb.humidity.toFixed(1) : fb.humidity;

    const fbHumidBar = document.getElementById('sensorHumidityBar');
    if (fbHumidBar) fbHumidBar.style.width = `${Math.min(Math.max(fb.humidity || 0, 0), 100)}%`;

    const fbHumidPill = document.getElementById('sensorHumidityPill');
    if (fbHumidPill) {
      const h = fb.humidity || 0;
      if (h < 30) {
        fbHumidPill.textContent = 'Dry';
        fbHumidPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else if (h <= 60) {
        fbHumidPill.textContent = 'Optimal Comfort';
        fbHumidPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else {
        fbHumidPill.textContent = 'High Humidity';
        fbHumidPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
      }
    }

    // 3. Render Firebase Rain Status
    const rainStatusEl = document.getElementById('sensorRainStatus');
    const rainIconEl = document.getElementById('sensorRainIcon');
    const rainPillEl = document.getElementById('sensorRainPill');
    if (rainStatusEl && rainIconEl) {
      if (fb.rain?.isRaining) {
        rainStatusEl.textContent = 'Precipitation Active';
        rainIconEl.className = 'w-6 h-6 text-sky-400 animate-bounce';
        if (rainPillEl) {
          rainPillEl.textContent = 'Rain Detected';
          rainPillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
        }
      } else {
        rainStatusEl.textContent = 'Clear & Dry';
        rainIconEl.className = 'w-6 h-6 text-amber-400';
        if (rainPillEl) {
          rainPillEl.textContent = 'Dry Ground';
          rainPillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }
      }
    }

    // 4. Render Firebase Gas/Air Safety (MQ2)
    const gasStatusEl = document.getElementById('sensorGasStatus');
    const gasPillEl = document.getElementById('sensorGasPill');
    if (gasStatusEl) {
      if (fb.gas?.isAlert) {
        gasStatusEl.textContent = 'Gas Concentration Detected';
        if (gasPillEl) {
          gasPillEl.textContent = 'Alert';
          gasPillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
        }
      } else {
        gasStatusEl.textContent = 'Safe & Clear';
        if (gasPillEl) {
          gasPillEl.textContent = 'Normal';
          gasPillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }
      }
    }

    // 5. Render Anand Weather Conditions
    const weatherCondEl = document.getElementById('cityWeatherCondition');
    if (weatherCondEl) weatherCondEl.textContent = weather.condition || 'Clear';

    const weatherIconImg = document.getElementById('cityWeatherIcon');
    if (weatherIconImg && weather.icon) {
      weatherIconImg.src = weather.icon;
      weatherIconImg.alt = weather.condition || 'Weather';
    }

    const windSpeedEl = document.getElementById('cityWindSpeed');
    if (windSpeedEl) windSpeedEl.textContent = `${weather.windSpeed} km/h`;

    const windDirEl = document.getElementById('cityWindDirection');
    if (windDirEl) windDirEl.textContent = `${weather.windDirection} (${weather.windDegree}°)`;

    const compassNeedle = document.getElementById('cityCompassNeedle');
    if (compassNeedle && typeof weather.windDegree === 'number') {
      compassNeedle.style.transform = `rotate(${weather.windDegree}deg)`;
    }

    const pressureEl = document.getElementById('cityPressure');
    if (pressureEl) pressureEl.textContent = `${weather.pressure} hPa`;

    const cityHumidEl = document.getElementById('cityHumidity');
    if (cityHumidEl) cityHumidEl.textContent = `${weather.humidity}%`;

    const uvEl = document.getElementById('cityUvIndex');
    if (uvEl) uvEl.textContent = `UV ${weather.uvIndex}`;

    const visEl = document.getElementById('cityVisibility');
    if (visEl) visEl.textContent = `${weather.visibility} km`;

    // 6. Render Anand Air Quality Index
    const aqiScoreEl = document.getElementById('airAqiScore');
    if (aqiScoreEl) aqiScoreEl.textContent = air.aqi;

    const aqiStatusEl = document.getElementById('airAqiStatus');
    if (aqiStatusEl) aqiStatusEl.textContent = air.status;

    const aqiPillEl = document.getElementById('airAqiPill');
    if (aqiPillEl) {
      if (air.aqi <= 50) {
        aqiPillEl.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else if (air.aqi <= 100) {
        aqiPillEl.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      } else {
        aqiPillEl.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
      }
      aqiPillEl.textContent = air.status;
    }

    const aqiBar = document.getElementById('airAqiBar');
    if (aqiBar) {
      const pct = Math.min((air.aqi / 300) * 100, 100);
      aqiBar.style.width = `${pct}%`;
    }

    const pm25El = document.getElementById('airPm25');
    if (pm25El) pm25El.textContent = `${air.pm25} µg/m³`;

    const pm10El = document.getElementById('airPm10');
    if (pm10El) pm10El.textContent = `${air.pm10} µg/m³`;

    const no2El = document.getElementById('airNo2');
    if (no2El) no2El.textContent = `${air.no2} µg/m³`;

    const o3El = document.getElementById('airO3');
    if (o3El) o3El.textContent = `${air.o3} µg/m³`;

    const coEl = document.getElementById('airCo');
    if (coEl) coEl.textContent = `${air.co} µg/m³`;

    const so2El = document.getElementById('airSo2');
    if (so2El) so2El.textContent = `${air.so2} µg/m³`;

    // Re-initialize Lucide Icons if dynamically swapped
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Re-renders every single temperature display on the dashboard
   * converting value and symbol according to this.unit (°C / °F)
   */
  renderAllTemperatures() {
    if (!this.latestData) return;

    const fb = this.latestData.firebaseSensor || {};
    const weather = this.latestData.cityWeather || {};

    // 1. Firebase Sensor Temperature
    const fbConv = this.convertTemp(fb.temperature);
    const fbTempEl = document.getElementById('sensorTempVal');
    const fbTempUnitEl = document.getElementById('sensorTempUnit');
    if (fbTempEl) fbTempEl.textContent = fbConv.val;
    if (fbTempUnitEl) fbTempUnitEl.textContent = fbConv.unit;

    // 2. City Weather Temperature (Anand)
    const cityConv = this.convertTemp(weather.temperature);
    const cityTempEl = document.getElementById('cityTempVal');
    const cityTempUnitEl = document.getElementById('cityTempUnit');
    if (cityTempEl) cityTempEl.textContent = cityConv.val;
    if (cityTempUnitEl) cityTempUnitEl.textContent = cityConv.unit;

    // 3. City Feels Like Temperature
    const feelsConv = this.convertTemp(weather.feelsLike);
    const feelsEl = document.getElementById('cityFeelsLike');
    if (feelsEl) feelsEl.textContent = `Feels like: ${feelsConv.val} ${feelsConv.unit}`;

    // 4. Comparison Table values
    const tableSensorTemp = document.getElementById('tableSensorTemp');
    if (tableSensorTemp) tableSensorTemp.textContent = `${fbConv.val} ${fbConv.unit}`;

    const tableCityTemp = document.getElementById('tableCityTemp');
    if (tableCityTemp) tableCityTemp.textContent = `${cityConv.val} ${cityConv.unit}`;
  }

  updateLastSyncText() {
    const syncEl = document.getElementById('lastSyncTime');
    if (syncEl) {
      const d = new Date();
      syncEl.textContent = d.toLocaleTimeString('en-GB');
    }
  }

  recordHistory(data) {
    const timeLabel = new Date().toLocaleTimeString('en-GB', { minute: '2-digit', second: '2-digit' });
    const fbTemp = data.firebaseSensor?.temperature ?? 26;
    const cityTemp = data.cityWeather?.temperature ?? 30;
    const fbHumid = data.firebaseSensor?.humidity ?? 47;
    const aqi = data.airQuality?.aqi ?? 43;

    this.historyData.labels.push(timeLabel);
    this.historyData.sensorTemp.push(fbTemp);
    this.historyData.cityTemp.push(cityTemp);
    this.historyData.sensorHumidity.push(fbHumid);
    this.historyData.aqi.push(aqi);

    // Keep last 12 points
    if (this.historyData.labels.length > 12) {
      this.historyData.labels.shift();
      this.historyData.sensorTemp.shift();
      this.historyData.cityTemp.shift();
      this.historyData.sensorHumidity.shift();
      this.historyData.aqi.shift();
    }

    this.updateChartData();
  }

  initChart() {
    const ctx = document.getElementById('environmentalTrendsChart');
    if (!ctx || typeof Chart === 'undefined') return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: `Sensor Temp (${this.unit === 'F' ? '°F' : '°C'})`,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            data: []
          },
          {
            label: `City Temp (${this.unit === 'F' ? '°F' : '°C'})`,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            fill: false,
            data: []
          },
          {
            label: 'Sensor Humidity (%)',
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.35,
            yAxisID: 'y1',
            data: []
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 11, family: 'monospace' },
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (val) => `${val}°${this.unit}`
            }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#10b981',
              font: { size: 10 },
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  updateChartData() {
    if (!this.chart) return;

    this.chart.data.labels = [...this.historyData.labels];

    // Dataset 0: Sensor Temp (converted to active unit)
    this.chart.data.datasets[0].label = `Sensor Temp (°${this.unit})`;
    this.chart.data.datasets[0].data = this.historyData.sensorTemp.map(c => {
      return this.unit === 'F' ? parseFloat(((c * 9 / 5) + 32).toFixed(1)) : c;
    });

    // Dataset 1: City Temp (converted to active unit)
    this.chart.data.datasets[1].label = `City Temp (°${this.unit})`;
    this.chart.data.datasets[1].data = this.historyData.cityTemp.map(c => {
      return this.unit === 'F' ? parseFloat(((c * 9 / 5) + 32).toFixed(1)) : c;
    });

    // Dataset 2: Humidity (%)
    this.chart.data.datasets[2].data = [...this.historyData.sensorHumidity];

    // Update Y axis tick formatting
    if (this.chart.options.scales.y) {
      this.chart.options.scales.y.ticks.callback = (val) => `${val}°${this.unit}`;
    }

    this.chart.update('none'); // Update without full redraw animation
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new SmartCityDashboard();
  window.dashboardApp.init();
});
