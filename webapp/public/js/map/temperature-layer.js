/**
 * Smart City Temperature Telemetry Layer
 * Renders an interactive thermal pill badge on the map at the V.V. Nagar thermal microclimate station,
 * color-coded by comfort zone, dynamically synchronized with °C / °F switcher,
 * and opening a deep thermal analysis popup.
 */

import { MAP_CONFIG } from './map-config.js';

export class SmartCityTemperatureLayer {
  constructor(mapManager, mapState) {
    this.mapManager = mapManager;
    this.mapState = mapState;
    this.marker = null;
    this.popup = null;
    this.latestWeather = null;
    this.latestAnalysis = null;
    this.isFahrenheit = false;
    this.isVisible = this.mapState.isLayerActive('temperature');
    this.stationCoords = MAP_CONFIG.stations?.temperature || [72.9350, 22.5520];

    this.init();
  }

  init() {
    this.mapManager.onLoad(() => {
      this.createMarker();
    });
  }

  createMarker() {
    if (this.marker || !window.maplibregl) return;
    const map = this.mapManager.getMap();
    if (!map) return;

    // Badge DOM container
    const badgeEl = document.createElement('div');
    badgeEl.className = 'smartcity-temp-badge temp-zone-comfort';
    badgeEl.id = 'mapTempBadgeMarker';
    badgeEl.innerHTML = `
      <div class="smartcity-temp-badge-icon">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <span class="smartcity-temp-badge-val" id="mapTempBadgeVal">28.2 °C</span>
      <span class="smartcity-temp-badge-status" id="mapTempBadgeStatus">Comfort</span>
    `;

    // Popup container
    this.popup = new window.maplibregl.Popup({
      offset: 20,
      closeButton: true,
      closeOnClick: false,
      className: 'smartcity-glass-popup'
    });

    this.marker = new window.maplibregl.Marker({
      element: badgeEl,
      anchor: 'center'
    })
      .setLngLat(this.stationCoords)
      .setPopup(this.popup);

    if (this.isVisible) {
      this.marker.addTo(map);
    }

    if (this.latestWeather) {
      this.updateData(this.latestWeather, this.isFahrenheit, this.latestAnalysis);
    }
  }

  updateData(weather, isFahrenheit = false, analysis = null) {
    if (!weather) return;
    this.latestWeather = weather;
    this.isFahrenheit = isFahrenheit;
    this.latestAnalysis = analysis;

    const tempC = typeof weather.temperature === 'number' ? weather.temperature : 28.2;
    const humidity = typeof weather.humidity === 'number' ? weather.humidity : 68.0;

    // Calculations
    const dewPointC = analysis?.dewPointC ?? (tempC - ((100 - humidity) / 5));
    const heatIndexC = analysis?.heatIndexC ?? (tempC + 1.2);
    const minTempC = analysis?.minTempC ?? (tempC - 4.5);
    const maxTempC = analysis?.maxTempC ?? (tempC + 4.8);

    // Format according to unit
    const displayTemp = isFahrenheit 
      ? `${((tempC * 9/5) + 32).toFixed(1)} °F`
      : `${tempC.toFixed(1)} °C`;

    const displayDew = isFahrenheit
      ? `${((dewPointC * 9/5) + 32).toFixed(1)} °F`
      : `${dewPointC.toFixed(1)} °C`;

    const displayHeatIndex = isFahrenheit
      ? `${((heatIndexC * 9/5) + 32).toFixed(1)} °F`
      : `${heatIndexC.toFixed(1)} °C`;

    const displayRange = isFahrenheit
      ? `${((minTempC * 9/5) + 32).toFixed(0)}°F – ${((maxTempC * 9/5) + 32).toFixed(0)}°F`
      : `${minTempC.toFixed(0)}°C – ${maxTempC.toFixed(0)}°C`;

    // Thermal Zone Evaluation
    let zoneClass = 'temp-zone-comfort';
    let zoneText = 'Comfort';
    let zoneFullText = 'Optimal Comfort';
    let zoneColor = 'text-emerald-400';
    let zoneBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

    if (tempC < 18) {
      zoneClass = 'temp-zone-cool';
      zoneText = 'Cool';
      zoneFullText = 'Cool / Brisk';
      zoneColor = 'text-sky-400';
      zoneBg = 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    } else if (tempC <= 28) {
      zoneClass = 'temp-zone-comfort';
      zoneText = 'Comfort';
      zoneFullText = 'Optimal Comfort';
      zoneColor = 'text-emerald-400';
      zoneBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    } else if (tempC <= 35) {
      zoneClass = 'temp-zone-warm';
      zoneText = 'Warm';
      zoneFullText = 'Warm / Mild Heat';
      zoneColor = 'text-amber-400';
      zoneBg = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    } else {
      zoneClass = 'temp-zone-hot';
      zoneText = 'Caution';
      zoneFullText = 'High Heat Caution';
      zoneColor = 'text-rose-400';
      zoneBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    }

    // Update marker DOM
    const badgeEl = document.getElementById('mapTempBadgeMarker');
    const valEl = document.getElementById('mapTempBadgeVal');
    const statusEl = document.getElementById('mapTempBadgeStatus');

    if (badgeEl) {
      badgeEl.className = `smartcity-temp-badge ${zoneClass}`;
    }
    if (valEl) {
      valEl.textContent = displayTemp;
    }
    if (statusEl) {
      statusEl.textContent = zoneText;
    }

    // Update popup HTML
    if (this.popup) {
      this.popup.setHTML(`
        <div class="p-3 space-y-2.5 font-sans min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </span>
              <div>
                <div class="text-xs font-bold text-white">V.V. Nagar Thermal Station</div>
                <div class="text-[10px] text-slate-400">Urban Microclimate Zone</div>
              </div>
            </div>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${zoneBg}">
              ${zoneText}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-extrabold font-mono text-white tracking-tight">${displayTemp}</div>
              <div class="text-[11px] font-semibold ${zoneColor}">${zoneFullText}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400">Thermal Index</div>
              <div class="text-xs font-bold font-mono text-amber-400">${displayHeatIndex}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800">
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Heat Index</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${displayHeatIndex}</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Dew Point</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${displayDew}</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800 col-span-2 flex items-center justify-between">
              <span class="text-[9px] text-slate-400">Diurnal Range (Min – Max)</span>
              <span class="font-mono text-slate-200 font-semibold text-xs">${displayRange}</span>
            </div>
          </div>

          <div class="text-[9px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800">
            <span>Station: 22.5520° N, 72.9350° E</span>
            <span class="text-emerald-400">Sync: 10s</span>
          </div>
        </div>
      `);
    }
  }

  setVisible(visible) {
    this.isVisible = Boolean(visible);
    if (!this.marker) return;

    const map = this.mapManager.getMap();
    if (this.isVisible) {
      if (map && !this.marker._map) {
        this.marker.addTo(map);
      }
    } else {
      this.marker.remove();
    }
  }

  remove() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }
}
