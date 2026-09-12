/**
 * Weather & Air Quality Dashboard Controller - Enhanced Visual & Analytical Engine
 */

import { SmartCityMapManager } from './map/map-manager.js';
import { SmartCityMapState } from './map/map-state.js';
import { SmartCityMapSearch } from './map/map-search.js';
import { SmartCityMapLayers } from './map/map-layers.js';

class WeatherAirDashboard {
  constructor() {
    this.isFahrenheit = false;
    this.pollIntervalMs = 10000; // 10 seconds
    this.timerId = null;
    this.latestData = null;
    this.mapManager = null;
    this.mapState = new SmartCityMapState();
    this.mapSearch = null;
    this.mapLayers = null;
    this.currentLocation = null;
    this.STORAGE_KEY_LOCATION = 'smartcity_active_location';
    
    // Cached raw API metric values in Celsius for dynamic unit conversion
    // Temperature and humidity are taken strictly from Weather API (not from sensor)
    this.rawApiTempC = 28.2;
    this.rawApiHumidity = 68.0;
    this.rawDewPointC = 21.8;
    this.rawHeatIndexC = 31.3;
    this.rawMinTempC = 24.0;
    this.rawMaxTempC = 33.0;
    
    this.pollutantChart = null;
  }

  async init() {
    console.log('🌤️ Initializing Global Responsive Telemetry Dashboard...');
    window.weatherAirApp = this;
    this.bindUnitToggle();
    this.bindRefreshBtn();
    this.bindNearestLocationBtn();
    this.initPollutantChart();
    this.initMap();

    // Check for saved location or automatically detect nearest location
    const saved = this.loadSavedLocation();
    if (saved) {
      await this.selectLocation(saved);
    } else {
      this.detectAndApplyNearestLocation();
    }

    this.startPolling();
  }

