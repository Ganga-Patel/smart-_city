/**
 * Smart City Map Configuration
 * Centralized coordinates, default zoom levels, tile styles, and attribution settings.
 * 
 * Location: Anand, Gujarat, India
 * Base Tile Provider: Carto Dark (OSM-derived, dark mode optimized)
 */

export const MAP_CONFIG = {
  // Anand, Gujarat, India coordinates [Longitude, Latitude] (MapLibre GeoJSON standard)
  defaultCenter: [72.9289, 22.5645],
  defaultZoom: 13.0,
  minZoom: 4.0,
  maxZoom: 18.0,
  pitch: 0,
  bearing: 0,
  
  // Designated spatial station telemetry coordinates in Anand
  stations: {
    weather: [72.9289, 22.5645],       // Anand City Center Station
    temperature: [72.9350, 22.5520],   // V.V. Nagar Thermal Microclimate Station
    airQuality: [72.9550, 22.5640]     // Anand Station Road Transit / AQI Station
  },
  
  // Basemap style specification using 100% Free OpenStreetMap tiles
  // Zero watermark, zero API key required, with comprehensive Anand, India street coverage
  style: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  
  // Layer identifiers for future modular layers
  layerKeys: {
    weather: 'weather-layer',
    temperature: 'temperature-layer',
    traffic: 'traffic-layer',
    airQuality: 'air-quality-layer'
  }
};
