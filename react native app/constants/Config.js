// Firebase Configuration & Sensor Alert Thresholds

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6BVnaEqgXYZK2MdRDxSK0lXiLWa7zDDc",
  authDomain: "smartcity-61fad.firebaseapp.com",
  databaseURL: "https://smartcity-61fad-default-rtdb.firebaseio.com",
  projectId: "smartcity-61fad",
  storageBucket: "smartcity-61fad.appspot.com",
  messagingSenderId: "367252086307",
  appId: "1:367252086307:web:86b5daefc70b8f41639d67"
};

export const DEFAULT_THRESHOLDS = {
  temperatureMaxC: 38,
  temperatureMinC: 5,
  humidityMax: 85,
  gasPpmWarning: 300,
  gasPpmCritical: 500,
  maxHistoryPoints: 20
};

export const NODES = [
  { id: 'node_01', name: 'Sector 4 Station', hardware: 'NodeMCU ESP8266', path: 'smartcity' },
  { id: 'simulation_node', name: 'Wokwi Virtual Node', hardware: 'ESP32 (MQTT)', path: 'sensor' },
  { id: 'gateway_rpi', name: 'Central Gateway', hardware: 'Raspberry Pi 4', path: 'smartcity/gateway' }
];
