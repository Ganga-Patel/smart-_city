/**
 * Smart City Weather Dashboard - Frontend Live Polling & UI Engine
 * 
 * Strict Requirement Fulfillment:
 * - Prominently displays dual-source values at the VERY TOP of the dashboard.
 * - Live periodic polling every 10 seconds via Fetch/AJAX without reloading.
 * - Temperature & Humidity exclusively from weather.txt.
 * - Wind Speed, Wind Direction, Air Pressure from live Weather API.
 * - Dynamic fallback indicator for Anand -> Vadodara.
 */

class WeatherDashboardController {
  constructor() {
    this.pollIntervalSeconds = 10;
    this.countdown = this.pollIntervalSeconds;
    this.timerId = null;
    this.countdownId = null;
    this.isFahrenheit = false;
    this.lastData = null;
    this.isSimulatingFallback = false;
  }

  init() {
    console.log('🌤️ Initializing Smart City Weather Controller...');
    this.bindEvents();
    this.fetchWeatherData(true); // Initial fetch
    this.startLivePolling();
  }

  bindEvents() {
    // Manual Force Refresh button
    const refreshBtn = document.getElementById('weatherRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchWeatherData(true);
        this.resetCountdown();
      });
    }

    // Toggle Fallback Simulation Button
    const fallbackToggleBtn = document.getElementById('weatherFallbackToggleBtn');
    if (fallbackToggleBtn) {
      fallbackToggleBtn.addEventListener('click', () => this.toggleFallbackSimulation());
    }

    // Quick Edit weather.txt modal triggers
    const editFileBtn = document.getElementById('weatherEditFileBtn');
    const modal = document.getElementById('weatherFileModal');
    const closeModalBtn = document.getElementById('weatherCloseModalBtn');
    const cancelModalBtn = document.getElementById('weatherCancelModalBtn');
    const fileForm = document.getElementById('weatherFileForm');

    if (editFileBtn && modal) {
      editFileBtn.addEventListener('click', () => {
        this.openFileEditorModal();
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (cancelModalBtn && modal) {
      cancelModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (fileForm) {
      fileForm.addEventListener('submit', (e) => this.handleFileFormSubmit(e));
    }

    // Unit toggle for Weather Top section
    const unitToggle = document.getElementById('weatherTempUnitBtn');
    if (unitToggle) {
      unitToggle.addEventListener('click', () => {
        this.isFahrenheit = !this.isFahrenheit;
        unitToggle.textContent = this.isFahrenheit ? '°F' : '°C';
        if (this.lastData) {
          this.updateTemperatureDisplay(this.lastData.dashboard.temperature);
        }
      });
    }
  }

  startLivePolling() {
    // 10-second recurring fetch interval
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.fetchWeatherData(false);
      this.resetCountdown();
    }, this.pollIntervalSeconds * 1000);

    // 1-second countdown display updater
    if (this.countdownId) clearInterval(this.countdownId);
    this.countdown = this.pollIntervalSeconds;
    this.countdownId = setInterval(() => {
      this.countdown--;
      if (this.countdown < 0) this.countdown = this.pollIntervalSeconds;
      const cdEl = document.getElementById('weatherCountdownText');
      if (cdEl) {
        cdEl.textContent = `${this.countdown}s`;
      }
      const progressBar = document.getElementById('weatherCountdownProgress');
      if (progressBar) {
        const pct = ((this.pollIntervalSeconds - this.countdown) / this.pollIntervalSeconds) * 100;
        progressBar.style.width = `${pct}%`;
      }
    }, 1000);
  }

  resetCountdown() {
    this.countdown = this.pollIntervalSeconds;
    const cdEl = document.getElementById('weatherCountdownText');
    if (cdEl) cdEl.textContent = `${this.countdown}s`;
    const progressBar = document.getElementById('weatherCountdownProgress');
    if (progressBar) progressBar.style.width = '0%';
  }

  /**
   * Fetch live weather data using modern Fetch API
   */
  async fetchWeatherData(forceBypass = false) {
    const pulseDot = document.getElementById('weatherLivePulse');
    if (pulseDot) pulseDot.classList.add('animate-spin');

    try {
      const url = forceBypass ? '/api/weather?force=true' : '/api/weather';
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }

      this.lastData = data;
      this.renderDashboard(data);
    } catch (err) {
      console.error('Weather update error:', err);
      this.renderErrorState(err.message);
    } finally {
      if (pulseDot) pulseDot.classList.remove('animate-spin');
    }
  }

  /**
   * Render metrics prominently into the Top Section DOM
   */
  renderDashboard(data) {
    const d = data.dashboard;
    const sources = data.sources;

    // 1. Location & Station Badges
    const locNameEl = document.getElementById('weatherLocationName');
    if (locNameEl) locNameEl.textContent = `${d.location}, ${d.region || 'Gujarat'}`;

    const stationIdEl = document.getElementById('weatherStationId');
    if (stationIdEl) stationIdEl.textContent = data.station?.id || 'VVN-SmartCity-Node01';

    // 2. Fallback Alert Banner
    const fallbackBanner = document.getElementById('weatherFallbackBanner');
    const fallbackToggleBtn = document.getElementById('weatherFallbackToggleBtn');
    const locationPill = document.getElementById('weatherLocationPill');

    if (d.isFallback) {
      if (fallbackBanner) {
        fallbackBanner.classList.remove('hidden');
        document.getElementById('weatherFallbackReason').textContent =
          `Primary station 'Anand, Gujarat' unavailable. Fallback active: Displaying Live API data for Vadodara, Gujarat.`;
      }
      if (locationPill) {
        locationPill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse';
        locationPill.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5"></i><span>Fallback: ${d.location}</span>`;
      }
      if (fallbackToggleBtn) {
        fallbackToggleBtn.classList.replace('bg-dark-800', 'bg-amber-600/30');
        fallbackToggleBtn.classList.replace('text-slate-300', 'text-amber-300');
        fallbackToggleBtn.innerHTML = `<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i><span>Restore Anand</span>`;
      }
    } else {
      if (fallbackBanner) fallbackBanner.classList.add('hidden');
      if (locationPill) {
        locationPill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
        locationPill.innerHTML = `<i data-lucide="map-pin" class="w-3.5 h-3.5"></i><span>Primary: ${d.location}</span>`;
      }
      if (fallbackToggleBtn) {
        fallbackToggleBtn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition';
        fallbackToggleBtn.innerHTML = `<i data-lucide="shield-alert" class="w-3.5 h-3.5 text-amber-400"></i><span>Simulate Vadodara Fallback</span>`;
      }
    }

    // =========================================================================
    // STRICT RULE: METRIC 1: TEMPERATURE (EXCLUSIVELY FROM weather.txt)
    // =========================================================================
    this.updateTemperatureDisplay(d.temperature);
    const tempFileMod = document.getElementById('weatherTempFileMod');
    if (tempFileMod && sources.file?.lastModified) {
      const fileDate = new Date(sources.file.lastModified);
      tempFileMod.textContent = `File synced: ${fileDate.toLocaleTimeString('en-GB')}`;
    }

    // =========================================================================
    // STRICT RULE: METRIC 2: HUMIDITY (EXCLUSIVELY FROM weather.txt)
    // =========================================================================
    const humidValEl = document.getElementById('weatherHumidityValue');
    if (humidValEl) humidValEl.textContent = d.humidity.toFixed(1);

    const humidBar = document.getElementById('weatherHumidityBar');
    if (humidBar) humidBar.style.width = `${Math.min(Math.max(d.humidity, 0), 100)}%`;

    const humidPill = document.getElementById('weatherHumidityPill');
    if (humidPill) {
      if (d.humidity < 30) {
        humidPill.textContent = 'Dry';
        humidPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else if (d.humidity <= 65) {
        humidPill.textContent = 'Optimal Comfort';
        humidPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else {
        humidPill.textContent = 'High Humidity';
        humidPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
      }
    }

    // =========================================================================
    // API METRIC 3: WIND SPEED (FROM WEATHERSTACK API)
    // =========================================================================
    const windSpeedEl = document.getElementById('weatherWindSpeedValue');
    if (windSpeedEl) windSpeedEl.textContent = d.windSpeed;

    const windBar = document.getElementById('weatherWindSpeedBar');
    if (windBar) {
      // Scale 0-60 km/h
      const pct = Math.min((d.windSpeed / 60) * 100, 100);
      windBar.style.width = `${pct}%`;
    }

    const windBeaufortEl = document.getElementById('weatherWindBeaufort');
    if (windBeaufortEl) {
      if (d.windSpeed < 6) windBeaufortEl.textContent = 'Light Air (Force 1)';
      else if (d.windSpeed < 12) windBeaufortEl.textContent = 'Light Breeze (Force 2)';
      else if (d.windSpeed < 20) windBeaufortEl.textContent = 'Gentle Breeze (Force 3)';
      else if (d.windSpeed < 29) windBeaufortEl.textContent = 'Moderate Breeze (Force 4)';
      else windBeaufortEl.textContent = 'Fresh/Strong (Force 5+)';
    }

    // =========================================================================
    // API METRIC 4: WIND DIRECTION (FROM WEATHERSTACK API)
    // =========================================================================
    const windDirEl = document.getElementById('weatherWindDirValue');
    if (windDirEl) windDirEl.textContent = d.windDirection;

    const windDegreeEl = document.getElementById('weatherWindDegreeValue');
    if (windDegreeEl) windDegreeEl.textContent = `${d.windDegree}°`;

    const windCompassNeedle = document.getElementById('weatherCompassNeedle');
    if (windCompassNeedle) {
      windCompassNeedle.style.transform = `rotate(${d.windDegree}deg)`;
    }

    // =========================================================================
    // API METRIC 5: AIR PRESSURE (FROM WEATHERSTACK API)
    // =========================================================================
    const pressureEl = document.getElementById('weatherPressureValue');
    if (pressureEl) pressureEl.textContent = d.pressure;

    const pressureStatusEl = document.getElementById('weatherPressureStatus');
    if (pressureStatusEl) {
      if (d.pressure > 1013) pressureStatusEl.textContent = 'High Pressure (Stable)';
      else if (d.pressure >= 1005) pressureStatusEl.textContent = 'Normal Atmospheric (Stable)';
      else pressureStatusEl.textContent = 'Low Pressure (Depression)';
    }

    const weatherDescEl = document.getElementById('weatherConditionDesc');
    if (weatherDescEl) {
      weatherDescEl.textContent = d.weatherDescription || 'Atmosphere Clear';
    }

    // 6. Last Synchronized Timestamp
    const lastSyncEl = document.getElementById('weatherLastSyncText');
    if (lastSyncEl) {
      const now = new Date();
      lastSyncEl.textContent = `Sync: ${now.toLocaleTimeString('en-GB')}`;
    }

    // 7. Strict Rule Compliance Pill
    const strictBadge = document.getElementById('weatherStrictBadge');
    if (strictBadge) {
      strictBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      strictBadge.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Strict Dual-Source Rule Active</span>`;
    }

    // Re-initialize any Lucide icons rendered dynamically
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateTemperatureDisplay(celsiusValue) {
    const tempValEl = document.getElementById('weatherTempValue');
    const tempUnitEl = document.getElementById('weatherTempUnitLabel');
    if (!tempValEl) return;

    if (this.isFahrenheit) {
      const fVal = (celsiusValue * 9/5) + 32;
      tempValEl.textContent = fVal.toFixed(1);
      if (tempUnitEl) tempUnitEl.textContent = '°F';
    } else {
      tempValEl.textContent = celsiusValue.toFixed(1);
      if (tempUnitEl) tempUnitEl.textContent = '°C';
    }

    const tempPill = document.getElementById('weatherTempPill');
    if (tempPill) {
      if (celsiusValue > 35) {
        tempPill.textContent = 'High Heat';
        tempPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
      } else if (celsiusValue < 18) {
        tempPill.textContent = 'Cool';
        tempPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
      } else {
        tempPill.textContent = 'Optimal Range';
        tempPill.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    }
  }

  renderErrorState(message) {
    const banner = document.getElementById('weatherFallbackBanner');
    if (banner) {
      banner.classList.remove('hidden');
      document.getElementById('weatherFallbackReason').textContent = `Sync issue: ${message}`;
    }
  }

  /**
   * Toggle simulated failure of Anand to test Vadodara fallback
   */
  async toggleFallbackSimulation() {
    try {
      const res = await fetch('/api/weather/toggle-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      this.isSimulatingFallback = data.simulation?.simulatePrimaryFailure;
      // Immediately fetch fresh data to show fallback in action
      await this.fetchWeatherData(true);
      this.resetCountdown();
    } catch (err) {
      alert(`Failed to toggle fallback simulator: ${err.message}`);
    }
  }

  /**
   * Open the quick editor modal for weather.txt
   */
  async openFileEditorModal() {
    const modal = document.getElementById('weatherFileModal');
    const tempInput = document.getElementById('modalTempInput');
    const humidInput = document.getElementById('modalHumidInput');
    const rawPre = document.getElementById('modalRawPreview');

    if (!modal) return;

    try {
      const res = await fetch('/api/weather/file');
      const data = await res.json();

      if (tempInput) tempInput.value = data.temperature ?? 29.4;
      if (humidInput) humidInput.value = data.humidity ?? 62.0;
      if (rawPre) rawPre.textContent = data.raw || 'Loading...';

      modal.classList.remove('hidden');
    } catch (err) {
      alert(`Could not read weather.txt: ${err.message}`);
    }
  }

  /**
   * Save changes to weather.txt via POST /api/weather/file
   */
  async handleFileFormSubmit(e) {
    e.preventDefault();
    const tempInput = document.getElementById('modalTempInput');
    const humidInput = document.getElementById('modalHumidInput');
    const modal = document.getElementById('weatherFileModal');

    const temperature = parseFloat(tempInput.value);
    const humidity = parseFloat(humidInput.value);

    if (isNaN(temperature) || isNaN(humidity)) {
      alert('Please enter valid numbers for Temperature and Humidity.');
      return;
    }

    try {
      const res = await fetch('/api/weather/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, humidity })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      if (modal) modal.classList.add('hidden');

      // Fetch immediately to show the live update without reloading!
      await this.fetchWeatherData(true);
      this.resetCountdown();
    } catch (err) {
      alert(`Failed to update weather.txt: ${err.message}`);
    }
  }
}

// Instantiate and expose globally
export const weatherController = new WeatherDashboardController();

if (typeof window !== 'undefined') {
  window.weatherController = weatherController;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => weatherController.init());
  } else {
    weatherController.init();
  }
}
