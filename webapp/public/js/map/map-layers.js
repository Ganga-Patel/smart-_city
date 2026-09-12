/**
 * Smart City Map Layers Orchestrator
 * Central registry managing and coordinating all spatial telemetry layers:
 * - Weather Layer
 * - Temperature Layer
 * - Traffic Corridors Layer (Worldwide)
 * - Air Quality Layer
 * - Sleek Location Pin Beacon on Map Canvas (Zero clutter, zero floating badges/chips)
 * - Top-Left Map HUD displaying telemetry strictly for selected layer filters
 * - 1-Click Smooth Navigation to Upper 3-Box Dashboard Interface
 */

import { MAP_CONFIG } from './map-config.js';
import { SmartCityWeatherLayer } from './weather-layer.js';
import { SmartCityTemperatureLayer } from './temperature-layer.js';
import { SmartCityTrafficLayer } from './traffic-layer.js';
import { SmartCityAirQualityLayer } from './air-quality-layer.js';

export class SmartCityMapLayers {
  constructor(mapManager, mapState) {
    this.mapManager = mapManager;
    this.mapState = mapState;

    // Spatial Telemetry Sub-layers
    this.weatherLayer = new SmartCityWeatherLayer(this.mapManager, this.mapState);
    this.temperatureLayer = new SmartCityTemperatureLayer(this.mapManager, this.mapState);
    this.trafficLayer = new SmartCityTrafficLayer(this.mapManager, this.mapState);
    this.airQualityLayer = new SmartCityAirQualityLayer(this.mapManager, this.mapState);

    // Dynamic Selected Location Telemetry State
    this.searchedLocation = null;
    this.searchedWeather = null;
    this.searchedAirQuality = null;
    this.searchedTraffic = null;
    this.searchedError = null;

    // Sleek, minimal location beacon pin on map canvas (NO text chips, NO floating numbers)
    this.locationPinMarker = null;

    this.isFahrenheit = false;
    this.latestAnandWeather = null;
    this.latestAnandAirQuality = null;
    this.latestAnandTraffic = null;
    this.isHudCollapsed = false;

    this.initMapBehaviors();
    this.initListeners();
    this.initHud();
  }

