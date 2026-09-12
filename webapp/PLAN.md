# Smart City Web Dashboard - Architecture & Implementation Plan

This document outlines the end-to-end design, technology stack, component hierarchy, database interaction layer, and milestone-based roadmap for the **Smart City Web Dashboard** located in the `webapp/` directory.

---

## 1. Executive Summary & Dashboard Goals

The Web Dashboard serves as the central visualization and monitoring hub for the Smart City IoT infrastructure. It provides operators and stakeholders with real-time insight into urban metrics, environmental quality, hazard alerts, and security telemetry collected from physical NodeMCU/ESP8266 nodes, simulated devices, and edge gateways.

### Key Objectives:
* **Zero-Latency Real-Time Telemetry**: Immediate visual updates via Firebase Realtime Database WebSockets (`onValue` listeners).
* **Multi-Domain Monitoring**: Integrated views for Climate (Temp/Humidity/Rain), Air Quality/Hazard (MQ-2/MQ-135 Gas PPM), Physical Security (PIR Motion & IR Obstacle), and Future Water Quality/Wind Telemetry.
* **Proactive Hazard Alerting**: Visual alarms, banner notifications, and audible alerts when thresholds (e.g., Gas PPM > 400 or Rain detected) are triggered.
* **Historical Trend Analysis**: Interactive rolling timeline charts powered by Chart.js.
* **Multi-Node Flexibility**: Easily switch between physical station nodes (`node_01`), Raspberry Pi gateways, and simulation feeds.

---

