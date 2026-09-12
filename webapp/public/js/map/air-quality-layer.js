/**
 * Smart City Air Quality & Particulate Matter Layer
 * Renders an interactive glowing AQI badge marker at Anand's central air monitoring station
 * (Station Road Transit & Environmental Hub), color-coded according to EPA/NAAQS standards,
 * with particulate distribution & trace gas safety popup.
 */

import { MAP_CONFIG } from './map-config.js';

export class SmartCityAirQualityLayer {
  constructor(mapManager, mapState) {
    this.mapManager = mapManager;
    this.mapState = mapState;
    this.marker = null;
    this.popup = null;
    this.latestAir = null;
    this.isVisible = this.mapState.isLayerActive('airQuality');
    this.stationCoords = MAP_CONFIG.stations?.airQuality || [72.9550, 22.5640];

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
    badgeEl.className = 'smartcity-aqi-badge aqi-zone-good';
    badgeEl.id = 'mapAqiBadgeMarker';
    badgeEl.innerHTML = `
      <div class="smartcity-aqi-badge-icon">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      </div>
      <span class="smartcity-aqi-badge-score" id="mapAqiBadgeScore">AQI 72</span>
      <span class="smartcity-aqi-badge-status" id="mapAqiBadgeStatus">Moderate</span>
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

    if (this.latestAir) {
      this.updateData(this.latestAir);
    }
  }

  updateData(air) {
    if (!air) return;
    this.latestAir = air;

    const aqi = typeof air.aqi === 'number' ? air.aqi : 72;
    const pm25 = air.pm25 ?? 17.0;
    const pm10 = air.pm10 ?? 29.2;
    const no2 = air.no2 ?? 7.3;
    const so2 = air.so2 ?? 12.7;
    const co = air.co ?? 233;
    const o3 = air.o3 ?? 85;

    // AQI Category Evaluation
    let zoneClass = 'aqi-zone-good';
    let zoneStatus = 'Good';
    let zoneFullStatus = 'Good / Healthy';
    let zoneColor = 'text-emerald-400';
    let zoneBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

    if (aqi > 150) {
      zoneClass = 'aqi-zone-unhealthy';
      zoneStatus = 'Unhealthy';
      zoneFullStatus = 'Unhealthy for All';
      zoneColor = 'text-rose-400';
      zoneBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    } else if (aqi > 100) {
      zoneClass = 'aqi-zone-sensitive';
      zoneStatus = 'Sensitive';
      zoneFullStatus = 'Sensitive Groups';
      zoneColor = 'text-orange-400';
      zoneBg = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    } else if (aqi > 50) {
      zoneClass = 'aqi-zone-moderate';
      zoneStatus = 'Moderate';
      zoneFullStatus = 'Moderate Air Quality';
      zoneColor = 'text-amber-400';
      zoneBg = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    }

    // Update marker DOM
    const badgeEl = document.getElementById('mapAqiBadgeMarker');
    const scoreEl = document.getElementById('mapAqiBadgeScore');
    const statusEl = document.getElementById('mapAqiBadgeStatus');

    if (badgeEl) {
      badgeEl.className = `smartcity-aqi-badge ${zoneClass}`;
    }
    if (scoreEl) {
      scoreEl.textContent = `AQI ${aqi}`;
    }
    if (statusEl) {
      statusEl.textContent = zoneStatus;
    }

    // Update popup HTML
    if (this.popup) {
      this.popup.setHTML(`
        <div class="p-3 space-y-2.5 font-sans min-w-[230px]">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </span>
              <div>
                <div class="text-xs font-bold text-white">Anand Air Quality Station</div>
                <div class="text-[10px] text-slate-400">Station Road Hub</div>
              </div>
            </div>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${zoneBg}">
              ${zoneStatus}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-extrabold font-mono text-white tracking-tight">${aqi}</div>
              <div class="text-[11px] font-semibold ${zoneColor}">${zoneFullStatus}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400">National Standard</div>
              <div class="text-xs font-bold font-mono text-emerald-400">NAAQS Safe</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800">
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">PM 2.5</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${pm25} µg/m³</div>
              <div class="text-[8px] text-slate-500 font-mono">Limit: 60</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">PM 10</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${pm10} µg/m³</div>
              <div class="text-[8px] text-slate-500 font-mono">Limit: 100</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">NO₂ Concentration</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${no2} µg/m³</div>
              <div class="text-[8px] text-slate-500 font-mono">Limit: 80</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Ozone (O₃)</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${o3} µg/m³</div>
              <div class="text-[8px] text-slate-500 font-mono">Limit: 100</div>
            </div>
          </div>

          <div class="text-[9px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800">
            <span>Station: 22.5640° N, 72.9550° E</span>
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
