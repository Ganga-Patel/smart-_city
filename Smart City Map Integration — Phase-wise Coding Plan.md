# Smart City Map Integration — Phase-wise Implementation Plan

## Objective

Integrate an interactive live urban map into the existing Smart City dashboard.

The map must:

1. Display an interactive map of Anand, Gujarat initially.
2. Show live weather/environment annotations.
3. Show live traffic information.
4. Allow users to search for a specific location.
5. Move/zoom the map to the searched location.
6. Display relevant weather/traffic information for the selected location where data is available.
7. Allow users to hide/show individual map layers.
8. Allow the complete map section to be collapsed/hidden.
9. Avoid any Firebase dependency.
10. Keep map functionality modular so the mapping provider can be replaced later.

---

# Phase 0 — Inspect and prepare the existing application

Before writing new code:

### 0.1 Inspect the existing project

Inspect:

- `webapp/server.js`
- `webapp/smartcity-service.js`
- `webapp/public/index.html`
- `webapp/public/js/`
- `webapp/public/css/`
- `package.json`

Determine:

- current frontend architecture
- existing API endpoints
- current weather API integration
- current air-quality API integration
- current traffic API integration
- current dashboard refresh mechanism
- whether any Firebase imports/references still remain

### 0.2 Remove obsolete Firebase dependencies

Do NOT reintroduce Firebase.

Search the entire project for:

```text
firebase
Firebase
firebase-admin
firebase-service
smartcity Firebase
```

Remove only references that are no longer required.

Do not break unrelated functionality.

### 0.3 Establish the existing data contract

Before building the map, identify the exact JSON structure currently returned by:

```text
GET /api/dashboard-data
```

The map implementation should consume the existing backend data where possible rather than independently calling every external API from the browser.

---

# Phase 1 — Introduce the map engine

## Technology

Use:

- MapLibre GL JS
- OpenStreetMap-derived map tiles for the initial prototype
- GeoJSON for application-specific map data

MapLibre should be treated as the rendering engine, not as the data provider.

Do NOT tightly couple application logic to OpenStreetMap.

Architecture:

```text
MapLibre
   |
   +---- Base Map Tiles
   |
   +---- Weather Layer
   |
   +---- Temperature Layer
   |
   +---- Air Quality Layer
   |
   +---- Traffic Layer
   |
   +---- Search Result Layer
```

## 1.1 Create a dedicated map module

Create:

```text
webapp/public/js/map/
```

Suggested structure:

```text
map/
├── map-manager.js
├── map-config.js
├── map-layers.js
├── map-search.js
├── weather-layer.js
├── traffic-layer.js
├── air-quality-layer.js
└── map-state.js
```

Keep the implementation modular.

The rest of the dashboard must not directly manipulate the MapLibre instance.

## 1.2 Create map initialization

Create a single map manager responsible for:

- initializing MapLibre
- setting initial center
- setting initial zoom
- navigation controls
- resize handling
- layer visibility
- fly-to operations
- marker management

Initial location:

```text
Latitude: 22.5645
Longitude: 72.9289
```

Initial view:

```text
Anand, Gujarat, India
```

Use a reasonable city-level zoom.

## 1.3 Map container

Add a dedicated map section to the dashboard.

Example conceptual layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Urban Live Map                              [Hide Map]       │
├──────────────────────────────────────────────────────────────┤
│ Search location...                            [Search]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                         LIVE MAP                             │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ☑ Weather   ☑ Temperature   ☑ Traffic   ☑ Air Quality      │
└──────────────────────────────────────────────────────────────┘
```

Do not hard-code this exact visual design. Integrate it with the existing dashboard style.

---

# Phase 2 — Map controls and user interaction

Implement:

### Map controls

- zoom in/out
- navigation
- fullscreen
- reset to Anand
- optional geolocation button if browser permissions are available

### Map visibility

Add:

```text
Show Map
Hide Map
```

When hidden:

- remove/hide the map container
- do not destroy the application state
- preserve selected location
- preserve layer visibility

When shown again:

- restore the map
- call map resize/reflow if required

### Layer controls

Provide checkboxes/toggles:

```text
☑ Weather
☑ Temperature
☑ Traffic
☑ Air Quality
```

Each layer must be independently switchable.

Example:

```text
Temperature OFF
Traffic ON
Weather ON
Air Quality OFF
```

must result in only the selected layers being rendered.

Persist these UI preferences in `localStorage`.

---

# Phase 3 — Location search

Implement location search.

Initial prototype:

```text
Nominatim / OpenStreetMap geocoding
```

The search box should support queries such as:

```text
Anand
Anand Railway Station
Vidyanagar
Borsad
Vadodara
Ahmedabad
Mumbai
```

## Search workflow

```text
User enters location
       ↓