  initMap() {
    try {
      this.mapManager = new SmartCityMapManager();
      this.mapManager.initMap('urbanMapCanvas');

      // 1. Center on Active Location button handler
      const resetBtn = document.getElementById('mapResetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (this.currentLocation && this.mapManager) {
            this.mapManager.flyTo(this.currentLocation.lon, this.currentLocation.lat, 13.5);
          } else if (this.mapManager) {
            this.mapManager.resetToAnand();
          }
        });
      }

      // 2. Fullscreen toggle handler
      const fullscreenBtn = document.getElementById('mapFullscreenBtn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          if (this.mapManager) {
            const section = document.getElementById('urbanMapSection');
            this.mapManager.toggleFullscreen(section);
          }
        });

        document.addEventListener('fullscreenchange', () => {
          const isFs = Boolean(document.fullscreenElement);
          const icon = document.getElementById('mapFullscreenIcon');
          const text = document.getElementById('mapFullscreenText');
          if (icon) {
            icon.setAttribute('data-lucide', isFs ? 'minimize' : 'maximize');
          }
          if (text) {
            text.textContent = isFs ? 'Exit Fullscreen' : 'Fullscreen';
          }
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => this.mapManager.resize(), 100);
        });
      }

      // 3. Collapsible Hide / Show Map toggle handler
      const toggleVisBtn = document.getElementById('mapToggleVisibilityBtn');
      const mapBody = document.getElementById('urbanMapBody');
      const statusPill = document.getElementById('mapStatusPill');
      const statusText = document.getElementById('mapStatusText');

      const applyMapVisibility = (visible) => {
        if (!mapBody || !toggleVisBtn) return;
        const icon = document.getElementById('mapToggleVisibilityIcon');
        const text = document.getElementById('mapToggleVisibilityText');

        if (visible) {
          mapBody.classList.remove('hidden');
          if (text) text.textContent = 'Hide Map';
          if (icon) icon.setAttribute('data-lucide', 'chevron-up');
          if (statusText) statusText.textContent = 'Map Canvas Active';
          if (statusPill) {
            statusPill.className = 'px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1';
          }
          setTimeout(() => this.mapManager.resize(), 50);
        } else {
          mapBody.classList.add('hidden');
          if (text) text.textContent = 'Show Map';
          if (icon) icon.setAttribute('data-lucide', 'chevron-down');
          if (statusText) statusText.textContent = 'Map Hidden';
          if (statusPill) {
            statusPill.className = 'px-2 py-0.5 text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-700/50 rounded-full flex items-center gap-1';
          }
        }
        if (window.lucide) window.lucide.createIcons();
      };

      if (toggleVisBtn) {
        toggleVisBtn.addEventListener('click', () => {
          const nextState = !this.mapState.isMapVisible;
          this.mapState.setMapVisible(nextState);
          applyMapVisibility(nextState);
        });
      }

      // Apply initial persisted visibility
      applyMapVisibility(this.mapState.isMapVisible);

      // 4. Layer Checkboxes Binding & Persistence
      const layers = [
        { id: 'layerToggleWeather', key: 'weather' },
        { id: 'layerToggleTemperature', key: 'temperature' },
        { id: 'layerToggleTraffic', key: 'traffic' },
        { id: 'layerToggleAirQuality', key: 'airQuality' }
      ];

      layers.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (el) {
          // Restore initial state from localStorage
          el.checked = this.mapState.isLayerActive(key);
          el.addEventListener('change', () => {
            this.mapState.setLayerActive(key, el.checked);
          });
        }
      });

      // 5. Initialize Spatial Telemetry Layers (Phase 4-7 + Option A dynamic overlays)
      this.mapLayers = new SmartCityMapLayers(this.mapManager, this.mapState);

      // 6. Initialize Location Search Engine connected with mapLayers (Option A)
      this.mapSearch = new SmartCityMapSearch(this.mapManager, this.mapState, this.mapLayers);

      if (window.lucide) {
        window.lucide.createIcons();
      }

    } catch (err) {
      console.error('[Dashboard] Error initializing map manager:', err);
    }
  }

  bindNearestLocationBtn() {
    const btn = document.getElementById('useNearestLocationBtn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.detectAndApplyNearestLocation(true);
      });
    }
  }

  detectAndApplyNearestLocation(isManual = false) {
    const activeBadge = document.getElementById('activeLocationBadgeName');
    if (activeBadge) activeBadge.textContent = 'Locating GPS...';

    const headerBadge = document.getElementById('headerLocationName');
    if (headerBadge) headerBadge.textContent = 'Locating Nearest Station...';

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            const res = await fetch(`/api/location/reverse?lat=${lat}&lon=${lon}`);
            const rev = await res.json();
            const name = rev.name || 'My Location';
            const loc = {
              name,
              display_name: rev.display_name || `${name} (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
              lat,
              lon
            };
            this.selectLocation(loc);
          } catch {
            this.selectLocation({
              name: 'Nearest Location',
              display_name: `${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E`,
              lat,
              lon
            });
          }
        },
        (err) => {
          console.warn('Geolocation unavailable, falling back:', err.message);
          if (!this.currentLocation) {
            this.fallbackToDefaultLocation();
          }
        },
        { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    } else {
      this.fallbackToDefaultLocation();
    }
  }

  fallbackToDefaultLocation() {
    const defaultLoc = {
      name: 'Anand',
      display_name: 'Anand, Gujarat, India',
      lat: 22.5645,
      lon: 72.9289
    };
    this.selectLocation(defaultLoc);
  }

  loadSavedLocation() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_LOCATION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveLocation(loc) {
    try {
      localStorage.setItem(this.STORAGE_KEY_LOCATION, JSON.stringify(loc));
    } catch {}
  }

  async selectLocation(loc) {
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return;
    this.currentLocation = loc;
    this.saveLocation(loc);

    this.updateLocationLabels(loc);

    const searchInput = document.getElementById('mapSearchInput');
    if (searchInput) searchInput.value = loc.name;

    if (this.mapManager) {
      this.mapManager.flyTo(loc.lon, loc.lat, 13.5);
      this.mapManager.clearSearchMarker();
    }

    if (this.mapLayers) {
      this.mapLayers.setSearchedLocation(loc, null);
    }

    await this.fetchData(true);
  }

  updateLocationLabels(loc) {
    if (!loc) return;

    // Header badge
    const headerLoc = document.getElementById('headerLocationName');
    if (headerLoc) {
      headerLoc.textContent = loc.display_name || loc.name;
      headerLoc.title = loc.display_name || loc.name;
    }

    // Active pill in search bar
    const activePill = document.getElementById('activeLocationBadgeName');
    if (activePill) {
      activePill.textContent = loc.name;
      activePill.title = loc.display_name || loc.name;
    }

    // Page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = `${loc.name} - Smart City Weather & Atmospheric Telemetry`;
    }

    // Box 1 Weather
    const weatherSub = document.getElementById('weatherLocationSubtitle');
    if (weatherSub) weatherSub.textContent = loc.display_name || `${loc.name}, Telemetry Station`;

    const weatherTag = document.getElementById('weatherLocationTag');
    if (weatherTag) weatherTag.textContent = `Weather API • ${loc.name}`;

    const weatherLive = document.getElementById('weatherLiveTag');
    if (weatherLive) weatherLive.textContent = `${loc.name} Live`;

    // Box 2A Ephemeris
    const ephemSub = document.getElementById('ephemerisLocationSubtitle');
    if (ephemSub) ephemSub.textContent = `${loc.name} • Celestial Cycles`;

    // Box 2B Air Quality
    const airSub = document.getElementById('airLocationSubtitle');
    if (airSub) airSub.textContent = `${loc.name} • EPA Scale`;

    // Box 3 Traffic
    const trafficSub = document.getElementById('trafficLocationSubtitle');
    if (trafficSub) trafficSub.textContent = `${loc.name} Mobility & Arterial Flow`;

    const corridorsTitle = document.getElementById('trafficCorridorsTitle');
    if (corridorsTitle) {
      corridorsTitle.innerHTML = `
        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-400"></i>
        <span>Active ${escapeHtml(loc.name)} Transit Corridors</span>
      `;
    }

    // Map Subtitle & Center Coordinates
    const mapSub = document.getElementById('mapLocationSubtitle');
    if (mapSub) mapSub.textContent = `Spatial Telemetry Canvas • ${loc.name}`;

    const mapCoord = document.getElementById('mapCenterCoordText');
    if (mapCoord && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
      mapCoord.textContent = `Center: ${loc.lat.toFixed(4)}° N, ${loc.lon.toFixed(4)}° E (${loc.name})`;
    }

    // Analysis
    const analysisSub = document.getElementById('analysisLocationSubtitle');
    if (analysisSub) analysisSub.textContent = `In-Depth Weather Telemetry • Urban Climate Insights • ${loc.name}`;

    const stationLoc = document.getElementById('analysisStationLocation');
    if (stationLoc) stationLoc.textContent = loc.display_name || `${loc.name} Telemetry Node`;

    const footerLoc = document.getElementById('footerLocationName');
    if (footerLoc) footerLoc.textContent = `Smart City Telemetry Platform • Active Node: ${loc.name}`;

    if (window.lucide) window.lucide.createIcons();
  }

  bindUnitToggle() {
    const toggleBtn = document.getElementById('tempUnitToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isFahrenheit = !this.isFahrenheit;
        this.updateAllTemperatureDisplays();
        if (this.mapLayers && this.latestData) {
          this.mapLayers.updateAll(this.latestData, this.isFahrenheit, this.getAnalysisSnapshot());
        }
        if (this.mapManager) {
          this.mapManager.updateSearchMarkerUnit(this.isFahrenheit);
        }
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
      let url = '/api/dashboard-data';
      if (this.currentLocation && typeof this.currentLocation.lat === 'number' && typeof this.currentLocation.lon === 'number') {
        url = `/api/location/weather?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}&name=${encodeURIComponent(this.currentLocation.name || '')}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      let unifiedData;
      if (raw.weather) {
        unifiedData = {
          success: true,
          cityWeather: raw.weather,
          airQuality: raw.airQuality,
          traffic: raw.traffic,
          astronomy: raw.astronomy,
          location: this.currentLocation
        };
      } else {
        unifiedData = raw;
      }

      this.latestData = unifiedData;
      this.renderDashboard(unifiedData);

      if (this.currentLocation) {
        this.updateLocationLabels(this.currentLocation);
        if (this.mapLayers) {
          this.mapLayers.setSearchedLocation(this.currentLocation, raw);
        }
      }

      this.updateSyncTime();
    } catch (err) {
      console.error('Fetch error:', err);
      if (this.mapLayers && this.currentLocation) {
        this.mapLayers.setSearchedLocationError(this.currentLocation, 'Live telemetry temporarily unavailable.');
      }
    } finally {
      if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
  }

  renderDashboard(data) {
    this.latestData = data;
    const weather = data.cityWeather || {};
    const air = data.airQuality || {};

    // =========================================================================
    // BOX 1: WEATHER CONDITIONS (TEMPERATURE, HUMIDITY & RAIN STRICTLY FROM WEATHER API)
    // =========================================================================
    if (typeof weather.temperature === 'number') {
      this.rawApiTempC = weather.temperature;
    }
    if (typeof weather.feelsLike === 'number') {
      this.rawHeatIndexC = weather.feelsLike;
    } else if (typeof weather.heatIndex === 'number') {
      this.rawHeatIndexC = weather.heatIndex;
    }
    if (typeof weather.minTemp === 'number') {
      this.rawMinTempC = weather.minTemp;
    }
    if (typeof weather.maxTemp === 'number') {
      this.rawMaxTempC = weather.maxTemp;
    }

    const humid = typeof weather.humidity === 'number' ? weather.humidity : 68.0;
    this.rawApiHumidity = humid;

    const humidValEl = document.getElementById('weatherHumidityVal');
    if (humidValEl) {
      humidValEl.textContent = humid.toFixed(1);
    }
    const humidBar = document.getElementById('weatherHumidityBar');
    if (humidBar) {
      humidBar.style.width = `${Math.min(Math.max(humid, 0), 100)}%`;
    }
    const humidStatus = document.getElementById('weatherHumidityStatus');
    if (humidStatus) {
      if (humid < 30) humidStatus.textContent = 'Dry Air';
      else if (humid <= 60) humidStatus.textContent = 'Optimal Comfort';
      else humidStatus.textContent = 'High Moisture';
    }

    // Rain & Precipitation Telemetry from Weather API
    const precipVal = weather.precipitation ?? weather.rain ?? 0.0;
    const rainProb = weather.rainProbability ?? (precipVal > 0 ? 95 : 20);
    const rainStatus = weather.rainStatus || (precipVal > 0 ? `${Number(precipVal).toFixed(1)} mm (Active Rain)` : '0.0 mm (No Active Rain)');

    const precipValEl = document.getElementById('weatherPrecipVal');
    if (precipValEl) precipValEl.textContent = `${Number(precipVal).toFixed(1)}`;

    const rainProbEl = document.getElementById('weatherRainProbVal');
    if (rainProbEl) rainProbEl.textContent = `${rainProb}%`;

    const rainStatusEl = document.getElementById('weatherRainStatus');
    if (rainStatusEl) {
      rainStatusEl.textContent = rainStatus;
      if (precipVal > 0) {
        rainStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse';
      } else if (rainProb >= 50) {
        rainStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      } else {
        rainStatusEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    }

    const rainBarEl = document.getElementById('weatherRainBar');
    if (rainBarEl) {
      rainBarEl.style.width = `${Math.min(Math.max(rainProb, 5), 100)}%`;
    }

    // Atmospheric Telemetry (Anand Weather API)
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
    // BOX 2A: SOLAR & LUNAR EPHEMERIS (SUNRISE, SUNSET, MOON CYCLE & MOONRISE)
    // =========================================================================
    this.renderEphemerisBox(data.astronomy, weather);

    // =========================================================================
    // BOX 3: URBAN TRAFFIC & MOBILITY (TOMTOM API / ANAND TRAFFIC)
    // =========================================================================
    const traffic = data.traffic || {};
    this.renderTrafficBox(traffic);

    // =========================================================================
    // BOX 4: IN-DEPTH TELEMETRY & CLIMATE ANALYSIS
    // =========================================================================
    this.computeAndRenderAnalysis(weather, air, traffic);
    this.updatePollutantChart(air);

    // =========================================================================
    // PHASE 8: SYNCHRONIZE SPATIAL TELEMETRY ON URBAN MAP (SINGLE 10s POLL HOOK)
    // =========================================================================
    if (this.mapLayers) {
      this.mapLayers.updateAll(data, this.isFahrenheit, this.getAnalysisSnapshot());
    }

    // Refresh icons
    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Render Solar & Lunar Ephemeris Box
   * Displays Sunrise, Sunset, Solar Noon, Daylight Duration/Progress,
   * Lunar Cycle Day (0-29.5), Moon Phase, Illumination %, Moonrise & Moonset
   */
  renderEphemerisBox(astronomy, weather) {
    const astro = astronomy || this.computeClientEphemeris(new Date());

    const sunriseEl = document.getElementById('ephemerisSunrise');
    if (sunriseEl && astro.sunrise) sunriseEl.textContent = astro.sunrise;

    const sunsetEl = document.getElementById('ephemerisSunset');
    if (sunsetEl && astro.sunset) sunsetEl.textContent = astro.sunset;

    const solarNoonEl = document.getElementById('ephemerisSolarNoon');
    if (solarNoonEl && astro.solarNoon) solarNoonEl.textContent = `Solar Noon: ${astro.solarNoon}`;

    const daylightDurEl = document.getElementById('ephemerisDaylightDuration');
    if (daylightDurEl && astro.daylightDuration) daylightDurEl.textContent = astro.daylightDuration;

    const daylightStatusEl = document.getElementById('ephemerisDaylightStatus');
    if (daylightStatusEl) {
      const pct = astro.daylightPercent ?? 54;
      daylightStatusEl.textContent = `${pct}% Daylight elapsed`;
    }

    const daylightBar = document.getElementById('ephemerisDaylightBar');
    if (daylightBar) {
      const pct = Math.max(0, Math.min(100, astro.daylightPercent ?? 54));
      daylightBar.style.width = `${pct}%`;
    }

    // Lunar Metrics
    const lunar = astro.lunar || {};
    const moonIconEl = document.getElementById('ephemerisMoonIcon');
    if (moonIconEl && lunar.phaseIcon) moonIconEl.textContent = lunar.phaseIcon;

    const moonPhaseEl = document.getElementById('ephemerisMoonPhase');
    if (moonPhaseEl && lunar.phaseName) moonPhaseEl.textContent = lunar.phaseName;

    const moonCycleDayEl = document.getElementById('ephemerisMoonCycleDay');
    if (moonCycleDayEl && typeof lunar.cycleDay !== 'undefined') {
      moonCycleDayEl.textContent = `Day ${lunar.cycleDay} of 29.5`;
    }

    const moonIllumEl = document.getElementById('ephemerisMoonIllumination');
    if (moonIllumEl && typeof lunar.illumination !== 'undefined') {
      moonIllumEl.textContent = `${lunar.illumination}% Illuminated Face`;
    }

    const synodicProgEl = document.getElementById('ephemerisSynodicProgress');
    if (synodicProgEl && lunar.phaseIndex) {
      synodicProgEl.textContent = `Phase ${lunar.phaseIndex} / 8`;
    }

    const moonriseEl = document.getElementById('ephemerisMoonrise');
    if (moonriseEl && lunar.moonrise) moonriseEl.textContent = lunar.moonrise;

    const moonsetEl = document.getElementById('ephemerisMoonset');
    if (moonsetEl && lunar.moonset) moonsetEl.textContent = lunar.moonset;

    const moonBar = document.getElementById('ephemerisMoonCycleBar');
    if (moonBar) {
      const cyclePct = Math.max(1, Math.min(100, lunar.cyclePercent ?? Math.round(((lunar.cycleDay || 1) / 29.5) * 100)));
      moonBar.style.width = `${cyclePct}%`;
    }
  }

  computeClientEphemeris(date = new Date()) {
    const refNewMoon = new Date(Date.UTC(2024, 0, 11, 11, 57, 0));
    const synodicMonth = 29.53058867;
    const diffDays = (date.getTime() - refNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const cycleDays = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const phaseFraction = cycleDays / synodicMonth;
    const illumination = Math.round((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2 * 100);

    let phaseName = 'New Moon';
    let phaseIcon = '🌑';
    let phaseIndex = 1;

    if (cycleDays < 1.845) { phaseName = 'New Moon'; phaseIcon = '🌑'; phaseIndex = 1; }
    else if (cycleDays < 7.382) { phaseName = 'Waxing Crescent'; phaseIcon = '🌒'; phaseIndex = 2; }
    else if (cycleDays < 9.228) { phaseName = 'First Quarter'; phaseIcon = '🌓'; phaseIndex = 3; }
    else if (cycleDays < 14.765) { phaseName = 'Waxing Gibbous'; phaseIcon = '🌔'; phaseIndex = 4; }
    else if (cycleDays < 16.610) { phaseName = 'Full Moon'; phaseIcon = '🌕'; phaseIndex = 5; }
    else if (cycleDays < 22.147) { phaseName = 'Waning Gibbous'; phaseIcon = '🌖'; phaseIndex = 6; }
    else if (cycleDays < 23.993) { phaseName = 'Last Quarter'; phaseIcon = '🌗'; phaseIndex = 7; }
    else { phaseName = 'Waning Crescent'; phaseIcon = '🌘'; phaseIndex = 8; }

    const baseMoonriseHour = 6.4;
    const moonriseFloat = (baseMoonriseHour + (cycleDays * 0.813)) % 24;
    const mrH = Math.floor(moonriseFloat);
    const mrM = Math.floor((moonriseFloat - mrH) * 60);

    const moonsetFloat = (moonriseFloat + 12.4) % 24;
    const msH = Math.floor(moonsetFloat);
    const msM = Math.floor((moonsetFloat - msH) * 60);

    const format12h = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    return {
      sunrise: '06:24 AM',
      sunset: '06:44 PM',
      solarNoon: '12:34 PM',
      daylightDuration: '12h 20m',
      daylightPercent: 54,
      lunar: {
        cycleDay: Math.round(cycleDays * 10) / 10,
        totalCycleDays: 29.5,
        cyclePercent: Math.max(1, Math.round((cycleDays / synodicMonth) * 100)),
        illumination,
        phaseName,
        phaseIcon,
        phaseIndex,
        moonrise: format12h(mrH, mrM),
        moonset: format12h(msH, msM)
      }
    };
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
   * Deep Analysis computations for Temperature & Humidity (Weather API data)
   */
  computeAndRenderAnalysis(weather, air) {
    const temp = this.rawApiTempC;
    const humidity = this.rawApiHumidity;
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

    // 8. Urban Environmental Score + Visual Metrics (computed from live telemetry)
    this.renderUrbanScorecard(aqi, windSpeed, pressure);
  }

  /**
   * Renders the Urban Environmental Scorecard visually:
   * - SVG ring + progress bar for composite score
   * - AQI, Wind, Barometer metric bars
   * - Grade badge, label, recommendation text
   * All values are live and change with searched location.
   */
  renderUrbanScorecard(aqi, windSpeed, pressure) {
    // ── Compute sub-scores (0–100, higher = better) ──────────────────────────
    // AQI sub-score: 0 = worst (300 AQI), 100 = best (0 AQI)
    const aqiCapped = Math.max(0, Math.min(300, aqi || 50));
    const aqiSubScore = Math.round(Math.max(0, 100 - (aqiCapped / 3)));

    // Wind sub-score: optimal 8–25 km/h gets highest points
    const wsp = windSpeed || 10;
    let windSubScore;
    if (wsp >= 8 && wsp <= 25) windSubScore = 100;
    else if (wsp < 8) windSubScore = Math.round(40 + (wsp / 8) * 60);
    else windSubScore = Math.round(Math.max(30, 100 - ((wsp - 25) * 2)));

    // Baro sub-score: 1013 hPa = peak stability, degrade ±30 hPa
    const baroBase = 1013;
    const baroDelta = Math.abs((pressure || 1013) - baroBase);
    const baroSubScore = Math.round(Math.max(20, 100 - (baroDelta * 2.5)));

    // Composite score (weighted: AQI 50%, Wind 25%, Baro 25%)
    const score = Math.round((aqiSubScore * 0.50) + (windSubScore * 0.25) + (baroSubScore * 0.25));

    // ── Grade & labels ────────────────────────────────────────────────────────
    let grade, gradeCls, label, labelCls, outdoor, outdoor_cls, resp, resp_cls;
    if (score >= 85) {
      grade = 'Optimal Grade A'; gradeCls = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      label = 'Excellent Habitability'; labelCls = 'text-emerald-400';
      outdoor = 'Recommended'; outdoor_cls = 'text-emerald-400';
      resp = 'Minimal'; resp_cls = 'text-emerald-400';
    } else if (score >= 70) {
      grade = 'Good Grade B'; gradeCls = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      label = 'Good Urban Comfort'; labelCls = 'text-sky-400';
      outdoor = 'Generally Safe'; outdoor_cls = 'text-sky-400';
      resp = 'Low'; resp_cls = 'text-sky-400';
    } else if (score >= 50) {
      grade = 'Moderate Grade C'; gradeCls = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      label = 'Moderate Conditions'; labelCls = 'text-amber-400';
      outdoor = 'Moderate Caution'; outdoor_cls = 'text-amber-400';
      resp = 'Moderate'; resp_cls = 'text-amber-400';
    } else {
      grade = 'Poor Grade D'; gradeCls = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      label = 'Poor Air & Stability'; labelCls = 'text-rose-400';
      outdoor = 'Not Recommended'; outdoor_cls = 'text-rose-400';
      resp = 'High – Use Mask'; resp_cls = 'text-rose-400';
    }

    // AQI chip colour
    let aqiChip, aqiChipCls;
    if (aqiCapped <= 50) {
      aqiChip = 'Good'; aqiChipCls = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (aqiCapped <= 100) {
      aqiChip = 'Moderate'; aqiChipCls = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else if (aqiCapped <= 150) {
      aqiChip = 'Sensitive'; aqiChipCls = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    } else {
      aqiChip = 'Unhealthy'; aqiChipCls = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }

    // Wind chip
    let windChip, windChipCls;
    if (windSubScore >= 85) {
      windChip = 'Active'; windChipCls = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    } else if (windSubScore >= 55) {
      windChip = 'Mild'; windChipCls = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    } else {
      windChip = 'Calm'; windChipCls = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }

    // Baro chip
    let baroChip, baroChipCls;
    if (baroSubScore >= 80) {
      baroChip = 'Stable'; baroChipCls = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    } else if (baroSubScore >= 55) {
      baroChip = 'Variable'; baroChipCls = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else {
      baroChip = 'Unstable'; baroChipCls = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }

    // ── SVG Ring: stroke-dashoffset = circumference * (1 - score/100) ────────
    const circumference = 201.06;
    const ringOffset = circumference * (1 - score / 100);

    // ── DOM Updates ───────────────────────────────────────────────────────────
    const setEl = (id, prop, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (prop === 'text') el.textContent = val;
      else if (prop === 'html') el.innerHTML = val;
      else el[prop] = val;
    };
    const setClass = (id, cls) => {
      const el = document.getElementById(id);
      if (el) el.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`;
    };

    // Score ring & bar
    const ring = document.getElementById('urbanScoreRing');
    if (ring) ring.style.strokeDashoffset = ringOffset.toFixed(2);
    setEl('urbanScoreValue', 'text', String(score));
    setEl('urbanScoreBar', 'style', `width:${score}%`);

    // Grade badge
    const badge = document.getElementById('urbanScoreGradeBadge');
    if (badge) {
      badge.textContent = grade;
      badge.className = `text-[10px] font-mono px-2 py-0.5 rounded border ${gradeCls}`;
    }

    // Label
    const lbl = document.getElementById('urbanScoreLabel');
    if (lbl) { lbl.textContent = label; lbl.className = `text-sm font-bold mb-1 ${labelCls}`; }

    const sub = document.getElementById('urbanScoreSubtext');
    if (sub) sub.textContent = `AQI ${aqiCapped} · Wind ${wsp} km/h · ${pressure || 1013} hPa`;

    // AQI row
    setEl('urbanAqiVal', 'text', String(aqiCapped));
    const aqiBarPct = Math.min(100, Math.round((aqiCapped / 300) * 100));
    setEl('urbanAqiBar', 'style', `width:${aqiBarPct}%`);
    // AQI bar colour
    const aqiBarEl = document.getElementById('urbanAqiBar');
    if (aqiBarEl) {
      if (aqiCapped <= 50) aqiBarEl.className = 'h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 to-teal-400';
      else if (aqiCapped <= 100) aqiBarEl.className = 'h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-yellow-400';
      else aqiBarEl.className = 'h-full rounded-full transition-all duration-700 bg-gradient-to-r from-rose-400 to-red-500';
    }
    const aqiChipEl = document.getElementById('urbanAqiChip');
    if (aqiChipEl) { aqiChipEl.textContent = aqiChip; aqiChipEl.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${aqiChipCls}`; }

    // Wind row
    const windBarPct = Math.min(100, Math.round((wsp / 60) * 100));
    setEl('urbanWindVal', 'text', `${wsp} km/h`);
    setEl('urbanWindBar', 'style', `width:${windBarPct}%`);
    const windChipEl = document.getElementById('urbanWindChip');
    if (windChipEl) { windChipEl.textContent = windChip; windChipEl.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${windChipCls}`; }

    // Baro row
    const p = pressure || 1013;
    const baroBarPct = Math.min(100, Math.round(Math.max(0, (p - 970) / 60) * 100));
    setEl('urbanBaroVal', 'text', `${p} hPa`);
    setEl('urbanBaroBar', 'style', `width:${baroBarPct}%`);
    const baroChipEl = document.getElementById('urbanBaroChip');
    if (baroChipEl) { baroChipEl.textContent = baroChip; baroChipEl.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${baroChipCls}`; }

    // Footer recommendations
    const outdoorEl = document.getElementById('urbanOutdoorRec');
    if (outdoorEl) { outdoorEl.textContent = outdoor; outdoorEl.className = outdoor_cls; }
    const respEl = document.getElementById('urbanRespRisk');
    if (respEl) { respEl.textContent = resp; respEl.className = resp_cls; }
  }

  getAnalysisSnapshot() {
    return {
      dewPointC: this.rawDewPointC,
      heatIndexC: this.rawHeatIndexC,
      minTempC: this.rawMinTempC,
      maxTempC: this.rawMaxTempC
    };
  }

  /**
   * Converts and updates all temperature fields across Box 1 and Box 3
   */
  updateAllTemperatureDisplays() {
    const toggleBtn = document.getElementById('tempUnitToggleBtn');

    if (this.isFahrenheit) {
      const fTemp = (this.rawApiTempC * 9 / 5) + 32;
      const fDew = (this.rawDewPointC * 9 / 5) + 32;
      const fHeatIndex = (this.rawHeatIndexC * 9 / 5) + 32;
      const fMin = (this.rawMinTempC * 9 / 5) + 32;
      const fMax = (this.rawMaxTempC * 9 / 5) + 32;

      // Box 1 Temperature (Weather API)
      this.setText('weatherTempVal', fTemp.toFixed(1));
      this.setText('weatherTempUnit', '°F');
      this.setText('weatherFeelsLikeVal', `${fHeatIndex.toFixed(1)} °F`);
      this.setText('weatherMinMaxVal', `${fMin.toFixed(0)}° – ${fMax.toFixed(0)}°F`);

      // Box 3: Temperature Deep Analysis Fields
      this.setText('analysisTempReading', `${fTemp.toFixed(1)} °F`);
      this.setText('analysisHeatIndexVal', `${fHeatIndex.toFixed(1)} °F`);
      this.setText('analysisTempRange', `${fMin.toFixed(0)}°F – ${fMax.toFixed(0)}°F`);
      this.setText('analysisDewPointVal', `${fDew.toFixed(1)} °F`);

      if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400"></i><span>Switch to °C</span>`;
        toggleBtn.title = 'Click to switch back to Celsius (°C)';
        toggleBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm';
      }
    } else {
      // Box 1 Temperature (Weather API)
      this.setText('weatherTempVal', this.rawApiTempC.toFixed(1));
      this.setText('weatherTempUnit', '°C');
      this.setText('weatherFeelsLikeVal', `${this.rawHeatIndexC.toFixed(1)} °C`);
      this.setText('weatherMinMaxVal', `${this.rawMinTempC.toFixed(0)}° – ${this.rawMaxTempC.toFixed(0)}°C`);

      // Box 3: Temperature Deep Analysis Fields
      this.setText('analysisTempReading', `${this.rawApiTempC.toFixed(1)} °C`);
      this.setText('analysisHeatIndexVal', `${this.rawHeatIndexC.toFixed(1)} °C`);
      this.setText('analysisTempRange', `${this.rawMinTempC.toFixed(0)}°C – ${this.rawMaxTempC.toFixed(0)}°C`);
      this.setText('analysisDewPointVal', `${this.rawDewPointC.toFixed(1)} °C`);

      if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400"></i><span>Switch to °F</span>`;
        toggleBtn.title = 'Click to convert to Fahrenheit (°F)';
        toggleBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-dark-800 text-slate-300 border border-slate-700 hover:border-sky-500 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm';
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

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
