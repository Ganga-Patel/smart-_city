/**
 * Smart City Map State Management
 * Handles persistence of map visibility, active layer states, and camera preferences
 * across browser reloads using localStorage.
 */

const STORAGE_KEYS = {
  MAP_VISIBLE: 'smartcity_map_visible',
  MAP_LAYERS: 'smartcity_map_layers',
  LAST_LOCATION: 'smartcity_map_last_location'
};

export class SmartCityMapState {
  constructor() {
    this.isMapVisible = true;
    this.activeLayers = {
      weather: true,
      temperature: true,
      traffic: true,
      airQuality: true
    };
    this.isFullscreen = false;
    this.listeners = {
      visibilityChange: [],
      layerChange: [],
      locationChange: []
    };

    this.loadPreferences();
  }

  /**
   * Load stored preferences from browser localStorage
   */
  loadPreferences() {
    try {
      // Map visibility
      const storedVis = localStorage.getItem(STORAGE_KEYS.MAP_VISIBLE);
      if (storedVis !== null) {
        this.isMapVisible = storedVis === 'true';
      }

      // Active layers
      const storedLayers = localStorage.getItem(STORAGE_KEYS.MAP_LAYERS);
      if (storedLayers) {
        const parsed = JSON.parse(storedLayers);
        this.activeLayers = { ...this.activeLayers, ...parsed };
      }
    } catch (err) {
      console.warn('[MapState] Error loading localStorage preferences:', err);
    }
  }

  /**
   * Save current preferences to browser localStorage
   */
  savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEYS.MAP_VISIBLE, String(this.isMapVisible));
      localStorage.setItem(STORAGE_KEYS.MAP_LAYERS, JSON.stringify(this.activeLayers));
    } catch (err) {
      console.warn('[MapState] Error saving localStorage preferences:', err);
    }
  }

  /**
   * Set map section visibility
   * @param {boolean} visible
   */
  setMapVisible(visible) {
    this.isMapVisible = Boolean(visible);
    this.savePreferences();
    this.emit('visibilityChange', this.isMapVisible);
  }

  /**
   * Toggle a specific layer on or off
   * @param {string} layerKey - 'weather', 'temperature', 'traffic', 'airQuality'
   */
  toggleLayer(layerKey) {
    if (layerKey in this.activeLayers) {
      this.activeLayers[layerKey] = !this.activeLayers[layerKey];
      this.savePreferences();
      this.emit('layerChange', { layerKey, isActive: this.activeLayers[layerKey], allLayers: this.activeLayers });
      return this.activeLayers[layerKey];
    }
    return false;
  }

  /**
   * Explicitly set a layer's active state
   * @param {string} layerKey - 'weather', 'temperature', 'traffic', 'airQuality'
   * @param {boolean} isActive
   */
  setLayerActive(layerKey, isActive) {
    if (layerKey in this.activeLayers) {
      this.activeLayers[layerKey] = Boolean(isActive);
      this.savePreferences();
      this.emit('layerChange', { layerKey, isActive: this.activeLayers[layerKey], allLayers: this.activeLayers });
      return this.activeLayers[layerKey];
    }
    return false;
  }

  /**
   * Check if a layer is currently active
   * @param {string} layerKey
   */
  isLayerActive(layerKey) {
    return Boolean(this.activeLayers[layerKey]);
  }

  /**
   * Register event listener
   * @param {'visibilityChange' | 'layerChange' | 'locationChange'} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Emit event to registered listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => {
        try { fn(data); } catch (e) { console.error(`Error in ${event} listener:`, e); }
      });
    }
  }
}
