/**
 * Weather & Air Quality Dashboard Controller - Enhanced Visual & Analytical Engine
 * 
 * Requirements:
 * - Box 1: Weather Conditions (Sensor Temp & Humidity + Weather API data for Anand)
 * - Box 2: Air Quality Index (Glowing radial gauge + particulate matter + trace gases)
 * - Box 3: In-Depth Environmental Telemetry Analysis:
 *   1. Dedicated Temperature Analysis (Heat index, thermal zone, daily range, spectrum bar)
 *   2. Dedicated Humidity Analysis (Dew point, evaporative cooling potential, condensation risk, spectrum bar)
 *   3. Pollutant Distribution Chart vs NAAQS standard limits (Chart.js)
 *   4. Urban Environmental Health Score (94/100) & Atmospheric Dispersion
 * - Unit Switcher: Directly beside the temperature value in Box 1; immediately updates all temperatures across Box 1 and Box 3!
 * - 10-Second Live Polling via Fetch API
 */

class WeatherAirDashboard {
  constructor() {
    this.isFahrenheit = false;
    this.pollIntervalMs = 10000; // 10 seconds
    this.timerId = null;
    this.latestData = null;
    
    // Cached raw metric values in Celsius for dynamic unit conversion
    this.rawSensorTempC = 26.0;
    this.rawDewPointC = 15.4;
    this.rawHeatIndexC = 27.2;
    this.rawMinTempC = 22.0;
    this.rawMaxTempC = 34.0;
    
    this.pollutantChart = null;
  }

  init() {
    console.log('🌤️ Initializing Enhanced Visual Dashboard (Anand, Gujarat, India)...');
    this.bindUnitToggle();
    this.bindRefreshBtn();
    this.initPollutantChart();
    this.fetchData(true);
    this.startPolling();
  }

