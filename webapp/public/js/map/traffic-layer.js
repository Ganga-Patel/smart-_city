/**
 * Smart City Urban Traffic & Mobility Layer
 * Renders GeoJSON LineString corridors over Anand's 4 transit arteries:
 * 1. SH 188 (Anand - Vidyanagar Road)
 * 2. Station Road (Anand Junction)
 * 3. NH 48 Samarkha Expressway
 * 4. Borsad Chokdi Junction
 * 
 * Dynamically color-codes corridors based on congestion:
 * - Low Congestion (<= 25%): Emerald (#10b981)
 * - Moderate Congestion (26% - 45%): Amber (#f59e0b)
 * - Heavy Congestion (> 45%): Rose (#ef4444)
 */

// Geographic LineString paths for Anand arterial corridors
const CORRIDOR_GEOMETRIES = [
  {
    id: 'corridor-sh188',
    matchKey: 'SH 188',
    name: 'Anand - Vidyanagar Road (SH 188)',
    coordinates: [
      [72.9385, 22.5630],
      [72.9355, 22.5595],
      [72.9320, 22.5550],
      [72.9295, 22.5525],
      [72.9260, 22.5505],
      [72.9215, 22.5480]
    ],
    defaultSpeed: 29,
    defaultFreeFlow: 50,
    defaultStatus: 'Moderate Flow'
  },
  {
    id: 'corridor-station',
    matchKey: 'Station Road',
    name: 'Station Road (Anand Junction)',
    coordinates: [
      [72.9580, 22.5642],
      [72.9530, 22.5632],
      [72.9480, 22.5620],
      [72.9430, 22.5610],
      [72.9385, 22.5630]
    ],
    defaultSpeed: 23,
    defaultFreeFlow: 40,
    defaultStatus: 'Normal Flow'
  },
  {
    id: 'corridor-nh48',
    matchKey: 'NH 48',
    name: 'NH 48 Samarkha Expressway',
    coordinates: [
      [72.9820, 22.5930],
      [72.9790, 22.5810],
      [72.9765, 22.5690],
      [72.9745, 22.5550],
      [72.9720, 22.5410]
    ],
    defaultSpeed: 66,
    defaultFreeFlow: 80,
    defaultStatus: 'Rapid / Free Flow'
  },
  {
    id: 'corridor-borsad',
    matchKey: 'Borsad Chokdi',
    name: 'Borsad Chokdi Junction',
    coordinates: [
      [72.9410, 22.5580],
      [72.9440, 22.5500],
      [72.9460, 22.5450],
      [72.9485, 22.5360],
      [72.9510, 22.5250]
    ],
    defaultSpeed: 25,
    defaultFreeFlow: 45,
    defaultStatus: 'Normal Flow'
  }
];

export class SmartCityTrafficLayer {
  constructor(mapManager, mapState) {
    this.mapManager = mapManager;
    this.mapState = mapState;
    this.sourceId = 'smartcity-traffic-corridors-source';
    this.layerCasingId = 'smartcity-traffic-corridors-casing';
    this.layerLineId = 'smartcity-traffic-corridors-line';
    this.layerGlowId = 'smartcity-traffic-corridors-glow';
    this.popup = null;
    this.latestTraffic = null;
    this.isVisible = this.mapState.isLayerActive('traffic');
    this.isLayersAdded = false;

    this.init();
  }

  init() {
    this.mapManager.onLoad((map) => {
      this.setupTrafficLayers(map);
    });
  }

  setupTrafficLayers(map) {
    if (!map || this.isLayersAdded) return;

    const initialGeoJson = this.generateGeoJson(this.latestTraffic);

    try {
      if (!map.getSource(this.sourceId)) {
        map.addSource(this.sourceId, {
          type: 'geojson',
          data: initialGeoJson
        });
      }

      // 1. Soft glow halo — very thin, low opacity
      if (!map.getLayer(this.layerGlowId)) {
        map.addLayer({
          id: this.layerGlowId,
          type: 'line',
          source: this.sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 9,
            'line-opacity': 0.18,
            'line-blur': 6
          }
        });
      }

      // 2. Dark casing — slim border for road contrast
      if (!map.getLayer(this.layerCasingId)) {
        map.addLayer({
          id: this.layerCasingId,
          type: 'line',
          source: this.sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'line-color': '#0f172a',
            'line-width': 5.5,
            'line-opacity': 0.92
          }
        });
      }

