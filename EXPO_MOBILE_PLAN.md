# Smart City Mobile App - React Native (Expo Go) Architecture & Implementation Plan

This document provides a comprehensive blueprint for converting and expanding the **Smart City IoT Command Center** into a native mobile application using **React Native** and **Expo (Expo Go compatible)**.

---

## 1. Executive Summary & Mobile Architecture

The mobile app delivers real-time urban telemetry, security alerts, and environmental analytics directly to Android and iOS smartphones. It is built to run seamlessly inside **Expo Go** for rapid development and testing without requiring native build tools.

### Core Mobile Capabilities:
* **Real-Time Synchronous Streaming**: Firebase Realtime Database WebSockets streaming live sensor data directly to mobile screens.
* **Native Mobile Iconography**: Optimized multi-platform vector icons (`@expo/vector-icons` and `lucide-react-native`) for climate, air quality, rain, and surveillance hardware.
* **Emergency Hazard Alerts & Haptics**: Foreground banner overlays, local push notifications via `expo-notifications`, audio sirens via `expo-av`, and tactile alert pulses via `expo-haptics`.
* **Interactive Mobile Charts**: Smooth, touch-enabled time-series graphs powered by `react-native-chart-kit` or `victory-native`.
* **Station / Node Switching**: Bottom-sheet selector to monitor multiple city sectors.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Device (Expo Go)                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Navigation: Expo Router / Bottom Tabs Navigator     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   UI: NativeWind (Tailwind) / React Native Paper      │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Icons: @expo/vector-icons (MaterialCommunityIcons)  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Telemetry Engine: Firebase JS SDK v10 (Modular)     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   Feedback: Expo Notifications + Haptics + Audio      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────▲──────────────────────────────┘
                               │ Real-time WebSockets
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Realtime Database Cloud               │
│         (https://smartcity-61fad-default-rtdb)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Mobile Iconography & Component Mappings

Mobile platforms rely heavily on clear visual indicators. Below is the complete icon mapping using `@expo/vector-icons` (`MaterialCommunityIcons`, `Ionicons`) and `lucide-react-native`:

| Sensor / Module | Primary Icon (`MaterialCommunityIcons`) | Alternate (`lucide-react-native`) | Normal State Color | Trigger / Alert Color |
| :--- | :--- | :--- | :--- | :--- |
| **🌡️ Temperature** | `thermometer` | `Thermometer` | `#10B981` (Green) | `#EF4444` (Heat Spike Red) |
| **💧 Humidity** | `water-percent` | `Droplets` | `#38BDF8` (Sky Blue) | `#F59E0B` (Moisture Amber) |
| **🌧️ Rain Detection** | `weather-rainy` / `weather-sunny` | `CloudRain` / `Sun` | `#F59E0B` (Sun Gold) | `#6366F1` (Rain Indigo) |
| **💨 MQ-2 Gas / Smoke** | `gas-cylinder` / `fire-alert` | `Wind` / `Flame` | `#10B981` (Clean Green) | `#EF4444` (Hazard Red) |
| **🚨 PIR Motion** | `motion-sensor` | `Activity` | `#10B981` (Clear Green) | `#EF4444` (Intrusion Red) |
| **📡 IR Obstacle** | `radar` | `Scan` | `#10B981` (Clear Green) | `#F59E0B` (Obstacle Amber) |
| **🔒 Cabinet Reed Switch** | `lock` / `lock-open-variant` | `Lock` / `Unlock` | `#10B981` (Secure) | `#EF4444` (Breach Red) |
| **🧪 Water pH** | `ph` / `test-tube` | `FlaskConical` | `#06B6D4` (Cyan) | `#EF4444` (Acid/Base Alert) |
| **🌊 Water Turbidity** | `waves` | `Waves` | `#06B6D4` (Cyan) | `#F59E0B` (Murky Amber) |
| **🧂 Water TDS** | `water-check` | `ShieldCheck` | `#06B6D4` (Cyan) | `#EF4444` (High Dissolved Solids)|
| **💨 Wind Velocity** | `weather-windy` | `Wind` | `#F59E0B` (Amber) | `#EF4444` (Gale Force Red) |
| **🧭 Wind Direction** | `compass` / `navigation` | `Compass` | `#F59E0B` (Amber) | `#F59E0B` (Amber) |
| **💡 Ambient Light** | `white-balance-sunny` | `Sun` | `#FBBF24` (Yellow) | `#64748B` (Dark Slate) |
| **📊 Tab: Dashboard** | `view-dashboard-outline` | `LayoutDashboard` | `#94A3B8` (Inactive) | `#38BDF8` (Active Sky) |
| **📈 Tab: Analytics** | `chart-timeline-variant` | `LineChart` | `#94A3B8` (Inactive) | `#38BDF8` (Active Sky) |
| **🚨 Tab: Alerts** | `bell-alert-outline` | `BellRing` | `#94A3B8` (Inactive) | `#EF4444` (Active Badge) |
| **⚙️ Tab: Settings** | `cog-outline` | `Settings` | `#94A3B8` (Inactive) | `#38BDF8` (Active Sky) |

---

## 3. Screen Hierarchy & Navigation Flow

The mobile app will use **Expo Router** (file-based navigation) or **React Navigation** with a 4-tab bottom bar and modal stacks:

```
App Root
 ├── (tabs) Bottom Tab Navigator
 │    ├── 📊 Dashboard Screen (`app/(tabs)/index.tsx`)
 │    │     ├── Station / Node Picker Header
 │    │     ├── Cloud Connection Status Badge
 │    │     ├── Critical Hazard Alert Banner
 │    │     ├── 2-Column Primary Sensor Grid (Temp, Humidity, Rain, Gas)
 │    │     ├── Security & Perimeter Surveillance Matrix (PIR, IR, Reed)
 │    │     └── Auxiliary Stations (Water Quality & Weather Hubs)
 │    │
 │    ├── 📈 Analytics & Trends Screen (`app/(tabs)/analytics.tsx`)
 │    │     ├── Timeframe Filter (Live 30 Pts, 1 Hour, 24 Hours)
 │    │     ├── Interactive Climate Line Chart (Temp vs Humidity)
 │    │     └── Gas & Air Quality Threshold Graph
 │    │
 │    ├── 🚨 Hazard & Audit Log Screen (`app/(tabs)/alerts.tsx`)
 │    │     ├── Active Unacknowledged Emergency Card
 │    │     ├── Severity Filter Tabs (All, Critical, Warning, System)
 │    │     └── Real-time Scrollable Event Audit Feed with Time Badges
 │    │
 │    └── ⚙️ Settings & Device Screen (`app/(tabs)/settings.tsx`)
 │          ├── Firebase Database URL & Connection Status
 │          ├── Alert Threshold Sliders (Gas PPM, Temperature Spike)
 │          ├── Sound & Haptic Feedback Toggles
 │          └── Demo Feed / Simulator Switch
 │
 └── Modals & Overlays
      ├── 🔔 Fullscreen Emergency Alarm Modal (`app/alert-modal.tsx`)
      └── 📍 Station Selector Bottom Sheet (`app/node-modal.tsx`)
```

---

## 4. Mobile UI/UX Wireframe

```
┌────────────────────────────────────────┐
│  🏙️ Smart City     [Sector 4 ▼] [● LIVE]│
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🚨 HAZARD: Elevated Gas (480 PPM)  │ │
│ │ [Acknowledge & Silence]            │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌──────────────────┐┌────────────────┐ │
│ │ 🌡️ TEMPERATURE   ││ 💧 HUMIDITY    │ │
│ │   31.4 °C        ││    74 %        │ │
│ │   Min: 22 Max: 34││  High Moisture │ │
│ └──────────────────┘└────────────────┘ │
│ ┌──────────────────┐┌────────────────┐ │
│ │ 🌧️ PRECIPITATION ││ 💨 GAS & AIR   │ │
│ │   Clear & Dry    ││   120 PPM      │ │
│ │   Raw DO: 1      ││   Good (Safe)  │ │
│ └──────────────────┘└────────────────┘ │
│                                        │
│  SECURITY MATRIX                       │
│  ┌───────────────────────────────────┐ │
│  │ 🏃 PIR Motion: [ CLEAR ]          │ │
│  │ 📡 IR Obstacle: [ CLEAR ]         │ │
│  │ 🔒 Cabinet Door: [ LOCKED ]       │ │
│  └───────────────────────────────────┘ │
│                                        │
│  WATER & WEATHER EXPANSION             │
│  ┌───────────────────────────────────┐ │
│  │ 🧪 pH: 7.2  • TDS: 140 ppm        │ │
│  │ 💨 Wind: 12.4 km/h (ENE)          │ │
│  └───────────────────────────────────┘ │
├────────────────────────────────────────┤
│  [📊 Dashboard] [📈 Trends] [🚨 Alerts] [⚙️ Settings] │
└────────────────────────────────────────┘
```

---

## 5. Directory Structure of the Expo Project (`mobile/`)

```
mobile/
├── app/                          # Expo Router file-based pages
│   ├── _layout.tsx               # Root layout (Theme, Providers, Notifications)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar with custom icons and alert badge counters
│   │   ├── index.tsx             # Main Telemetry Dashboard screen
│   │   ├── analytics.tsx         # Interactive Charts & Trends screen
│   │   ├── alerts.tsx            # Hazard Log & Notification History screen
│   │   └── settings.tsx          # App settings & threshold configuration screen
│   ├── alert-modal.tsx           # Emergency hazard overlay
│   └── node-modal.tsx            # Node / Station selection sheet
│
├── components/                   # Reusable UI components
│   ├── ui/
│   │   ├── SensorCard.tsx        # Metric card with animated icons & status colors
│   │   ├── StatusBadge.tsx       # Live / Offline / Alert pill
│   │   ├── SecurityTile.tsx      # PIR / IR / Reed sensor rows
│   │   ├── WaterQualityHub.tsx   # 4-quadrant water sensor grid
│   │   └── WeatherHub.tsx        # Wind, lux, and barometric telemetry
│   ├── charts/
│   │   ├── ClimateChart.tsx      # Touch-enabled line chart
│   │   └── GasTrendChart.tsx     # Gas PPM chart with threshold reference line
│   └── common/
│       ├── Header.tsx            # Custom header with station dropdown
│       └── HazardBanner.tsx      # Flashing emergency banner
│
├── services/                     # Business logic & cloud integrations
│   ├── firebase.ts               # Firebase Realtime Database initialization
│   ├── normalizer.ts             # Data transformation & fallback schema handler
│   ├── notifications.ts          # Expo local notifications trigger
│   └── haptics.ts                # Vibration & haptic feedback patterns
│
├── hooks/                        # Custom React hooks
│   ├── useTelemetry.ts           # Subscribes to live Firebase node streams
│   ├── useAlerts.ts              # Threshold validator and alarm trigger
│   └── useDemoFeed.ts            # Local demo generator for offline testing
│
├── constants/                    # Constants & theming
│   ├── Config.ts                 # Firebase API keys & endpoints
│   ├── Icons.ts                  # Icon mappings & vector icon helper
│   └── Colors.ts                 # Dark / Light theme design tokens
│
├── assets/                       # App icons, splash screens, and audio assets
│   ├── icon.png                  # 1024x1024 App Icon
│   ├── adaptive-icon.png         # Android Adaptive Icon
│   ├── splash.png                # Launch Screen Splash Image
│   └── sounds/
│       └── siren.mp3             # Hazard siren audio
│
├── app.json                      # Expo project configuration
├── package.json                  # React Native & Expo dependencies
├── tsconfig.json                 # TypeScript configuration
└── tailwind.config.js            # NativeWind configuration (optional)
```

---

## 6. Recommended Dependencies for Expo Go

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "react": "18.2.0",
    "react-native": "0.74.2",
    "@expo/vector-icons": "^14.0.0",
    "lucide-react-native": "^0.395.0",
    "firebase": "^10.12.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "15.2.0",
    "expo-haptics": "~13.0.1",
    "expo-av": "~14.0.5",
    "expo-notifications": "~0.28.1",
    "expo-status-bar": "~1.12.1",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "~3.31.1"
  }
}
```

---

## 7. Step-by-Step Migration Roadmap

### 📍 Step 1: Expo Project Initialization
* Create the `mobile/` directory using `npx create-expo-app@latest mobile -t tabs`.
* Configure `app.json` with app name (`Smart City IoT`), bundle identifier, and permissions.
* Install required dependencies (`firebase`, `@expo/vector-icons`, `react-native-chart-kit`, `expo-haptics`, `expo-av`, `expo-notifications`).

### 📍 Step 2: Firebase Client & Data Normalizer
* Port [`webapp/public/js/config.js`](file:///D:/smartcity/webapp/public/js/config.js) to `mobile/constants/Config.ts`.
* Port [`webapp/public/js/firebase-service.js`](file:///D:/smartcity/webapp/public/js/firebase-service.js) to `mobile/services/firebase.ts` and create the `useTelemetry()` React hook.
* Verify live sync inside Expo Go with data from `https://smartcity-61fad-default-rtdb.firebaseio.com/`.

### 📍 Step 3: UI Dashboard & Vector Iconography
* Build the primary mobile dashboard (`app/(tabs)/index.tsx`).
* Implement custom sensor card components (`SensorCard.tsx`) with animated status rings and `@expo/vector-icons`.
* Build the Security Matrix and Water/Weather expansion cards.

### 📍 Step 4: Native Touch-Enabled Analytics
* Implement `react-native-chart-kit` line charts inside `app/(tabs)/analytics.tsx`.
* Add pinch, touch-tooltip, and multi-timeframe toggles.

### 📍 Step 5: Hazard Notifications, Audio & Haptics
* Set up `expo-notifications` for immediate push notification banners when Gas PPM > 300 or motion is triggered.
* Trigger `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` on hazard events.
* Integrate `expo-av` sound playback for emergency sirens.

### 📍 Step 6: Expo Go Device Verification
* Run `npx expo start` in `mobile/`.
* Scan the generated QR code using the **Expo Go** app on physical Android/iOS smartphones.