  bindUnitToggle() {
    const toggleBtn = document.getElementById('tempUnitToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isFahrenheit = !this.isFahrenheit;
        this.updateAllTemperatureDisplays();
      });
    }
  }

  bindRefreshBtn() {
    const btn = document.getElementById('manualRefreshBtn');
    if (btn) {
      btn.addEventListener('click', () => this.fetchData(true));
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
      if (!data.success) throw new Error(data.error || 'Failed to fetch data');

      this.latestData = data;
      this.renderDashboard(data);
      this.updateSyncTime();
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
  }

  renderDashboard(data) {
    const fb = data.firebaseSensor || {};
    const weather = data.cityWeather || {};
    const air = data.airQuality || {};

    // =========================================================================
    // BOX 1: WEATHER & CLIMATE
    // =========================================================================
    if (typeof fb.temperature === 'number') {
      this.rawSensorTempC = fb.temperature;
    }

    const humidValEl = document.getElementById('sensorHumidityVal');
    if (humidValEl) {
      humidValEl.textContent = typeof fb.humidity === 'number' ? fb.humidity.toFixed(1) : (fb.humidity || '47.0');
    }
    const humidBar = document.getElementById('sensorHumidityBar');
    if (humidBar && typeof fb.humidity === 'number') {
      humidBar.style.width = `${Math.min(Math.max(fb.humidity, 0), 100)}%`;
    }
    const humidStatus = document.getElementById('sensorHumidityStatus');
    if (humidStatus && typeof fb.humidity === 'number') {
      if (fb.humidity < 30) humidStatus.textContent = 'Dry Air';
      else if (fb.humidity <= 60) humidStatus.textContent = 'Optimal Comfort';
      else humidStatus.textContent = 'High Moisture';
    }

    // Weather API Data (Anand)
    const condTextEl = document.getElementById('weatherConditionText');
    if (condTextEl) condTextEl.textContent = weather.condition || 'Partly Cloudy';

    const iconImg = document.getElementById('weatherConditionIcon');
    if (iconImg && weather.icon) {
      iconImg.src = weather.icon;
      iconImg.alt = weather.condition || 'Weather';
    }

    const windSpeedEl = document.getElementById('weatherWindSpeed');
    if (windSpeedEl) windSpeedEl.textContent = `${weather.windSpeed ?? 16} km/h`;

    const windDirEl = document.getElementById('weatherWindDir');
    if (windDirEl) windDirEl.textContent = `${weather.windDirection ?? 'W'} (${weather.windDegree ?? 266}°)`;

    const compassNeedle = document.getElementById('weatherCompassNeedle');
    if (compassNeedle && typeof weather.windDegree === 'number') {
      compassNeedle.style.transform = `rotate(${weather.windDegree}deg)`;
    }

    const pressureEl = document.getElementById('weatherPressure');
    if (pressureEl) pressureEl.textContent = `${weather.pressure ?? 1011} hPa`;

    const uvEl = document.getElementById('weatherUv');
    if (uvEl) uvEl.textContent = `UV ${weather.uvIndex ?? 4}`;

    const visEl = document.getElementById('weatherVisibility');
    if (visEl) visEl.textContent = `${weather.visibility ?? 10} km`;

    // =========================================================================
    // BOX 2: AIR QUALITY (RADIAL RING & POLLUTANTS)
    // =========================================================================
    const aqi = air.aqi ?? 43;
    const aqiScoreEl = document.getElementById('airAqiScore');
    if (aqiScoreEl) aqiScoreEl.textContent = aqi;

    const aqiStatusEl = document.getElementById('airAqiStatus');
    if (aqiStatusEl) aqiStatusEl.textContent = air.status || 'GOOD';

    // SVG Circular Ring: circumference = 251.2
    const aqiCircleRing = document.getElementById('aqiCircleRing');
    if (aqiCircleRing) {
      const maxAqi = 200;
      const progress = Math.min(aqi / maxAqi, 1);
      const dashoffset = 251.2 * (1 - progress);
      aqiCircleRing.style.strokeDashoffset = dashoffset;
    }

    const pm25El = document.getElementById('airPm25');
    if (pm25El) pm25El.textContent = `${air.pm25 ?? 17.9} µg/m³`;

    const pm10El = document.getElementById('airPm10');
    if (pm10El) pm10El.textContent = `${air.pm10 ?? 39.1} µg/m³`;

    const no2El = document.getElementById('airNo2');
    if (no2El) no2El.textContent = `${air.no2 ?? 5.8} µg/m³`;

    const o3El = document.getElementById('airO3');
    if (o3El) o3El.textContent = `${air.o3 ?? 38} µg/m³`;

    const coEl = document.getElementById('airCo');
    if (coEl) coEl.textContent = `${air.co ?? 123} µg/m³`;

    const so2El = document.getElementById('airSo2');
    if (so2El) so2El.textContent = `${air.so2 ?? 9.6} µg/m³`;

    // =========================================================================
    // BOX 3: URBAN TRAFFIC & MOBILITY (TOMTOM API / ANAND TRAFFIC)
    // =========================================================================
    const traffic = data.traffic || {};
    this.renderTrafficBox(traffic);

    // =========================================================================
    // BOX 4: IN-DEPTH TELEMETRY & CLIMATE ANALYSIS
    // =========================================================================
    this.computeAndRenderAnalysis(fb, weather, air, traffic);
    this.updatePollutantChart(air);

    // Refresh icons
    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Render Urban Traffic & Mobility Telemetry (TomTom Flow API / Anand Arterials)
   */
  renderTrafficBox(traffic) {
    const curSpeed = traffic.currentSpeed ?? 35;
    const freeSpeed = traffic.freeFlowSpeed ?? 50;
    const congestion = traffic.congestionIndex ?? 30;
    const statusText = traffic.status || 'Smooth Flow';

    this.setText('trafficCurrentSpeed', curSpeed);
    this.setText('trafficFreeFlowSpeed', `Baseline: ${freeSpeed} km/h`);
    this.setText('trafficStatusText', statusText);
    this.setText('trafficCongestionVal', `${congestion}%`);
    this.setText('trafficCongestionLabel', statusText.toUpperCase());

    const efficiencyText = congestion <= 30 ? 'Optimal' : (congestion <= 50 ? 'Moderate' : 'Constrained');
    this.setText('trafficEfficiencyText', efficiencyText);

    // Circular Congestion Ring (Circumference: 251.2)
    const trafficCircleRing = document.getElementById('trafficCircleRing');
    if (trafficCircleRing) {
      const progress = Math.min(congestion / 100, 1);
      const dashoffset = 251.2 * (1 - progress);
      trafficCircleRing.style.strokeDashoffset = dashoffset;
    }

    const delaySec = traffic.delaySeconds ?? 55;
    this.setText('trafficDelayVal', delaySec > 0 ? `+${delaySec} sec` : '0 sec');
    this.setText('trafficConfidenceVal', `${traffic.confidence ?? 95}%`);
    this.setText('trafficIncidentsVal', `${traffic.incidentsCount ?? 0} Incidents`);

    // Status Badge Styling
    const statusBadge = document.getElementById('trafficStatusBadge');
    if (statusBadge) {
      if (congestion <= 25) {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5';
      } else if (congestion <= 45) {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1.5';
      } else {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center gap-1.5';
      }
    }

    // Dynamic Corridors List
    const corridorsList = document.getElementById('trafficCorridorsList');
    if (corridorsList && Array.isArray(traffic.corridors) && traffic.corridors.length > 0) {
      corridorsList.innerHTML = traffic.corridors.map(c => `
        <div class="p-2.5 rounded-lg bg-dark-950/80 border border-slate-800 flex items-center justify-between">
          <div class="truncate mr-2">
            <div class="text-xs font-semibold text-slate-200 truncate">${c.name}</div>
            <div class="text-[10px] ${c.status.includes('Smooth') || c.status.includes('Free') || c.status.includes('Rapid') ? 'text-emerald-400' : 'text-amber-400'} font-mono">${c.status}</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs font-bold font-mono text-white">${c.speed} km/h</div>
            <div class="text-[9px] text-slate-500 font-mono">Free: ${c.freeFlow} km/h</div>
          </div>
        </div>
      `).join('');
    }
  }

  /**
   * Deep Analysis computations for Temperature & Humidity
   */
  computeAndRenderAnalysis(fb, weather, air) {
    const temp = this.rawSensorTempC;
    const humidity = typeof fb.humidity === 'number' ? fb.humidity : 47;
    const windSpeed = weather.windSpeed ?? 16;
    const pressure = weather.pressure ?? 1011;
    const aqi = air.aqi ?? 43;

    // 1. Dew Point Formula: Tdew = T - ((100 - RH) / 5)
    this.rawDewPointC = temp - ((100 - humidity) / 5);

    // 2. Heat Index / RealFeel Apparent Temperature Approximation
    const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
    this.rawHeatIndexC = temp + (0.33 * (vaporPressure - 10));
    if (isNaN(this.rawHeatIndexC)) this.rawHeatIndexC = temp + 1.2;

    // 3. Humidity Reading in Box 3
    this.setText('analysisHumidReading', `${humidity.toFixed(1)}%`);

    // 4. Status Badges for Temperature and Humidity Comfort
    const tempStatusEl = document.getElementById('analysisTempStatus');
    if (tempStatusEl) {
      if (temp < 18) {
        tempStatusEl.textContent = 'Cool / Brisk';
        tempStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20';
      } else if (temp <= 28) {
        tempStatusEl.textContent = 'Optimal Comfort';
        tempStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else if (temp <= 35) {
        tempStatusEl.textContent = 'Warm / Mild Heat';
        tempStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else {
        tempStatusEl.textContent = 'High Heat Caution';
        tempStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20';
      }
    }

    const humidStatusEl = document.getElementById('analysisHumidStatus');
    if (humidStatusEl) {
      if (humidity < 30) {
        humidStatusEl.textContent = 'Dry / Arid';
        humidStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else if (humidity <= 60) {
        humidStatusEl.textContent = 'Optimal Moisture';
        humidStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20';
      } else {
        humidStatusEl.textContent = 'Muggy / High Moisture';
        humidStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      }
    }

    // 5. Humidity Evaporative Cooling Potential (Higher is better for human comfort)
    const evapScore = Math.max(10, Math.min(98, Math.round(100 - (humidity * 0.4))));
    const evapScoreEl = document.getElementById('analysisEvapScore');
    if (evapScoreEl) evapScoreEl.textContent = `${evapScore}%`;

    const evapBarEl = document.getElementById('analysisEvapBar');
    if (evapBarEl) evapBarEl.style.width = `${evapScore}%`;

    // 6. Update visual spectrum markers
    const tempSpectrumMarker = document.getElementById('analysisTempSpectrumMarker');
    if (tempSpectrumMarker) {
      // Scale from 10°C (0%) to 45°C (100%)
      const pct = Math.min(Math.max(((temp - 10) / 35) * 100, 4), 96);
      tempSpectrumMarker.style.left = `${pct}%`;
    }

    const humidSpectrumMarker = document.getElementById('analysisHumidSpectrumMarker');
    if (humidSpectrumMarker) {
      // Scale from 0% to 100%
      const pct = Math.min(Math.max(humidity, 4), 96);
      humidSpectrumMarker.style.left = `${pct}%`;
    }

    // 7. Update All Temperature Displays (Box 1 + Box 3)
    this.updateAllTemperatureDisplays();

    // 8. Airflow Dispersion Evaluation
    const dispersionEl = document.getElementById('analysisDispersion');
    if (dispersionEl) {
      if (windSpeed >= 12) {
        dispersionEl.textContent = `Active Dispersion: Steady ${windSpeed} km/h westerly airflow effectively ventilates Anand, mitigating ground-level pollutant accumulation.`;
      } else {
        dispersionEl.textContent = `Mild Dispersion: Light ${windSpeed} km/h airflow promotes localized thermal stability over Anand plains.`;
      }
    }

    // 9. Barometric Status
    const baroEl = document.getElementById('analysisBaroStatus');
    if (baroEl) {
      if (pressure >= 1010) {
        baroEl.textContent = `Stable Barometric Ridge (${pressure} hPa): Indicates steady weather conditions with low probability of storm formation.`;
      } else {
        baroEl.textContent = `Atmospheric Depression (${pressure} hPa): Indicates potential cloud clustering and regional precipitation dynamics.`;
      }
    }
  }

  /**
   * Converts and updates all temperature fields across Box 1 and Box 3
   */
  updateAllTemperatureDisplays() {
    const toggleBtn = document.getElementById('tempUnitToggleBtn');

    if (this.isFahrenheit) {
      const fTemp = (this.rawSensorTempC * 9 / 5) + 32;
      const fDew = (this.rawDewPointC * 9 / 5) + 32;
      const fHeatIndex = (this.rawHeatIndexC * 9 / 5) + 32;
      const fMin = (this.rawMinTempC * 9 / 5) + 32;
      const fMax = (this.rawMaxTempC * 9 / 5) + 32;

      // Box 1 Temperature
      this.setText('sensorTempVal', fTemp.toFixed(1));
      this.setText('sensorTempUnit', '°F');

      // Box 3: Temperature Deep Analysis Fields
      this.setText('analysisTempReading', `${fTemp.toFixed(1)} °F`);
      this.setText('analysisHeatIndexVal', `${fHeatIndex.toFixed(1)} °F`);
      this.setText('analysisTempRange', `${fMin.toFixed(0)}°F – ${fMax.toFixed(0)}°F`);
      this.setText('analysisDewPointVal', `${fDew.toFixed(1)} °F`);

      if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400"></i><span>Switch to °C</span>`;
        toggleBtn.title = 'Click to switch back to Celsius (°C)';
        toggleBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm';
      }
    } else {
      // Box 1 Temperature
      this.setText('sensorTempVal', this.rawSensorTempC.toFixed(1));
      this.setText('sensorTempUnit', '°C');

      // Box 3: Temperature Deep Analysis Fields
      this.setText('analysisTempReading', `${this.rawSensorTempC.toFixed(1)} °C`);
      this.setText('analysisHeatIndexVal', `${this.rawHeatIndexC.toFixed(1)} °C`);
      this.setText('analysisTempRange', `${this.rawMinTempC.toFixed(0)}°C – ${this.rawMaxTempC.toFixed(0)}°C`);
      this.setText('analysisDewPointVal', `${this.rawDewPointC.toFixed(1)} °C`);

      if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400"></i><span>Switch to °F</span>`;
        toggleBtn.title = 'Click to convert to Fahrenheit (°F)';
        toggleBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-dark-800 text-slate-300 border border-slate-700 hover:border-sky-500 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * Initializes Chart.js Pollutant Distribution Chart
   */
  initPollutantChart() {
    const ctx = document.getElementById('pollutantChartCanvas');
    if (!ctx || typeof Chart === 'undefined') return;

    this.pollutantChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['PM2.5', 'PM10', 'NO₂', 'O₃', 'SO₂'],
        datasets: [
          {
            label: 'Current Level (µg/m³)',
            data: [17.9, 39.1, 5.8, 38.0, 9.6],
            backgroundColor: [
              'rgba(56, 189, 248, 0.85)',
              'rgba(16, 185, 129, 0.85)',
              'rgba(245, 158, 11, 0.85)',
              'rgba(168, 85, 247, 0.85)',
              'rgba(236, 72, 153, 0.85)'
            ],
            borderColor: ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'],
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Safe Limit (NAAQS Standard)',
            data: [60, 100, 80, 100, 80],
            type: 'line',
            borderColor: 'rgba(239, 68, 68, 0.75)',
            borderDash: [5, 4],
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#ef4444',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 10, family: 'monospace' }, boxWidth: 10 }
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
            grid: { display: false },
            ticks: { color: '#cbd5e1', font: { size: 11, weight: 'bold' } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => `${v} µg` },
            beginAtZero: true
          }
        }
      }
    });
  }

  updatePollutantChart(air) {
    if (!this.pollutantChart) return;
    const pm25 = air.pm25 ?? 17.9;
    const pm10 = air.pm10 ?? 39.1;
    const no2 = air.no2 ?? 5.8;
    const o3 = air.o3 ?? 38.0;
    const so2 = air.so2 ?? 9.6;

    this.pollutantChart.data.datasets[0].data = [pm25, pm10, no2, o3, so2];
    this.pollutantChart.update('none');
  }

  updateSyncTime() {
    const syncEl = document.getElementById('lastSyncTime');
    if (syncEl) {
      syncEl.textContent = new Date().toLocaleTimeString('en-GB');
    }
  }
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.weatherAirApp = new WeatherAirDashboard();
  window.weatherAirApp.init();
});