      // 3. Colored corridor telemetry line — crisp & thin
      if (!map.getLayer(this.layerLineId)) {
        map.addLayer({
          id: this.layerLineId,
          type: 'line',
          source: this.sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              10, 2.5,
              13, 3.5,
              16, 5
            ],
            'line-opacity': 0.97
          }
        });
      }

      // 4. Animated dash layer on top of the line — shows traffic direction movement
      const layerDashId = this.layerLineId + '-dash';
      if (!map.getLayer(layerDashId)) {
        map.addLayer({
          id: layerDashId,
          type: 'line',
          source: this.sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              10, 0.8,
              13, 1.2,
              16, 2
            ],
            'line-opacity': 0.35,
            'line-dasharray': [3, 6]
          }
        });
        // Store dash layer id for setVisible
        this.layerDashId = layerDashId;
      }

      // Popup initialization
      this.popup = new window.maplibregl.Popup({
        offset: 15,
        closeButton: true,
        closeOnClick: false,
        className: 'smartcity-glass-popup'
      });

      // Cursor & Click Events
      map.on('mouseenter', this.layerLineId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', this.layerLineId, () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', this.layerLineId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        this.openCorridorPopup(e.lngLat, props);
      });

      this.isLayersAdded = true;
    } catch (err) {
      console.error('[TrafficLayer] Error setting up MapLibre layers:', err);
    }
  }

  generateGeoJson(trafficData) {
    const corridors = trafficData?.corridors || [];
    const overallDelay = trafficData?.delaySeconds ?? 45;

    // Support dynamic corridor geometries for any searched location worldwide
    if (corridors.length > 0 && Array.isArray(corridors[0].coordinates)) {
      const features = corridors.map((c, idx) => {
        const speed = c.speed ?? 35;
        const freeFlow = c.freeFlow ?? 50;
        const congestion = c.congestion ?? Math.max(0, Math.min(100, Math.round((1 - (speed / freeFlow)) * 100)));
        let color = '#10b981';
        let flowRating = 'Optimal Flow';
        if (congestion > 45) {
          color = '#ef4444';
          flowRating = 'Constrained';
        } else if (congestion > 25) {
          color = '#f59e0b';
          flowRating = 'Moderate Flow';
        }

        return {
          type: 'Feature',
          properties: {
            id: c.id || `corridor-${idx}`,
            name: c.name || `Corridor ${idx + 1}`,
            speed: speed,
            freeFlow: freeFlow,
            status: c.status || flowRating,
            congestion: congestion,
            color: color,
            flowRating: flowRating,
            delaySec: c.delaySec ?? Math.round(overallDelay * (congestion / 40))
          },
          geometry: {
            type: 'LineString',
            coordinates: c.coordinates
          }
        };
      });

      return {
        type: 'FeatureCollection',
        features: features
      };
    }

    const features = CORRIDOR_GEOMETRIES.map((geom) => {
      // Match with live API telemetry
      const live = corridors.find(c => c.name.includes(geom.matchKey) || geom.matchKey.includes(c.name));
      const speed = live?.speed ?? geom.defaultSpeed;
      const freeFlow = live?.freeFlow ?? geom.defaultFreeFlow;
      const status = live?.status ?? geom.defaultStatus;

      // Calculate congestion %: max(0, round((1 - speed/freeFlow) * 100))
      const congestion = Math.max(0, Math.min(100, Math.round((1 - (speed / freeFlow)) * 100)));

      // Color evaluation:
      // <= 25%: Emerald (#10b981)
      // 26% - 45%: Amber (#f59e0b)
      // > 45%: Rose (#ef4444)
      let color = '#10b981';
      let flowRating = 'Optimal Flow';
      if (congestion > 45) {
        color = '#ef4444';
        flowRating = 'Constrained';
      } else if (congestion > 25) {
        color = '#f59e0b';
        flowRating = 'Moderate Flow';
      }

      return {
        type: 'Feature',
        properties: {
          id: geom.id,
          name: geom.name,
          speed: speed,
          freeFlow: freeFlow,
          status: status,
          congestion: congestion,
          color: color,
          flowRating: flowRating,
          delaySec: Math.round(overallDelay * (congestion / 40))
        },
        geometry: {
          type: 'LineString',
          coordinates: geom.coordinates
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  updateData(trafficData) {
    if (!trafficData) return;
    this.latestTraffic = trafficData;

    const map = this.mapManager.getMap();
    if (!map || !this.isLayersAdded) return;

    const source = map.getSource(this.sourceId);
    if (source) {
      const updatedGeoJson = this.generateGeoJson(trafficData);
      source.setData(updatedGeoJson);
    }
  }

  openCorridorPopup(lngLat, props) {
    if (!this.popup) return;
    const map = this.mapManager.getMap();
    if (!map) return;

    const { name, speed, freeFlow, status, congestion, color, flowRating, delaySec } = props;

    let badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (congestion > 45) {
      badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    } else if (congestion > 25) {
      badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }

    this.popup
      .setLngLat(lngLat)
      .setHTML(`
        <div class="p-3 space-y-2.5 font-sans min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </span>
              <div>
                <div class="text-xs font-bold text-white truncate max-w-[140px]">${escapeHtml(name)}</div>
                <div class="text-[10px] text-slate-400">Arterial Corridor</div>
              </div>
            </div>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${badgeClass}">
              ${escapeHtml(status)}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-extrabold font-mono text-white tracking-tight">${speed} km/h</div>
              <div class="text-[10px] text-slate-400">Free-Flow: <b class="text-slate-300 font-mono">${freeFlow} km/h</b></div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400">Congestion</div>
              <div class="text-xs font-bold font-mono" style="color: ${color};">${congestion}%</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800">
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Travel Delay</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">+${delaySec} sec</div>
            </div>
            <div class="bg-dark-900/80 p-1.5 rounded-lg border border-slate-800">
              <div class="text-[9px] text-slate-400">Flow Rating</div>
              <div class="font-mono text-slate-200 font-semibold text-xs">${flowRating}</div>
            </div>
          </div>

          <div class="text-[9px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800">
            <span>Urban Arterial Mobility</span>
            <span class="text-emerald-400">Live Traffic Sync</span>
          </div>
        </div>
      `)
      .addTo(map);
  }

  setVisible(visible) {
    this.isVisible = Boolean(visible);
    const map = this.mapManager.getMap();
    if (!map || !this.isLayersAdded) return;

    const val = this.isVisible ? 'visible' : 'none';
    try {
      if (map.getLayer(this.layerGlowId)) map.setLayoutProperty(this.layerGlowId, 'visibility', val);
      if (map.getLayer(this.layerCasingId)) map.setLayoutProperty(this.layerCasingId, 'visibility', val);
      if (map.getLayer(this.layerLineId)) map.setLayoutProperty(this.layerLineId, 'visibility', val);
      if (this.layerDashId && map.getLayer(this.layerDashId)) map.setLayoutProperty(this.layerDashId, 'visibility', val);

      if (!this.isVisible && this.popup) {
        this.popup.remove();
      }
    } catch (err) {
      console.warn('[TrafficLayer] Error toggling visibility:', err);
    }
  }

  remove() {
    const map = this.mapManager.getMap();
    if (!map) return;

    try {
      if (this.layerDashId && map.getLayer(this.layerDashId)) map.removeLayer(this.layerDashId);
      if (map.getLayer(this.layerLineId)) map.removeLayer(this.layerLineId);
      if (map.getLayer(this.layerCasingId)) map.removeLayer(this.layerCasingId);
      if (map.getLayer(this.layerGlowId)) map.removeLayer(this.layerGlowId);
      if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
      if (this.popup) this.popup.remove();
      this.isLayersAdded = false;
    } catch (e) {
      console.warn('Error removing traffic layers:', e);
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