## 2. Technology Stack & Architectural Decision

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Browser (Client)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   UI Layer: TailwindCSS + HTML5 Glassmorphism UI      │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Visualization: Chart.js (Rolling Time-Series)       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Icons & Assets: Lucide Icons CDN / SVG              │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Data Layer: Firebase JavaScript SDK v10 (Modular)   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────▲──────────────────────────────┘
                               │ Real-time WebSockets
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Realtime Database Cloud               │
│         (https://smartcity-61fad-default-rtdb)              │
└──────────────────────────────▲──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
        NodeMCU / ESP8266              Node.js MQTT Bridge
         (Direct Upload)                  (bridge.js)
```

### Chosen Stack:
1. **Frontend Architecture**: Lightweight Single Page Application (SPA) using Modern ES Modules, HTML5, and TailwindCSS (via CDN for instant zero-build development or Vite for production bundling).
2. **Backend / Static Server**: Express.js server (`webapp/server.js`) to serve static assets and handle future webhook integrations / API proxying.
3. **Database Client**: Official Firebase JavaScript Client SDK (`firebase/app`, `firebase/database`) directly streaming database state to the browser.
4. **Data Visualization**: `Chart.js` for interactive line charts, sparklines, and gauge progress indicators.

---

## 3. Directory Layout (`webapp/`)

```
webapp/
├── PLAN.md                     # Master implementation plan (this document)
├── server.js                   # Express web server serving dashboard assets
├── public/                     # Static client files
│   ├── index.html              # Main single-page dashboard layout
│   ├── css/
│   │   └── style.css           # Custom styles, animations, and glassmorphism styling
│   └── js/
│       ├── config.js           # Firebase credentials & default alert thresholds
│       ├── firebase-service.js # RTDB listeners, data normalizer, and fallback parser
│       ├── charts.js           # Chart.js initialization and rolling timeline updates
│       ├── alerts.js           # Threshold validation, toast notifications, sound buzzer
│       └── app.js              # Main UI controller, DOM binding, and node selector
└── assets/                     # Sound files, icons, and diagrams
    └── sounds/
        └── alert.mp3           # Hazard warning audio chime
```

---

## 4. UI/UX Wireframe & Component Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏙️ SMART CITY COMMAND CENTER        [ Node: Sector 4 Station ▼ ] [● LIVE] ☀️│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│ │ 🌡️ TEMPERATURE │ │ 💧 HUMIDITY    │ │ 🌧️ RAIN STATUS │ │ 💨 AIR QUALITY │ │
│ │    28.4 °C     │ │     64.2 %     │ │    DRY / CLEAR │ │    142 PPM     │ │
│ │ Min: 22 Max: 31│ │ Normal Zone    │ │  Precip: 0 mm  │ │ Status: GOOD   │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ ┌────────────────────────────┐ │
│ │ 📈 Climate Trends (Temp & Humidity)      │ │ 🚨 Safety & Security Matrix│ │
│ │                                          │ │ • PIR Motion: CLEAR        │ │
│ │ [~~~~~~~~ Temperature Line ~~~~~~~~]     │ │ • IR Obstacle: CLEAR       │ │
│ │ [........ Humidity Line ...........]     │ │ • MQ-2 Gas: NORMAL         │ │
│ │                                          │ │ • Rain Sensor: NO RAIN     │ │
│ └──────────────────────────────────────────┘ └────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ ┌────────────────────────────┐ │
│ │ 🧪 Water Quality Telemetry (Station B)   │ │ 📜 Real-time Event Log     │ │
│ │ • pH: 7.2 (Optimal)  • TDS: 180 ppm      │ │ 14:02 - Node 01 Connected  │ │
│ │ • Turbidity: 1.2 NTU • DO: 7.8 mg/L      │ │ 14:05 - Temp updated: 28°C │ │
│ └──────────────────────────────────────────┘ └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Ingestion & Compatibility Engine

Because telemetry currently arrives in two formats (Direct Firebase vs. Bridge format), the dashboard will incorporate a **Data Normalizer** inside `firebase-service.js`:

```javascript
// Data Normalizer Strategy
function normalizeData(snapshot) {
  const data = snapshot.val();
  
  // Format 1: Direct Firmware Format (/smartcity/)
  if (data?.smartcity) {
    return {
      temperature: data.smartcity?.DHT22?.temperature ?? null,
      humidity: data.smartcity?.DHT22?.humidity ?? null,
      rain: data.smartcity?.Rain?.value === 0 ? "RAINING" : "DRY",
      gas: data.smartcity?.MQ2?.value ?? 0,
      timestamp: Date.now()
    };
  }
  
  // Format 2: Bridge Format (/sensor/)
  if (data?.sensor) {
    return {
      temperature: data.sensor?.temperature?.value ?? null,
      humidity: data.sensor?.humidity?.value ?? null,
      rain: "DRY",
      gas: 0,
      timestamp: data.sensor?.temperature?.timestamp ?? Date.now()
    };
  }
}
```

---

## 6. Implementation Milestones

### 📍 Milestone 1: Project Scaffold & Server Setup
* Initialize `webapp/package.json` with `express` dependency (or integrate with root `package.json`).
* Create `webapp/server.js` to serve static assets from `webapp/public/` on port `3000`.
* Update root `package.json` scripts:
  * `"dev"`: `"node webapp/server.js"`
  * `"start-web"`: `"node webapp/server.js"`

### 📍 Milestone 2: UI Foundation & Dashboard Layout
* Build `webapp/public/index.html` with responsive grid layout using TailwindCSS.
* Create high-contrast dark-mode theme with glassmorphism card styling.
* Add header with active connection status indicator, live digital clock, and node switcher dropdown.

### 📍 Milestone 3: Real-Time Firebase Client Integration
* Configure Firebase Web SDK in `webapp/public/js/config.js` using credentials from [`API.txt`](file:///D:/smartcity/API.txt).
* Implement real-time listeners for `/smartcity` and `/sensor` paths in `webapp/public/js/firebase-service.js`.
* Update live DOM elements dynamically with smooth transition animations.

### 📍 Milestone 4: Time-Series Charts & Visual Analytics
* Implement `webapp/public/js/charts.js` using Chart.js.
* Create multi-axis Climate Trend chart (Temperature on Left Y-Axis, Humidity on Right Y-Axis).
* Create Gas PPM & Air Quality chart with dynamic colored threshold zones.
* Implement a circular buffer keeping the latest 30 data points.

### 📍 Milestone 5: Alert System & Event Logging
* Build `webapp/public/js/alerts.js` for threshold monitoring:
  * Temperature > 35°C (High Heat Warning)
  * Gas PPM / Digital State == 1 (Hazardous Gas Warning)
  * Rain Detected == 0 (Precipitation Alert)
  * Motion / Obstacle Detected (Security Alert)
* Include sound alert toggle, popup notification toasts, and a scrollable event audit log.

### 📍 Milestone 6: Testing & Simulation Integration
* Test with live data from ESP8266 node and simulation MQTT bridge (`bridge.js`).
* Provide an offline mock/demo mode toggle for demonstrations when hardware is disconnected.

---

## 7. Execution Checklist

- [ ] Create `webapp/` directory structure and files.
- [ ] Create `webapp/server.js` Express server.
- [ ] Create `webapp/public/index.html` dashboard layout.
- [ ] Create `webapp/public/css/style.css` styling.
- [ ] Create `webapp/public/js/config.js` with Firebase configuration.
- [ ] Create `webapp/public/js/firebase-service.js` with RTDB listener and normalizer.
- [ ] Create `webapp/public/js/charts.js` with Chart.js time-series charts.
- [ ] Create `webapp/public/js/alerts.js` with threshold rules and notification toasts.
- [ ] Create `webapp/public/js/app.js` main orchestration script.
- [ ] Verify execution via `npm run dev` / `node webapp/server.js`.
