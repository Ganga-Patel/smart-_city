// Firebase Realtime Database Client Service (Milestone 3)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { FIREBASE_CONFIG } from './config.js';

export class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isConnected = false;
    this.activeNode = 'node_01';
    this.dataCallbacks = [];
    this.connectionCallbacks = [];
    this.lastNormalizedData = null;
  }

  init() {
    try {
      console.log('🔥 Initializing Firebase SDK...');
      this.app = initializeApp(FIREBASE_CONFIG);
      this.db = getDatabase(this.app);

      // 1. Connection state monitoring
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        this.isConnected = snap.val() === true;
        console.log(`📡 Firebase Connection State: ${this.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
        this.notifyConnectionState(this.isConnected);
      });

      // 2. Direct firmware path listener (/smartcity)
      const smartcityRef = ref(this.db, 'smartcity');
      onValue(smartcityRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          this.handleRawData(val, 'smartcity');
        }
      }, (err) => {
        console.error('Firebase read error on /smartcity:', err);
      });

      // 3. MQTT Bridge path listener (/sensor)
      const sensorRef = ref(this.db, 'sensor');
      onValue(sensorRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          this.handleRawData(val, 'sensor');
        }
      }, (err) => {
        console.error('Firebase read error on /sensor:', err);
      });

    } catch (error) {
      console.error('Failed to initialize Firebase Service:', error);
      this.notifyConnectionState(false);
    }
  }

  // Set active node filter
  setActiveNode(nodeId) {
    this.activeNode = nodeId;
    if (this.lastNormalizedData) {
      this.notifyData(this.lastNormalizedData);
    }
  }

  // Normalizes diverse incoming schema formats into a unified telemetry payload
  handleRawData(raw, sourcePath) {
    let normalized = this.lastNormalizedData ? { ...this.lastNormalizedData } : this.getDefaultTelemetry();

    if (sourcePath === 'smartcity') {
      // DHT22 / DHT11
      if (raw.DHT22) {
        if (raw.DHT22.temperature !== undefined) normalized.temperature = parseFloat(raw.DHT22.temperature);
        if (raw.DHT22.humidity !== undefined) normalized.humidity = parseFloat(raw.DHT22.humidity);
      }

      // Rain sensor (0 = rain detected / closed circuit, 1 = dry)
      if (raw.Rain) {
        const val = parseInt(raw.Rain.value);
        normalized.rainRaw = isNaN(val) ? 1 : val;
        normalized.rainDetected = (normalized.rainRaw === 0);
      }

      // MQ2 Gas sensor
      if (raw.MQ2) {
        const val = parseInt(raw.MQ2.value);
        normalized.gasRaw = isNaN(val) ? 0 : val;
        // If digital 0/1, convert to representative PPM scale
        normalized.gasPpm = normalized.gasRaw <= 1 ? (normalized.gasRaw === 1 ? 480 : 120) : normalized.gasRaw;
        normalized.gasAlert = normalized.gasPpm >= 300 || normalized.gasRaw === 1;
      }

      // PIR Motion & IR Obstacle if present
      if (raw.PIR !== undefined) normalized.pirMotion = Boolean(raw.PIR.value);
      if (raw.IR !== undefined) normalized.irObstacle = Boolean(raw.IR.value === 0); // LOW = object detected

      normalized.sourceNode = 'node_01';
    } 
    else if (sourcePath === 'sensor') {
      // Data from bridge.js
      if (raw.temperature) normalized.temperature = parseFloat(raw.temperature.value ?? raw.temperature);
      if (raw.humidity) normalized.humidity = parseFloat(raw.humidity.value ?? raw.humidity);
      normalized.sourceNode = 'simulation_node';
    }

    normalized.timestamp = Date.now();
    this.lastNormalizedData = normalized;
    this.notifyData(normalized);
  }

  getDefaultTelemetry() {
    return {
      temperature: 27.5,
      humidity: 58.0,
      rainRaw: 1,
      rainDetected: false,
      gasRaw: 145,
      gasPpm: 145,
      gasAlert: false,
      pirMotion: false,
      irObstacle: false,
      reedLocked: true,
      water: { ph: 7.2, tds: 140, turbidity: 0.8, do: 8.1 },
      weather: { windSpeed: 12.4, windDir: 'ENE', lux: 780, pressure: 1013 },
      timestamp: Date.now(),
      sourceNode: 'node_01'
    };
  }

  onData(cb) {
    this.dataCallbacks.push(cb);
  }

  onConnectionChange(cb) {
    this.connectionCallbacks.push(cb);
  }

  notifyData(data) {
    this.dataCallbacks.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Data callback error:', e); }
    });
  }

  notifyConnectionState(state) {
    this.connectionCallbacks.forEach(cb => {
      try { cb(state); } catch (e) { console.error('Connection callback error:', e); }
    });
  }
}

export const firebaseService = new FirebaseService();
