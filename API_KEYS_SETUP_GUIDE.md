# Smart City Platform — API Keys & External Services Setup Guide

This guide provides step-by-step instructions on how to obtain, configure, and verify all external API keys used in the **Smart City IoT & Urban Telemetry Platform** (Anand, Gujarat, India).

All APIs listed below offer **100% Free Tiers** that do **NOT** require a paid subscription or credit card.

---

## Summary Matrix of APIs

| Service | Provider | What It Powers | Free Tier Quota | Registration URL |
| :--- | :--- | :--- | :--- | :--- |
| **Traffic Flow API** | **TomTom Developer** | Live Anand traffic speeds, congestion %, and corridor delays | **2,500 requests/day free** (no credit card) | [developer.tomtom.com/user/register](https://developer.tomtom.com/user/register) |
| **Interactive Map Tiles** | **Carto Dark / MapLibre** | High-resolution dark mode street basemap of Anand | **Unlimited Open Access** (Key optional: [maptiler.com](https://www.maptiler.com/)) | Default is keyless; MapTiler optional |
| **Weather API** | **Open-Meteo & Weatherstack** | Ambient temperature, humidity, rain probability, wind, pressure | **Unlimited (Open-Meteo)** / **250/mo (Weatherstack)** | [weatherstack.com/signup/free](https://weatherstack.com/signup/free) |
| **Air Quality API** | **WAQI (World Air Quality Index)** | EPA/NAAQS AQI score, PM2.5, PM10, trace gases | **1,000 requests/day free** | [aqicn.org/data-platform/token/](https://aqicn.org/data-platform/token/) |
| **Geocoding & Location Search** | **Nominatim (OpenStreetMap)** | Location search bar & autocomplete (e.g. Vidyanagar, Vadodara) | **1 request/sec (Open Source)** | Keyless (Backend proxied) |

---

## 1. TomTom Traffic Flow API Key (Recommended for Live Speeds)

The platform queries the **TomTom Traffic Flow Segment API** for Anand arterial coordinates (`22.5645, 72.9289`).

### Step-by-Step Instructions to Get a Free Key:
1. Go to the TomTom Developer registration page:  
   👉 **[https://developer.tomtom.com/user/register](https://developer.tomtom.com/user/register)**
2. Fill out the registration form:
   * First Name & Last Name
   * Email Address
   * Password
   * Country: **India**
   * Check the box agreeing to the Terms and Conditions.
3. Click **Register**.
4. Check your email inbox for a verification email from TomTom and click the **Activate Account** link.
5. Log in to your TomTom Dashboard:  
   👉 **[https://developer.tomtom.com/user/me/apps](https://developer.tomtom.com/user/me/apps)**
6. You will see a default application named **My First API Project** (or click **Add a new app**).
7. Copy your **Consumer API Key** (a 32-character string of letters and numbers, e.g., `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`).

### How to Configure It in the Project:
1. Open the file [`API wheather and air quality.txt`](file:///D:/smartcity/API%20wheather%20and%20air%20quality.txt) in your code editor.
2. Look at lines 11–12:
   ```text
   traffic api
   https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=YOUR_API_KEY&point=LAT,LON
   ```
3. Replace `YOUR_API_KEY` with your copied TomTom key:
   ```text
   traffic api
   https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=YOUR_ACTUAL_TOMTOM_KEY&point=22.5645,72.9289
   ```
4. Save the file.
5. Our backend service ([`webapp/smartcity-service.js`](file:///D:/smartcity/webapp/smartcity-service.js)) automatically reads the key directly from this text file without requiring a server rebuild!

---

## 2. Interactive Map Basemap (Indian Providers & 100% Free Keyless Options)

### 2.1. Current Active Setup: 100% Free Keyless OpenStreetMap (Zero Watermark)
To avoid the commercial CARTO watermark shown in your screenshot, the dashboard is now configured with **OpenStreetMap** raster tiles paired with a custom dark-mode CSS filter:
```text
https://a.tile.openstreetmap.org/{z}/{x}/{y}.png
```
* **Status**: **100% Free forever**
* **API Key**: **None required (Keyless)**
* **Watermark**: **Zero watermark**
* **Coverage**: Complete high-detail street network of Anand, Vidyanagar, railway lines, and landmarks.

---

### 2.2. Indian Map Provider #1: Mappls (MapmyIndia) — 10,000 Free Transactions/Month
**Mappls** (by CE Info Systems) is India's leading indigenous geospatial company and official mapping partner for many Indian government initiatives.

* **Free Tier Quota**: **10,000 map transactions per month completely free forever**.
* **Coverage**: Unmatched Indian geospatial accuracy, local Gujarati transliteration, building footprints, and Indian POIs.

#### Step-by-Step Instructions to Get a Free Mappls Key:
1. Go to the Mappls Developer Console:  
   👉 **[https://apis.mappls.com/console/](https://apis.mappls.com/console/)**
2. Click **Sign Up** and register using your mobile number or email.
3. Verify your account via OTP / email verification.
4. In the Mappls Console:
   * Click **Projects** $\rightarrow$ **Create a New Project** (e.g. `Smart City Dashboard`).
   * Navigate to **Credentials / API Keys**.
   * Copy your **REST API Key** and **Map SDK Key**.
5. Save your Mappls key in [`API wheather and air quality.txt`](file:///D:/smartcity/API%20wheather%20and%20air%20quality.txt).

---

### 2.3. Indian Map Provider #2: ISRO Bhuvan (Government of India)
**Bhuvan** is India's national geo-portal developed by the **Indian Space Research Organisation (ISRO)** and NRSC.

* **Portal**: 👉 **[https://bhuvan.nrsc.gov.in/](https://bhuvan.nrsc.gov.in/)**
* **Cost**: **100% Free** (Open government data service).
* **Tile Endpoints (WMS / WMTS)**:
  * Hybrid Base Layers: `https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts/`
  * High-resolution satellite imagery across the Indian subcontinent.
* **Best For**: National satellite imagery and administrative thematic layers.

---

### 2.4. Optional Global Vector Provider: MapTiler (100,000 Free Requests/Month)
If you want hardware-accelerated 3D vector styling:
1. Sign up free: 👉 **[https://cloud.maptiler.com/signup/](https://cloud.maptiler.com/signup/)** (No credit card).
2. Copy your key from: **[https://cloud.maptiler.com/account/keys/](https://cloud.maptiler.com/account/keys/)**.
3. Set style in [`webapp/public/js/map/map-config.js`](file:///D:/smartcity/webapp/public/js/map/map-config.js):
   ```javascript
   style: 'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=YOUR_MAPTILER_KEY'
   ```

---

## 3. Weather API Key (Weatherstack)

The platform features seamless automatic dual-mode weather fetching:
1. **Open-Meteo**: 100% keyless, high-precision live temperature, humidity, and rainfall probability for Anand.
2. **Weatherstack**: Supplementary provider configured via key.

### Step-by-Step Instructions to Get a Fresh Weatherstack Key:
1. Visit the free signup page:  
   👉 **[https://weatherstack.com/signup/free](https://weatherstack.com/signup/free)**
2. Enter your Name, Email, and choose a Password.
3. Click **Sign Up**.
4. Your personal **API Access Key** (32-character hexadecimal) will be displayed on your account dashboard.
5. Open [`API wheather and air quality.txt`](file:///D:/smartcity/API%20wheather%20and%20air%20quality.txt).
6. Paste the key on line 5 under `weather api key`:
   ```text
   weather api key
   YOUR_NEW_WEATHERSTACK_KEY
   ```
7. Save the file.

---

## 4. Air Quality Token (WAQI / World Air Quality Index)

The platform queries air quality for Anand, Gujarat monitoring stations.

### Step-by-Step Instructions to Get a Free Instant Token:
1. Visit the WAQI token request page:  
   👉 **[https://aqicn.org/data-platform/token/](https://aqicn.org/data-platform/token/)**
2. Enter your **Name** and **Email Address**.
3. Accept the Terms of Service.
4. Click **Submit**.
5. You will immediately receive an email with your personal token (e.g. `a1b2c3d4e5f6...`).
6. Open [`API wheather and air quality.txt`](file:///D:/smartcity/API%20wheather%20and%20air%20quality.txt).
7. Update line 9 with your personal token:
   ```text
   air api
   http://api.waqi.info/feed/anand/?token=YOUR_PERSONAL_WAQI_TOKEN
   ```
8. Save the file.

---

## 5. How to Verify All API Keys

After adding or updating any keys, run this PowerShell command in terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/dashboard-data | ConvertTo-Json -Depth 3
```

### Verification Checklist:
* `success`: Must be `true`.
* `cityWeather.temperature`: Displays valid Anand temperature (e.g. `28.2 °C`).
* `airQuality.aqi`: Displays valid AQI score (e.g. `72`).
* `traffic.currentSpeed`: Displays active speed (e.g. `30 km/h` or live TomTom speed).
* `traffic.congestionIndex`: Displays congestion percentage (e.g. `40%`).

---

## 6. Security Note
* Never commit real private API keys directly into public GitHub repositories.
* Keep keys in [`API wheather and air quality.txt`](file:///D:/smartcity/API%20wheather%20and%20air%20quality.txt) or system environment variables.
* The file `.gitignore` is pre-configured to keep credentials safe.
