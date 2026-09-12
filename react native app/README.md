# Smart City IoT - React Native Mobile App (Expo Go)

An urban telemetry, hazard monitoring, and security command center app built with **React Native** and **Expo Go**.

---

## 📱 Features

1. **Real-Time Synchronous Telemetry**: Directly connects to Firebase Realtime Database (`https://smartcity-61fad-default-rtdb.firebaseio.com/`).
2. **Mobile Iconography**: Uses `@expo/vector-icons` (`MaterialCommunityIcons`) for climate, rain, gas, motion, and perimeter security tiles.
3. **Emergency Hazard Alarms**: Animated emergency alert banners, operator acknowledgment action buttons, and active safety rule monitoring.
4. **4-Tab Mobile Navigation**:
   * 📊 **Dashboard**: 2-column live sensor cards (Temp, Humidity, Rain, Gas PPM) + Security Matrix + Water Quality & Weather Hubs.
   * 📈 **Analytics**: Real-time rolling climate curves and minimum/maximum/average statistical breakdowns.
   * 🚨 **Alerts**: Incident command view, active hazard alarms, and live event audit stream.
   * ⚙️ **Settings**: Active node selector (`Sector 4 Station`, `Wokwi Virtual Node`, `Central Gateway RPi`), threshold limits, and Demo Feed simulator.
5. **Interactive Demo Mode**: Integrated data generator to simulate live sensor fluctuations, rain onsets, and gas spikes for demonstration without active physical hardware.

---

## 📂 Directory Structure

```
react native app/
├── App.js                         # Root application, state manager & 4-tab bar navigation
├── app.json                       # Expo app manifest
├── package.json                   # Dependencies (@expo/vector-icons, firebase, expo)
├── babel.config.js                # Babel configuration
│
├── constants/
│   ├── Colors.js                  # Dark mode color tokens and status accents
│   ├── Config.js                  # Firebase configuration, nodes, and threshold limits
│   └── Icons.js                   # MaterialCommunityIcons mappings and color definitions
│
├── services/
│   ├── firebase.js                # Firebase RTDB WebSocket listener
│   ├── alerts.js                  # Safety threshold evaluator & incident extractor
│   └── normalizer.js              # Universal normalizer for firmware & bridge payloads
│
├── components/
│   ├── Header.js                  # Brand bar with connection dot and demo switch
│   ├── HazardBanner.js            # Flashing emergency alert card with Acknowledge button
│   ├── SensorCard.js              # Reusable metric card with MaterialCommunityIcons
│   ├── SecurityMatrix.js          # HC-SR501 PIR, HW-201 IR, and Reed switch status tiles
│   ├── WaterQualityCard.js        # pH, TDS, Turbidity, DO 4-grid card
│   ├── WeatherCard.js             # Wind velocity, direction, ambient lux, air pressure
│   ├── ClimateChart.js            # Visual timeline & sparkline stream
│   └── EventLogStream.js          # Real-time event audit log list
│
└── screens/
    ├── DashboardScreen.js         # Main live telemetry overview screen
    ├── AnalyticsScreen.js         # Historical trends & summary statistics
    ├── AlertsScreen.js            # Incident management & audit log
    └── SettingsScreen.js          # Node selection & threshold configuration
```

---

## 🚀 How to Run with Expo Go

1. **Navigate to the folder**:
   ```bash
   cd "react native app"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Expo Dev Server**:
   ```bash
   npx expo start
   ```

4. **Open in Mobile Device**:
   * Open the **Expo Go** app on your Android or iOS smartphone.
   * Scan the generated QR code in your terminal.