Geocoding request
       ↓
Search results
       ↓
User selects result
       ↓
Extract latitude/longitude
       ↓
Map flies to location
       ↓
Place marker
       ↓
Load available telemetry
```

Do not issue geocoding requests on every keystroke.

Use:

- explicit Search action
- or debounced autocomplete

Respect Nominatim's public usage limitations.

Implement a small client-side cache for previously searched locations.

## Search result UI

Display:

```text
Location Name
City
State
Country
```

Allow the user to select a result.

After selection:

```text
map.flyTo(...)
```

and show a selected-location marker.

---

# Phase 4 — Weather map layer

Implement a dedicated weather layer.

The first version should use the weather data already available from the project's backend.

Do NOT create duplicate weather API calls from the browser if the backend already provides the required data.

## Weather marker

At minimum show:

```text
Temperature
Humidity
Weather condition
Wind
Rain probability
```

Example popup:

```text
Anand, Gujarat

28.2°C
Humidity: 68%
Condition: Overcast
Wind: 14 km/h W
Rain probability: 72%
```

The popup should use the existing dashboard weather data.

---

# Phase 5 — Temperature visualization

Implement temperature as a map annotation.

The first implementation should use:

### Temperature markers

Example:

```text
┌──────────────┐
│ 28.2°C       │
│ Anand        │
└──────────────┘
```

Use the application's weather coordinates.

The visual representation should be data-driven.

Possible future representation:

```text
Cool       Moderate       Warm       Hot
  ●-----------●------------●---------●
```

Do not implement a complex heatmap until the basic marker layer works correctly.

---

# Phase 6 — Traffic visualization

Integrate the existing TomTom traffic data.

Traffic should be represented as a separate map layer.

For known traffic corridors, represent:

```text
Road segment
Current speed
Free-flow speed
Congestion %
Delay
```

Example popup:

```text
Anand – Vidyanagar Road

Current speed: 33 km/h
Free flow: 50 km/h
Congestion: 34%
Delay: +55 sec
```

Use line/segment visualization where coordinates are available.

Traffic status should visually distinguish:

```text
Low congestion
Moderate congestion
High congestion
Severe congestion
```

Do not invent geographic coordinates for traffic roads.

If the current backend only returns road names and numeric traffic information without geometry, create a backend/data-model requirement for traffic coordinates rather than fabricating them.

---

# Phase 7 — Air-quality map layer

Create an independent AQI layer.

Each monitoring location should contain:

```text
AQI
PM2.5
PM10
NO2
O3
CO
SO2
```

Example popup:

```text
Air Quality

AQI: 43
PM2.5: 17.9 µg/m³
PM10: 39.1 µg/m³
NO₂: 5.8 µg/m³
```

Again, do not fabricate station coordinates.

If only one Anand-wide AQI value exists, represent it as a city-level marker instead of pretending it is a precise physical monitoring station.

---

# Phase 8 — Live update engine

Create a centralized map refresh mechanism.

Example:

```text
Map Data Controller
        |
        +--- Weather
        |
        +--- Traffic
        |
        +--- Air Quality
        |
        +--- Temperature
```

The map should periodically update using the backend API.

Do NOT create separate uncontrolled timers inside every layer.

Prefer:

```text
single dashboard/map refresh scheduler
```

Example:

```text
/api/dashboard-data
        ↓
Map Data Controller
        ↓
updateWeatherLayer()
updateTemperatureLayer()
updateTrafficLayer()
updateAirQualityLayer()
```

Use the existing backend caching strategy where applicable.

---

# Phase 9 — Selected location behavior

When the user searches for a location:

### Step 1

Move the map:

```text
flyTo(latitude, longitude)
```

### Step 2

Show a selected-location marker.

### Step 3

Display:

```text
Selected Location
Latitude
Longitude
```

### Step 4

Attempt to retrieve weather data for that location if the existing weather provider supports arbitrary coordinates.

### Step 5

Only show traffic/AQI information if the backend has valid data for that location.

Never display Anand telemetry as though it belongs to another searched location.

For unsupported data:

```text
Traffic data unavailable for this location
```

rather than showing incorrect data.

---

# Phase 10 — Backend map API abstraction

Do not expose API keys unnecessarily in frontend JavaScript.

Create backend endpoints where needed.

Potential architecture:

```text
GET /api/dashboard-data

GET /api/location/search?q=...

