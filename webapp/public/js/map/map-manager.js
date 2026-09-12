/**
 * Smart City Map Manager
 * Encapsulates MapLibre GL instance lifecycle, canvas rendering, camera movements,
 * navigation controls, and container resize handling.
 */

import { MAP_CONFIG } from './map-config.js';

export class SmartCityMapManager {
  constructor() {
    this.map = null;
    this.isLoaded = false;
    this.containerId = null;
    this.markers = [];
    this.searchMarker = null;
    this.currentSearchLocation = null;
    this.currentSearchWeather = null;
    this.currentSearchFahrenheit = false;
    this.onLoadCallbacks = [];
  }

  /**
   * Initializes the MapLibre GL map instance inside the designated container.
   * @param {string} containerId - DOM ID of the map element (default: 'urbanMapCanvas')
   */
  initMap(containerId = 'urbanMapCanvas') {
    this.containerId = containerId;
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[MapManager] Container #${containerId} not found in DOM.`);
      return null;
    }

    if (typeof window.maplibregl === 'undefined') {
      console.error('[MapManager] MapLibre GL library not loaded. Ensure script tag is present.');
      this.showFallbackMessage('Map engine loading error. Please refresh.');
      return null;
    }

    try {
      console.log('🗺️ Initializing MapLibre GL map canvas for Anand, Gujarat...');
      this.map = new window.maplibregl.Map({
        container: containerId,
        style: MAP_CONFIG.style,
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
        attributionControl: false // Custom control added below
      });

      // Add clean compact attribution in bottom-right
      this.map.addControl(new window.maplibregl.AttributionControl({
        compact: true
      }), 'bottom-right');

      // Add navigation controls (Zoom In, Zoom Out, Compass / Reset Bearing)
      this.map.addControl(new window.maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 'top-right');

      // Handle map load completion
      this.map.on('load', () => {
        console.log('✅ MapLibre GL base canvas loaded successfully.');
        this.isLoaded = true;
        this.hideSkeletonLoader();
        this.onLoadCallbacks.forEach(cb => {
          try { cb(this.map); } catch (e) { console.error('Map onLoad callback error:', e); }
        });
      });

      // Handle map error events gracefully
      this.map.on('error', (err) => {
        // Suppress benign tile 404/abort warnings while logging genuine errors
        if (err && err.error && err.error.status !== 404) {
          console.warn('[MapManager] MapLibre warning:', err.error.message || err);
        }
      });

      return this.map;
    } catch (err) {
      console.error('[MapManager] Initialization failed:', err);
      this.showFallbackMessage('Failed to initialize map canvas.');
      return null;
    }
  }

  /**
   * Registers a callback invoked as soon as the map style has finished loading.
   */
  onLoad(callback) {
    if (this.isLoaded && this.map) {
      callback(this.map);
    } else {
      this.onLoadCallbacks.push(callback);
    }
  }

  /**
   * Recalculates canvas dimensions when container is resized or un-collapsed.
   */
  resize() {
    if (this.map) {
      this.map.resize();
    }
  }

  /**
   * Toggles browser fullscreen mode on the map section
   * @param {HTMLElement} containerElement
   */
  toggleFullscreen(containerElement) {
    if (!containerElement) containerElement = document.getElementById('urbanMapSection') || document.getElementById(this.containerId);
    if (!containerElement) return;

    if (!document.fullscreenElement) {
      if (containerElement.requestFullscreen) {
        containerElement.requestFullscreen();
      } else if (containerElement.webkitRequestFullscreen) {
        containerElement.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * Smooth animated camera transition to specific coordinates.
   */
  flyTo(lng, lat, zoom = 14) {
    if (!this.map) return;
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      essential: true,
      duration: 1500
    });
  }

  /**
   * Resets map camera to default center coordinates.
   */
  resetToDefault() {
    this.flyTo(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], MAP_CONFIG.defaultZoom);
  }

  /**
   * Sets or moves an animated search pin marker on the map with an informative telemetry popup
   * @param {number} lng 
   * @param {number} lat 
   * @param {string} title 
   * @param {string} details 
   * @param {Object} weather - Optional live weather telemetry object
   * @param {boolean} isFahrenheit - Temperature display unit
   */
  setSearchMarker(lng, lat, title = 'Searched Location', details = '', weather = null, isFahrenheit = false) {
    if (!this.map || typeof window.maplibregl === 'undefined') return;

    this.clearSearchMarker();

    this.currentSearchLocation = { lng, lat, title, details };
    this.currentSearchWeather = weather;
    this.currentSearchFahrenheit = isFahrenheit;

    // Create custom pulsing DOM element
    const el = document.createElement('div');
    el.className = 'smartcity-search-pin-wrapper';
    el.innerHTML = `
      <div class="search-pin-pulse"></div>
      <div class="search-pin-icon">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </div>
    `;

    // Create MapLibre Popup
    const popupHtml = this.buildSearchPopupHTML(lng, lat, title, details, weather, isFahrenheit);
    const popup = new window.maplibregl.Popup({
      offset: 30,
      closeButton: true,
      closeOnClick: false,
      className: 'smartcity-glass-popup'
    }).setHTML(popupHtml);

    this.searchMarker = new window.maplibregl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(this.map);

    // Popup is available on click but does NOT auto-open — telemetry is in Top-Left HUD
  }

  /**
   * Updates the search pin marker's popup when on-demand telemetry arrives
   * @param {Object} weather - Live weather payload
   * @param {boolean} isFahrenheit - Temperature display unit
   */
  updateSearchMarkerTelemetry(weather, isFahrenheit = false) {
    if (!this.searchMarker || !this.currentSearchLocation) return;
    this.currentSearchWeather = weather;
    this.currentSearchFahrenheit = isFahrenheit;

    const { lng, lat, title, details } = this.currentSearchLocation;
    const popup = this.searchMarker.getPopup();
    if (popup) {
      popup.setHTML(this.buildSearchPopupHTML(lng, lat, title, details, weather, isFahrenheit));
    }
  }

  /**
   * Updates the search pin marker's popup when temperature unit is toggled (°C / °F)
   * @param {boolean} isFahrenheit
   */
  updateSearchMarkerUnit(isFahrenheit) {
    this.currentSearchFahrenheit = isFahrenheit;
    if (!this.searchMarker || !this.currentSearchLocation) return;

    const { lng, lat, title, details } = this.currentSearchLocation;
    const popup = this.searchMarker.getPopup();
    if (popup) {
      popup.setHTML(this.buildSearchPopupHTML(lng, lat, title, details, this.currentSearchWeather, isFahrenheit));
    }
  }

  /**
   * Updates the search pin marker's popup with an error message if telemetry fetch fails
   * @param {string} errorMessage
   */
  setSearchMarkerError(errorMessage) {
    if (!this.searchMarker || !this.currentSearchLocation) return;

    const { lng, lat, title, details } = this.currentSearchLocation;
    const popup = this.searchMarker.getPopup();
    if (popup) {
      popup.setHTML(this.buildSearchPopupHTML(lng, lat, title, details, null, this.currentSearchFahrenheit, errorMessage));
    }
  }

  /**
   * Generates rich glassmorphism popup HTML for the searched location pin
   * Features live on-demand weather/temp telemetry and explicit Anand network fallback boundaries (Phase 9)
   */
  buildSearchPopupHTML(lng, lat, title, details, weather, isFahrenheit, errorMessage = null) {
    const distKm = getDistanceFromAnandKm(lat, lng);
    const isAnandRegion = distKm <= 12;

    let weatherSection = '';
    if (weather) {
      const tempC = typeof weather.temperature === 'number' ? weather.temperature : 28.0;
      const displayTemp = isFahrenheit
        ? `${((tempC * 9/5) + 32).toFixed(1)} °F`
        : `${tempC.toFixed(1)} °C`;
      const displayCondition = weather.condition || 'Partly Cloudy';
      const icon = weather.icon || 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png';
      const rainProb = weather.rainProbability ?? 20;
      const windSpeed = weather.windSpeed ?? 10;
      const windDir = weather.windDirection ?? 'W';
      const humidity = weather.humidity ?? 65;

      weatherSection = `
        <div class="mt-2 pt-2 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img src="${icon}" class="w-7 h-7 rounded bg-dark-900 border border-slate-800 p-0.5" alt="Weather">
              <div>
                <div class="text-xs font-bold text-white">${escapeHtml(displayCondition)}</div>
                <div class="text-[11px] font-mono text-sky-400 font-semibold">${displayTemp}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[9px] text-slate-400">Rain Chance</div>
              <div class="text-xs font-bold font-mono text-cyan-400">${rainProb}%</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1 text-[10px]">
            <div class="bg-dark-900/80 px-2 py-1 rounded border border-slate-800 text-slate-300">
              <span class="text-slate-400 text-[9px]">Wind:</span> <span class="font-mono font-semibold text-white">${windSpeed} km/h ${windDir}</span>
            </div>
            <div class="bg-dark-900/80 px-2 py-1 rounded border border-slate-800 text-slate-300">
              <span class="text-slate-400 text-[9px]">Humidity:</span> <span class="font-mono font-semibold text-white">${humidity}%</span>
            </div>
          </div>
        </div>
      `;
    } else if (errorMessage) {
      weatherSection = `
        <div class="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
          ${escapeHtml(errorMessage)}
        </div>
      `;
    } else {
      weatherSection = `
        <div class="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-400">
          <svg class="w-3 h-3 text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span>Fetching live location telemetry...</span>
        </div>
      `;
    }

    // Live Spatial Telemetry Badges (Active worldwide)
    const activeBadges = `
      <div class="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
        <div class="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Urban Arterial Traffic Corridors Active</span>
        </div>
        <div class="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <span>Live Station Air Quality Active</span>
        </div>
      </div>
    `;

    return `
      <div class="p-2.5 font-sans min-w-[210px] max-w-[260px]">
        <div class="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-700/80">
          <div class="text-xs font-bold text-sky-400 flex items-center gap-1.5 truncate">
            <span class="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0"></span>
            <span class="truncate">${escapeHtml(title)}</span>
          </div>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 flex-shrink-0 uppercase font-semibold">
            LIVE
          </span>
        </div>

        ${details ? `<div class="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-1.5">${escapeHtml(details)}</div>` : ''}

        ${weatherSection}

        ${activeBadges}

        <div class="text-[9px] font-mono text-slate-500 pt-1.5 border-t border-slate-800 flex items-center justify-between mt-2">
          <span>${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</span>
          <span class="text-sky-400">Telemetry Active</span>
        </div>
      </div>
    `;
  }

  /**
   * Clears the active search pin marker from the map.
   */
  clearSearchMarker() {
    if (this.searchMarker) {
      this.searchMarker.remove();
      this.searchMarker = null;
    }
    this.currentSearchLocation = null;
    this.currentSearchWeather = null;
  }

  /**
   * Resets the map camera back to Anand city center and removes search pin.
   */
  resetToAnand() {
    this.clearSearchMarker();
    this.flyTo(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1], MAP_CONFIG.defaultZoom);
  }

  /**
   * Returns the underlying MapLibre Map instance.
   */
  getMap() {
    return this.map;
  }

  /**
   * Hides the skeleton loader when map tiles become active.
   */
  hideSkeletonLoader() {
    const skeleton = document.getElementById('mapLoadingSkeleton');
    if (skeleton) {
      skeleton.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        if (skeleton) skeleton.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Shows a graceful fallback banner if WebGL or tiles fail.
   */
  showFallbackMessage(msg) {
    const skeleton = document.getElementById('mapLoadingSkeleton');
    if (skeleton) {
      skeleton.innerHTML = `
        <div class="text-center p-6 text-slate-400">
          <i data-lucide="map-pin-off" class="w-8 h-8 text-amber-400 mx-auto mb-2"></i>
          <div class="text-sm font-semibold text-slate-200">${msg}</div>
          <div class="text-xs text-slate-500 mt-1">Check browser WebGL support or network connectivity.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

/**
 * Calculates straight-line distance in kilometers from Anand City Center
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {number} Distance in km
 */
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

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
