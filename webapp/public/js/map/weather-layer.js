/**
 * Smart City Weather Telemetry Layer
 * Renders custom non-intrusive interactive weather badge marker at Anand weather station,
 * displaying live sky condition, rain probability, and opening dark glassmorphic popup.
 */

import { MAP_CONFIG } from './map-config.js';

export class SmartCityWeatherLayer {
  constructor(mapManager, mapState) {
    this.mapManager = mapManager;
    this.mapState = mapState;
    this.marker = null;
    this.popup = null;
    this.latestWeather = null;
    this.isFahrenheit = false;
    this.isVisible = this.mapState.isLayerActive('weather');

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
    badgeEl.className = 'smartcity-weather-badge';
    badgeEl.id = 'mapWeatherBadgeMarker';
    badgeEl.innerHTML = `
      <img src="https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0003_white_cloud.png" class="smartcity-weather-badge-icon" id="mapWeatherBadgeIcon" alt="Sky">
      <span class="smartcity-weather-badge-text" id="mapWeatherBadgeText">Overcast</span>
      <span class="smartcity-weather-badge-rain" id="mapWeatherBadgeRain">61% Rain</span>
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
      .setLngLat(MAP_CONFIG.defaultCenter)
      .setPopup(this.popup);

    if (this.isVisible) {
      this.marker.addTo(map);
    }

    // If we have cached telemetry data, update immediately
    if (this.latestWeather) {
      this.updateData(this.latestWeather, this.isFahrenheit);
    }
  }

  updateData(weather, isFahrenheit = false) {
    if (!weather) return;
    this.latestWeather = weather;
    this.isFahrenheit = isFahrenheit;

    // Update marker DOM text and icon
    const iconEl = document.getElementById('mapWeatherBadgeIcon');
    const textEl = document.getElementById('mapWeatherBadgeText');
    const rainEl = document.getElementById('mapWeatherBadgeRain');

    if (iconEl && weather.icon) {
      iconEl.src = weather.icon;
    }
    if (textEl && weather.condition) {
      textEl.textContent = weather.condition;
    }
    if (rainEl) {
      const rainProb = weather.rainProbability ?? 0;
      rainEl.textContent = `${rainProb}% Rain`;
    }

    // Format temperature
    const tempC = typeof weather.temperature === 'number' ? weather.temperature : 28.2;
    const displayTemp = isFahrenheit 
      ? `${((tempC * 9/5) + 32).toFixed(1)} °F`
      : `${tempC.toFixed(1)} °C`;

    const windSpeed = weather.windSpeed ?? 11;
    const windDir = weather.windDirection ?? 'W';
    const windDeg = weather.windDegree ?? 270;
    const pressure = weather.pressure ?? 1004;
    const humidity = weather.humidity ?? 68;
    const rainProb = weather.rainProbability ?? 61;
    const precip = (weather.precipitation ?? weather.rain ?? 0.0).toFixed(1);
    const condition = weather.condition ?? 'Partly Cloudy';
    const iconUrl = weather.icon || 'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0003_white_cloud.png';

    // Update popup HTML
    if (this.popup) {
      this.popup.setHTML(`
        <div class="p-3 space-y-2.5 font-sans min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
              </span>
              <div>
                <div class="text-xs font-bold text-white">Anand Weather Station</div>
                <div class="text-[10px] text-slate-400">Live External Telemetry</div>
              </div>
            </div>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">LIVE</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img src="${iconUrl}" class="w-8 h-8 rounded-lg bg-dark-800 p-0.5 border border-slate-700" alt="Weather">
              <div>
                <div class="text-xs font-bold text-white">${escapeHtml(condition)}</div>
                <div class="text-[11px] font-mono text-sky-400 font-semibold">${displayTemp}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400">Rain Chance</div>
              <div class="text-xs font-bold font-mono text-cyan-400">${rainProb}%</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800">
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Wind Heading</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${windSpeed} km/h ${windDir}</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Barometer</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${pressure} hPa</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Precipitation</div>
              <div class="font-mono text-cyan-300 font-semibold text-xs">${precip} mm</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Humidity</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${humidity}%</div>
            </div>
          </div>

          <div class="text-[9px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800">
            <span>Center: 22.5645° N, 72.9289° E</span>
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

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
