import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

export default function UrbanLiveMap({ 
  location = 'Anand, Gujarat, India', 
  traffic, 
  telemetry,
  theme = DarkTheme,
  isDark = true
}) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Default Anand Coordinates
  const lat = 22.5645;
  const lon = 72.9289;

  const currentTemp = telemetry?.temperature ?? telemetry?.cityWeather?.temperature ?? 28;
  const currentCondition = telemetry?.cityWeather?.condition ?? 'Sunny';
  const aqiScore = telemetry?.airQuality?.aqi ?? 81;
  const corridors = traffic?.corridors || [];

  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const mapBg = isDark ? '#030712' : '#f8fafc';
  const popupWrapperBg = isDark ? '#0f172a' : '#ffffff';
  const popupTextColor = isDark ? '#f8fafc' : '#0f172a';
  const popupBorderColor = isDark ? '#334155' : '#cbd5e1';
  const popupSubColor = isDark ? '#94a3b8' : '#64748b';
  const popupValColor = isDark ? '#ffffff' : '#0f172a';
  const popupTitleColor = isDark ? '#38bdf8' : '#0284c7';

  // Construct Leaflet Map HTML string
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: ${mapBg}; }
    .custom-popup .leaflet-popup-content-wrapper {
      background: ${popupWrapperBg};
      color: ${popupTextColor};
      border: 1px solid ${popupBorderColor};
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    }
    .custom-popup .leaflet-popup-tip {
      background: ${popupWrapperBg};
    }
    .popup-title { font-size: 12px; font-weight: 700; color: ${popupTitleColor}; margin-bottom: 2px; }
    .popup-sub { font-size: 10px; color: ${popupSubColor}; }
    .popup-val { font-size: 14px; font-weight: 800; color: ${popupValColor}; font-family: monospace; margin: 4px 0; }
    .pulse-marker {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #38bdf8;
      border: 2px solid #ffffff;
      box-shadow: 0 0 12px #38bdf8;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
    }
    .rose-marker {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #f43f5e;
      border: 2px solid #ffffff;
      box-shadow: 0 0 8px #f43f5e;
    }
    .green-marker {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #ffffff;
      box-shadow: 0 0 8px #10b981;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const center = [${lat}, ${lon}];
    const map = L.map('map', {
      center: center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Carto Tile Layer (Dynamic Dark/Light)
    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 1. Station 1: Anand City Center (Main Marker)
    const icon1 = L.divIcon({ className: 'custom-icon', html: '<div class="pulse-marker"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
    L.marker([22.5645, 72.9289], { icon: icon1 })
      .addTo(map)
      .bindPopup('<div class="popup-title">Anand City Center</div><div class="popup-val">${currentTemp}°C &bull; ${currentCondition}</div><div class="popup-sub">Real-Time Weather Station</div>', { className: 'custom-popup' })
      .openPopup();

    // 2. Station 2: Vallabh Vidyanagar (Thermal Node)
    const icon2 = L.divIcon({ className: 'custom-icon', html: '<div class="rose-marker"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
    L.marker([22.5520, 72.9350], { icon: icon2 })
      .addTo(map)
      .bindPopup('<div class="popup-title">V.V. Nagar Thermal Node</div><div class="popup-val">${(currentTemp - 0.5).toFixed(1)}°C</div><div class="popup-sub">Microclimate Sensor</div>', { className: 'custom-popup' });

    // 3. Station 3: Station Road Transit & Air Quality Node
    const icon3 = L.divIcon({ className: 'custom-icon', html: '<div class="green-marker"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
    L.marker([22.5640, 72.9550], { icon: icon3 })
      .addTo(map)
      .bindPopup('<div class="popup-title">Anand Station AQI Node</div><div class="popup-val">AQI ${aqiScore}</div><div class="popup-sub">Urban Air Quality Probe</div>', { className: 'custom-popup' });

    // 4. Plot Traffic Corridors (Mappls & TomTom arterial lines)
    const corridors = ${JSON.stringify(corridors)};
    corridors.forEach(c => {
      if (c.coordinates && c.coordinates.length > 0) {
        const latlngs = c.coordinates.map(pt => [pt[1], pt[0]]);
        const isCongested = (c.congestion || 0) >= 50;
        const isModerate = (c.congestion || 0) >= 35;
        const color = isCongested ? '#ef4444' : (isModerate ? '#f59e0b' : '#10b981');
        
        const line = L.polyline(latlngs, {
          color: color,
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round'
        }).addTo(map);

        line.bindPopup('<div class="popup-title">' + (c.name || 'Transit Corridor') + '</div><div class="popup-val">' + (c.speed || 25) + ' km/h &bull; ' + (c.status || 'Flowing') + '</div><div class="popup-sub">Delay: +' + (c.delaySec || 0) + 's</div>', { className: 'custom-popup' });
      }
    });

    window.centerOnAnand = function() {
      map.setView(center, 13, { animate: true });
    };
  </script>
</body>
</html>
  `;

  const handleCenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.centerOnAnand && window.centerOnAnand(); true;');
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.card, 
        borderColor: theme.cardBorder 
      }
    ]}>
      {/* Map Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.iconBox, 
            { 
              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.25)'
            }
          ]}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.brand.sky} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: theme.text.primary }]}>Urban Live Map</Text>
              <View style={[
                styles.statusPill, 
                { 
                  backgroundColor: theme.status.successBg,
                  borderColor: theme.status.successBorder
                }
              ]}>
                <View style={[styles.pulseDot, { backgroundColor: theme.status.success }]} />
                <Text style={[styles.statusText, { color: theme.status.success }]}>Live Spatial Canvas</Text>
              </View>
            </View>
            <Text style={[styles.subtitleText, { color: theme.text.secondary }]}>
              {location} &bull; Interactive Spatial Vectors
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.centerBtn, 
            { 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
              borderColor: theme.surfaceBorder
            }
          ]} 
          onPress={handleCenter}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color={theme.brand.sky} />
          <Text style={[styles.centerBtnText, { color: theme.brand.sky }]}>Center</Text>
        </TouchableOpacity>
      </View>

      {/* Map Canvas Viewport */}
      <View style={[
        styles.mapViewport, 
        { 
          backgroundColor: isDark ? '#030712' : '#f1f5f9',
          borderColor: theme.cardBorder
        }
      ]}>
        <WebView
          key={isDark ? 'map-dark' : 'map-light'}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={[styles.webView, { backgroundColor: mapBg }]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && (
          <View style={[styles.loaderOverlay, { backgroundColor: mapBg }]}>
            <ActivityIndicator size="small" color={theme.brand.sky} />
            <Text style={[styles.loaderText, { color: theme.text.secondary }]}>
              Loading Spatial Vectors...
            </Text>
          </View>
        )}
      </View>

      {/* Map Footer Bar */}
      <View style={[styles.footerRow, { borderTopColor: theme.surfaceBorder }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerText, { color: theme.text.muted }]}>
            Engine: {isDark ? 'Carto Dark Matter' : 'Carto Positron'} &bull; OpenStreetMap Vectors
          </Text>
        </View>
        <View style={styles.coordBox}>
          <View style={[styles.coordDot, { backgroundColor: theme.brand.sky }]} />
          <Text style={[styles.coordText, { color: theme.text.secondary }]}>
            22.565° N, 72.929° E
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 14
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700'
  },
  subtitleText: {
    fontSize: 10,
    marginTop: 1
  },
  centerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  centerBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  mapViewport: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative'
  },
  webView: {
    flex: 1
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  loaderText: {
    fontSize: 11,
    fontWeight: '600'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1
  },
  footerLeft: {
    flex: 1
  },
  footerText: {
    fontSize: 10
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  coordDot: {
    width: 4,
    height: 4,
    borderRadius: 2
  },
  coordText: {
    fontSize: 10,
    fontFamily: 'monospace'
  }
});