GET /api/location/weather?lat=...&lon=...

GET /api/location/traffic?lat=...&lon=...

GET /api/location/air-quality?lat=...&lon=...
```

Only implement endpoints that are actually required by the current providers.

The frontend should communicate primarily with the Smart City backend.

---

# Phase 11 — Map state management

Create a centralized state object.

Conceptually:

```javascript
{
  visible: true,

  center: {
    lat: 22.5645,
    lon: 72.9289
  },

  zoom: 12,

  selectedLocation: null,

  layers: {
    weather: true,
    temperature: true,
    traffic: true,
    airQuality: true
  }
}
```

Persist user preferences:

```text
localStorage
```

Persist:

- map visibility
- layer visibility
- last selected location
- optional zoom/center

Do not persist rapidly changing telemetry data.

---

# Phase 12 — Error handling

The map must continue working if an individual data provider fails.

For example:

```text
Map                 → working
Weather API         → working
Traffic API         → failed
Air Quality API     → working
```

The map should still render.

Show:

```text
Traffic data temporarily unavailable
```

rather than breaking the entire dashboard.

Similarly:

```text
Geocoding unavailable
```

should not destroy the map.

---

# Phase 13 — Performance requirements

Do not create hundreds of DOM markers if GeoJSON/vector layers can be used.

For the initial small Anand dataset, markers are acceptable.

Design the layer system so it can later support:

```text
GeoJSON
vector tiles
heatmaps
road segments
large sensor datasets
```

MapLibre supports sources/layers and data-driven map styling, so use that architecture instead of hard-coded DOM overlays wherever practical.

---

# Phase 14 — Testing

Test the following.

## Map

- Map loads
- Anand is initial center
- zoom works
- pan works
- fullscreen works
- map can be hidden
- map can be restored

## Search

Test:

```text
Anand
Borsad
Vadodara
Ahmedabad
Mumbai
```

Verify that selecting a result moves the map correctly.

## Layers

Test every combination:

```text
Weather ON/OFF
Temperature ON/OFF
Traffic ON/OFF
AQI ON/OFF
```

## API failures

Simulate:

```text
Weather API failure
Traffic API failure
AQI API failure
Geocoding failure
```

The remaining map must continue functioning.

## Responsive design

Test:

```text
Desktop
Tablet
Mobile browser
```

The map must resize correctly.

---

# Phase 15 — Security and configuration

Create environment configuration for provider-specific settings.

Do not hard-code secrets into:

```text
index.html
map.js
frontend JavaScript
```

Potential configuration:

```text
MAP_PROVIDER
MAP_STYLE_URL
GEOCODING_PROVIDER
WEATHER_PROVIDER
TRAFFIC_PROVIDER
```

Keep the architecture provider-independent.

---

# Phase 16 — Documentation

Update project documentation with:

1. Map architecture
2. Map provider
3. Tile provider
4. Geocoding provider
5. Weather data source
6. Traffic data source
7. AQI data source
8. Attribution requirements
9. Environment variables
10. API endpoints
11. Layer architecture
12. Search architecture

Clearly document that OSM public services have usage policies and are not an unlimited production backend.

---

# Definition of Done

The implementation is complete when the dashboard provides:

```text
┌──────────────────────────────────────────────────────────────┐
│ Smart City Dashboard                                         │
├──────────────────────────────────────────────────────────────┤
│ Search location [____________________] [Search]              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                       INTERACTIVE MAP                        │
│                                                              │
│       🌡 Temperature                                        │
│       🌦 Weather                                             │
│       🚗 Traffic                                             │
│       🌫 AQI                                                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Layers:                                                      │
│ ☑ Weather  ☑ Temperature  ☑ Traffic  ☑ Air Quality         │
│                                                              │
│ [Hide Map]                                                   │
└──────────────────────────────────────────────────────────────┘
```

The implementation must remain completely independent of Firebase.

---

# Recommended implementation order

Do NOT implement everything at once.

Execute in this order:

### Phase A
MapLibre + base map.

### Phase B
Map controls + hide/show.

### Phase C
Location search.

### Phase D
Weather marker.

### Phase E
Temperature layer.

### Phase F
Traffic layer.

### Phase G
AQI layer.

### Phase H
Centralized live refresh.

### Phase I
Selected-location telemetry.

### Phase J
Performance + error handling + responsive testing.

### Phase K
Documentation and cleanup.

After each phase:

1. Run the application.
2. Verify functionality.
3. Fix errors.
4. Commit the working state.
5. Proceed to the next phase.

Do not proceed to the next phase if the current phase is broken.