  /**
   * Initializes map behavior:
   * Keeps floating canvas text badges hidden so values appear exclusively in Top-Left HUD.
   * Renders the default location beacon pin at Anand City Center.
   */
  initMapBehaviors() {
    this.mapManager.onLoad(() => {
      // Suppress floating text badges from station sub-layers on the map canvas
      if (this.weatherLayer) this.weatherLayer.setVisible(false);
      if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
      if (this.airQualityLayer) this.airQualityLayer.setVisible(false);

      // Render location beacon pin at active location if known, else default coordinates
      const activeLoc = this.searchedLocation || window.weatherAirApp?.currentLocation;
      if (activeLoc) {
        this.renderLocationBeacon(activeLoc.lon, activeLoc.lat, activeLoc.name);
      } else {
        this.renderLocationBeacon(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], 'Active Station');
      }
    });
  }

  initListeners() {
    // Listen for layer checkbox changes dispatched from mapState
    this.mapState.on('layerChange', ({ layerKey, isActive }) => {
      this.handleLayerToggle(layerKey, isActive);
      // Immediately refresh top-left HUD to show only selected filter values!
      this.updateTopLeftHud();
    });
  }

  handleLayerToggle(layerKey, isActive) {
    // Traffic layer renders spatial road corridors on the canvas
    if (layerKey === 'traffic' && this.trafficLayer) {
      this.trafficLayer.setVisible(isActive);
    }

    // Keep weatherLayer, temperatureLayer, airQualityLayer floating text badges off canvas,
    // as all telemetry values are displayed inside the Top-Left HUD
    if (this.weatherLayer) this.weatherLayer.setVisible(false);
    if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
    if (this.airQualityLayer) this.airQualityLayer.setVisible(false);

    // Refresh HUD filter visibility
    this.updateTopLeftHud();
  }

  /**
   * Renders a sleek, pulsating location pin beacon on the map canvas.
   * Displays the location's geographic position with a clean glowing beacon and name tag.
   * Zero floating telemetry cards or numbers on the canvas — all telemetry lives in Top-Left HUD!
   * @param {number} lon - Longitude
   * @param {number} lat - Latitude
   * @param {string} name - Location name
   */
  renderLocationBeacon(lon, lat, name = 'Selected Location') {
    const map = this.mapManager.getMap();
    if (!map || !window.maplibregl || typeof lon !== 'number' || typeof lat !== 'number') return;

    if (this.locationPinMarker) {
      this.locationPinMarker.remove();
      this.locationPinMarker = null;
    }

    const pinEl = document.createElement('div');
    pinEl.className = 'smartcity-location-pin';
    pinEl.title = name;
    pinEl.innerHTML = `
      <div class="pin-beacon-glow"></div>
      <div class="pin-beacon-pulse"></div>
      <div class="pin-beacon-core">
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </div>
      <div class="pin-beacon-tag">${escapeHtml(name)}</div>
    `;

    this.locationPinMarker = new window.maplibregl.Marker({
      element: pinEl,
      anchor: 'center'
    })
      .setLngLat([lon, lat])
      .addTo(map);
  }

  /**
   * Alias for backward compatibility with search engine
   */
  renderSearchedOverlays() {
    const activeLoc = this.searchedLocation || window.weatherAirApp?.currentLocation;
    if (activeLoc) {
      this.renderLocationBeacon(activeLoc.lon, activeLoc.lat, activeLoc.name);
    } else {
      this.renderLocationBeacon(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], 'Active Station');
    }
  }

  /**
   * Sets dynamic telemetry overlays for a searched location.
   * Telemetry values are displayed in the Top-Left HUD, and a sleek location pin is placed on the canvas.
   * @param {Object} locationItem - { name, display_name, lat, lon }
   * @param {Object} telemetryData - Live payload from /api/location/weather containing { weather, airQuality, traffic }
   */
  setSearchedLocation(locationItem, telemetryData) {
    if (!locationItem) return;
    this.searchedLocation = locationItem;
    this.searchedWeather = telemetryData?.weather || telemetryData;
    this.searchedAirQuality = telemetryData?.airQuality || null;
    this.searchedTraffic = telemetryData?.traffic || null;
    this.searchedError = null;

    // Suppress station canvas badges
    if (this.weatherLayer) this.weatherLayer.setVisible(false);
    if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
    if (this.airQualityLayer) this.airQualityLayer.setVisible(false);

    // Update traffic corridors for the searched coordinates (if layer is active)
    if (this.trafficLayer) {
      if (this.searchedTraffic) {
        this.trafficLayer.updateData(this.searchedTraffic);
      }
      this.trafficLayer.setVisible(this.mapState.isLayerActive('traffic'));
    }

    // Render clean location beacon on the map canvas
    this.renderLocationBeacon(locationItem.lon, locationItem.lat, locationItem.name);

    // Update top-left map HUD with selected location details and telemetry
    this.updateTopLeftHud();
  }

  /**
   * Sets an error notification state if telemetry fetch fails.
   * @param {Object} locationItem
   * @param {string} errorMessage
   */
  setSearchedLocationError(locationItem, errorMessage = 'Telemetry temporarily unavailable') {
    if (!locationItem) return;
    this.searchedLocation = locationItem;
    this.searchedWeather = null;
    this.searchedAirQuality = null;
    this.searchedTraffic = null;
    this.searchedError = errorMessage;

    if (this.weatherLayer) this.weatherLayer.setVisible(false);
    if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
    if (this.airQualityLayer) this.airQualityLayer.setVisible(false);

    if (this.trafficLayer) {
      this.trafficLayer.setVisible(this.mapState.isLayerActive('traffic'));
    }

    this.renderLocationBeacon(locationItem.lon, locationItem.lat, locationItem.name);
    this.updateTopLeftHud();
  }

  /**
   * Clears dynamic searched location overlays and restores Anand center default beacon.
   */
  clearSearchedLocation() {
    this.searchedLocation = null;
    this.searchedWeather = null;
    this.searchedAirQuality = null;
    this.searchedTraffic = null;
    this.searchedError = null;

    if (this.weatherLayer) this.weatherLayer.setVisible(false);
    if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
    if (this.airQualityLayer) this.airQualityLayer.setVisible(false);

    if (this.trafficLayer) {
      if (this.latestAnandTraffic) {
        this.trafficLayer.updateData(this.latestAnandTraffic);
      }
      this.trafficLayer.setVisible(this.mapState.isLayerActive('traffic'));
    }

    const activeLoc = window.weatherAirApp?.currentLocation;
    if (activeLoc) {
      this.renderLocationBeacon(activeLoc.lon, activeLoc.lat, activeLoc.name);
    } else {
      this.renderLocationBeacon(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], 'Active Station');
    }
    this.updateTopLeftHud();
  }

  /**
   * Primary centralized orchestration entrypoint invoked once per 10-second polling cycle
   * Synchronizes telemetry and updates the Top-Left HUD
   * @param {Object} data - Full API payload from /api/dashboard-data
   * @param {boolean} isFahrenheit - Current temperature display unit
   * @param {Object} analysis - Computed microclimate analysis values
   */
  updateAll(data, isFahrenheit = false, analysis = null) {
    this.updateTelemetry(data, isFahrenheit, analysis);
  }

  /**
   * Dispatches live 10-second polling telemetry snapshot
   * @param {Object} data - Full API payload from /api/dashboard-data
   * @param {boolean} isFahrenheit - Temperature display unit
   * @param {Object} analysis - Computed microclimate analysis values
   */
  updateTelemetry(data, isFahrenheit = false, analysis = null) {
    this.isFahrenheit = isFahrenheit;

    // Cache latest Anand Weather & Station Telemetry
    if (data && data.cityWeather) {
      this.latestAnandWeather = data.cityWeather;
      if (this.weatherLayer) {
        this.weatherLayer.updateData(data.cityWeather, isFahrenheit);
      }
      if (this.temperatureLayer) {
        this.temperatureLayer.updateData(data.cityWeather, isFahrenheit, analysis);
      }
    }

    // Cache latest Anand Traffic
    if (data && data.traffic) {
      this.latestAnandTraffic = data.traffic;
      if (!this.searchedLocation && this.trafficLayer) {
        this.trafficLayer.updateData(data.traffic);
      }
    }

    // Cache latest Anand Air Quality
    if (data && data.airQuality) {
      this.latestAnandAirQuality = data.airQuality;
      if (this.airQualityLayer) {
        this.airQualityLayer.updateData(data.airQuality);
      }
    }

    // Keep floating badges off canvas
    if (this.weatherLayer) this.weatherLayer.setVisible(false);
    if (this.temperatureLayer) this.temperatureLayer.setVisible(false);
    if (this.airQualityLayer) this.airQualityLayer.setVisible(false);
    if (this.trafficLayer) {
      this.trafficLayer.setVisible(this.mapState.isLayerActive('traffic'));
    }

    // Ensure location pin beacon is rendered
    if (!this.locationPinMarker) {
      const activeLoc = this.searchedLocation || window.weatherAirApp?.currentLocation;
      if (activeLoc) {
        this.renderLocationBeacon(activeLoc.lon, activeLoc.lat, activeLoc.name);
      } else {
        this.renderLocationBeacon(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], 'Active Station');
      }
    }

    // Update Top-Left corner HUD with latest active telemetry snapshot
    this.updateTopLeftHud();
  }

  /**
   * Initializes top-left corner HUD interaction listeners:
   * - Collapse/expand toggle
   * - Smooth navigation to Upper 3 Boxes Interface
   * - Smooth navigation from individual telemetry cards
   */
  initHud() {
    // 1. Collapse / Expand toggle
    const collapseBtn = document.getElementById('hudToggleCollapseBtn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleHudCollapse();
      });
    }

    // 2. Navigation Button to Upper 3 Boxes Grid
    const goToTopBtn = document.getElementById('hudGoToTopDashboardBtn');
    if (goToTopBtn) {
      goToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollToUpperSection('upperThreeBoxesGrid', 'ring-sky-400');
      });
    }

    // 3. Individual card navigation handlers to specific sections in the upper 3 boxes
    const weatherCard = document.getElementById('hudWeatherCard');
    if (weatherCard) {
      weatherCard.addEventListener('click', () => {
        this.scrollToUpperSection('weatherConditionsSection', 'ring-sky-400');
      });
    }

    const tempCard = document.getElementById('hudTemperatureCard');
    if (tempCard) {
      tempCard.addEventListener('click', () => {
        this.scrollToUpperSection('weatherConditionsSection', 'ring-rose-400');
      });
    }

    const trafficCard = document.getElementById('hudTrafficCard');
    if (trafficCard) {
      trafficCard.addEventListener('click', () => {
        this.scrollToUpperSection('urbanTrafficSection', 'ring-amber-400');
      });
    }

    const airCard = document.getElementById('hudAirQualityCard');
    if (airCard) {
      airCard.addEventListener('click', () => {
        this.scrollToUpperSection('airQualitySection', 'ring-emerald-400');
      });
    }

    this.updateTopLeftHud();
  }

  /**
   * Smoothly scrolls the window to an upper section and flashes a momentary focus ring
   * @param {string} targetId - DOM element ID
   * @param {string} highlightRingClass - Tailwind ring class
   */
  scrollToUpperSection(targetId, highlightRingClass = 'ring-sky-400') {
    const el = document.getElementById(targetId) || document.getElementById('upperThreeBoxesGrid');
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Visual pulse feedback ring
    el.classList.add('ring-2', highlightRingClass, 'transition-all', 'duration-500');
    setTimeout(() => {
      el.classList.remove('ring-2', highlightRingClass);
    }, 1800);
  }

  /**
   * Toggles collapse/minimize state for the top-left HUD
   */
  toggleHudCollapse() {
    this.isHudCollapsed = !this.isHudCollapsed;
    const body = document.getElementById('hudCollapsibleBody');
    const icon = document.getElementById('hudToggleCollapseIcon');
    const container = document.getElementById('urbanMapTopLeftHUD');
    if (body) {
      body.classList.toggle('hud-collapsed', this.isHudCollapsed);
    }
    if (container) {
      container.classList.toggle('hud-is-minimized', this.isHudCollapsed);
    }
    if (icon) {
      icon.setAttribute('data-lucide', this.isHudCollapsed ? 'chevron-down' : 'chevron-up');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  /**
   * Updates the top-left map HUD:
   * 1. Displays selected location name and distance
   * 2. SHOWS ONLY SELECTED FILTER VALUES: Hides telemetry cards whose layer filter checkboxes are off!
   * 3. Displays active telemetry (Weather condition, rain %, temp, AQI, speed/congestion)
   */
  updateTopLeftHud() {
    const nameEl = document.getElementById('hudLocationName');
    const subtitleEl = document.getElementById('hudLocationSubtitle');
    const badgeEl = document.getElementById('hudLocationBadge');

    const weatherCard = document.getElementById('hudWeatherCard');
    const tempCard = document.getElementById('hudTemperatureCard');
    const trafficCard = document.getElementById('hudTrafficCard');
    const airCard = document.getElementById('hudAirQualityCard');
    const noFiltersMsg = document.getElementById('hudNoFiltersMsg');

    const weatherIconEl = document.getElementById('hudWeatherIcon');
    const weatherConditionEl = document.getElementById('hudWeatherCondition');
    const rainProbEl = document.getElementById('hudRainProb');
    const tempEl = document.getElementById('hudTemperature');
    const thermalZoneEl = document.getElementById('hudThermalZone');

    const aqiValEl = document.getElementById('hudAqiVal');
    const aqiStatusEl = document.getElementById('hudAqiStatus');
    const pm25ValEl = document.getElementById('hudPm25Val');

    const trafficSpeedEl = document.getElementById('hudTrafficSpeed');
    const trafficStatusEl = document.getElementById('hudTrafficStatus');
    const trafficCongestionEl = document.getElementById('hudTrafficCongestion');

    if (!nameEl) return; // HUD not mounted in DOM yet

    // =========================================================================
    // 1. FILTER VISIBILITY: Show only cards whose layer filter is selected!
    // =========================================================================
    const showWeather = this.mapState.isLayerActive('weather');
    const showTemp = this.mapState.isLayerActive('temperature');
    const showTraffic = this.mapState.isLayerActive('traffic');
    const showAir = this.mapState.isLayerActive('airQuality');

    if (weatherCard) weatherCard.classList.toggle('hidden', !showWeather);
    if (tempCard) tempCard.classList.toggle('hidden', !showTemp);
    if (trafficCard) trafficCard.classList.toggle('hidden', !showTraffic);
    if (airCard) airCard.classList.toggle('hidden', !showAir);

    const hasAnyActiveFilter = showWeather || showTemp || showTraffic || showAir;
    if (noFiltersMsg) {
      noFiltersMsg.classList.toggle('hidden', hasAnyActiveFilter);
    }

    // =========================================================================
    // 2. IDENTIFY SELECTED TARGET & TELEMETRY SOURCE
    // =========================================================================
    const activeLoc = this.searchedLocation || window.weatherAirApp?.currentLocation;

    let locName = 'Active Location';
    let locSubtitle = 'Live Telemetry Station';
    let locBadge = 'LIVE';

    let weather = this.searchedWeather || this.latestAnandWeather;
    let aqi = this.searchedAirQuality || this.latestAnandAirQuality;
    let traffic = this.searchedTraffic || this.latestAnandTraffic;

    if (activeLoc) {
      locName = activeLoc.name || 'Selected Location';
      locSubtitle = activeLoc.display_name || (typeof activeLoc.lat === 'number' ? `${Number(activeLoc.lat).toFixed(3)}° N, ${Number(activeLoc.lon).toFixed(3)}° E` : 'Live Telemetry Node');
      locBadge = 'ACTIVE';
    }

    // Update Header
    nameEl.textContent = locName;
    nameEl.title = locName;
    if (subtitleEl) subtitleEl.innerHTML = locSubtitle;
    if (badgeEl) badgeEl.textContent = locBadge;

    // =========================================================================
    // 3. POPULATE WEATHER & TEMPERATURE TELEMETRY VALUES
    // =========================================================================
    if (weather) {
      const tempC = typeof weather.temperature === 'number' ? weather.temperature : 28.0;
      const displayTemp = this.isFahrenheit
        ? `${((tempC * 9 / 5) + 32).toFixed(1)} °F`
        : `${tempC.toFixed(1)} °C`;

      if (weatherIconEl && weather.icon) {
        weatherIconEl.src = weather.icon;
      }
      if (weatherConditionEl) {
        weatherConditionEl.textContent = weather.condition || 'Clear / Sunny';
      }
      if (rainProbEl) {
        rainProbEl.textContent = `${weather.rainProbability ?? 20}% Rain`;
      }
      if (tempEl) {
        tempEl.textContent = displayTemp;
      }
      if (thermalZoneEl) {
        let zoneText = 'Comfort Zone';
        let zoneClass = 'text-emerald-400';
        if (tempC < 18) {
          zoneText = 'Cool Climate';
          zoneClass = 'text-sky-400';
        } else if (tempC <= 28) {
          zoneText = 'Comfort Zone';
          zoneClass = 'text-emerald-400';
        } else if (tempC <= 35) {
          zoneText = 'Warm Temperature';
          zoneClass = 'text-amber-400';
        } else {
          zoneText = 'Thermal Caution';
          zoneClass = 'text-rose-400';
        }
        thermalZoneEl.textContent = zoneText;
        thermalZoneEl.className = `text-[11px] font-semibold ${zoneClass}`;
      }
    } else if (this.searchedLocation && !weather && !this.searchedError) {
      if (weatherConditionEl) weatherConditionEl.textContent = 'Syncing telemetry...';
      if (rainProbEl) rainProbEl.textContent = 'Live Fetch';
      if (tempEl) tempEl.textContent = '...';
      if (thermalZoneEl) {
        thermalZoneEl.textContent = 'Locating';
        thermalZoneEl.className = 'text-[11px] font-semibold text-sky-400 animate-pulse';
      }
    } else if (this.searchedError) {
      if (weatherConditionEl) weatherConditionEl.textContent = 'Telemetry Pending';
      if (rainProbEl) rainProbEl.textContent = 'Retrying...';
      if (tempEl) tempEl.textContent = '--';
      if (thermalZoneEl) {
        thermalZoneEl.textContent = 'Offline';
        thermalZoneEl.className = 'text-[11px] font-semibold text-amber-400';
      }
    }

    // =========================================================================
    // 4. POPULATE AIR QUALITY TELEMETRY VALUES
    // =========================================================================
    if (aqi) {
      if (aqiValEl) aqiValEl.textContent = `AQI ${aqi.aqi}`;
      if (pm25ValEl) pm25ValEl.textContent = `PM2.5: ${aqi.pm25 ?? 18} µg`;
      if (aqiStatusEl) {
        let bgClass = 'bg-emerald-500/10 text-emerald-400';
        if (aqi.aqi > 150) bgClass = 'bg-rose-500/10 text-rose-400';
        else if (aqi.aqi > 100) bgClass = 'bg-orange-500/10 text-orange-400';
        else if (aqi.aqi > 50) bgClass = 'bg-amber-500/10 text-amber-400';
        aqiStatusEl.textContent = aqi.status || 'Safe';
        aqiStatusEl.className = `text-[9px] font-bold px-1.5 py-0.2 rounded ${bgClass}`;
      }
    } else {
      if (aqiValEl) aqiValEl.textContent = 'AQI --';
      if (aqiStatusEl) {
        aqiStatusEl.textContent = 'Syncing';
        aqiStatusEl.className = 'text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400';
      }
    }

    // =========================================================================
    // 5. POPULATE URBAN TRAFFIC TELEMETRY VALUES
    // =========================================================================
    if (traffic) {
      if (trafficSpeedEl) trafficSpeedEl.textContent = `${traffic.currentSpeed} km/h`;
      if (trafficCongestionEl) trafficCongestionEl.textContent = `${traffic.congestionIndex}% Congestion`;
      if (trafficStatusEl) {
        let bgClass = 'bg-emerald-500/10 text-emerald-400';
        if (traffic.congestionIndex > 45) bgClass = 'bg-rose-500/10 text-rose-400';
        else if (traffic.congestionIndex > 25) bgClass = 'bg-amber-500/10 text-amber-400';
        trafficStatusEl.textContent = traffic.status || 'Smooth';
        trafficStatusEl.className = `text-[9px] font-bold px-1.5 py-0.2 rounded ${bgClass}`;
      }
    } else {
      if (trafficSpeedEl) trafficSpeedEl.textContent = '-- km/h';
      if (trafficStatusEl) {
        trafficStatusEl.textContent = 'Syncing';
        trafficStatusEl.className = 'text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400';
      }
    }
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDistanceFromAnandKm(lat, lon) {
  const anandLat = 22.5645;
  const anandLon = 72.9289;
  const R = 6371; // Earth radius in km
  const dLat = (lat - anandLat) * Math.PI / 180;
  const dLon = (lon - anandLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(anandLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
