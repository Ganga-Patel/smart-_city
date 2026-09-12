// Firebase Configuration & Dashboard Alert Thresholds

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
  temperatureMaxC: 38,       // Heat spike alert threshold (°C)
  temperatureMinC: 5,        // Freezing alert threshold (°C)
  humidityMax: 85,           // High humidity threshold (%)
  gasPpmWarning: 300,        // Elevated gas warning (PPM)
  gasPpmCritical: 500,       // Hazardous gas alarm (PPM)
  maxChartPoints: 25         // Rolling buffer size for charts
};

export const NODES_METADATA = {
  node_01: {
    name: "Sector 4 Station",
    hardware: "NodeMCU ESP8266",
    location: "Downtown Sector 4",
    path: "smartcity"
  },
  simulation_node: {
    name: "Wokwi Virtual Node",
    hardware: "ESP32 (MQTT Bridge)",
    location: "Simulation Lab",
    path: "sensor"
  },
  gateway_rpi: {
    name: "Central Gateway",
    hardware: "Raspberry Pi 4",
    location: "Command HQ",
    path: "smartcity/gateway"
  }
};
