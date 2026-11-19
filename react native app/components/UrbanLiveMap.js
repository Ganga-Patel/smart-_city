import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function UrbanLiveMap({ location = 'Anand, Gujarat, India', traffic, telemetry }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Default Anand Coordinates
  const lat = 22.5645;
  const lon = 72.9289;

  const currentTemp = telemetry?.temperature ?? telemetry?.cityWeather?.temperature ?? 28;
  const currentCondition = telemetry?.cityWeather?.condition ?? 'Sunny';
  const aqiScore = telemetry?.airQuality?.aqi ?? 81;
  const corridors = traffic?.corridors || [];

  // Construct Leaflet Dark Map HTML string
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
    html, body, #map { width: 100%; height: 100%; background: #030712; }
    .custom-popup .leaflet-popup-content-wrapper {
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6);
    }
    .custom-popup .leaflet-popup-tip {
      background: #0f172a;
    }
    .popup-title { font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px; }
    .popup-sub { font-size: 10px; color: #94a3b8; }
    .popup-val { font-size: 14px; font-weight: 800; color: #ffffff; font-family: monospace; margin: 4px 0; }
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

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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
        // Convert [lon, lat] GeoJSON coordinates to Leaflet [lat, lon]
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
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color="#38bdf8" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>Urban Live Map</Text>
              <View style={styles.statusPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>Live Canvas</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>{location} &bull; Interactive Spatial Telemetry</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.centerBtn} 
          onPress={handleCenter}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#38bdf8" />
          <Text style={styles.centerBtnText}>Center</Text>
        </TouchableOpacity>
      </View>

      {/* Map Canvas Viewport */}
      <View style={styles.mapViewport}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.loaderText}>Loading Spatial Map...</Text>
          </View>
        )}
      </View>

      {/* Map Footer Bar */}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerText}>Engine: Carto Dark &bull; OpenStreetMap Vectors</Text>
        </View>
        <View style={styles.coordBox}>
          <View style={styles.coordDot} />
          <Text style={styles.coordText}>22.565° N, 72.929° E</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
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
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981'
  },
  statusText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700'
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  centerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  centerBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700'
  },
  mapViewport: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    position: 'relative'
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712'
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  loaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)'
  },
  footerLeft: {
    flex: 1
  },
  footerText: {
    color: '#64748b',
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
    borderRadius: 2,
    backgroundColor: '#38bdf8'
  },
  coordText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace'
  }
});
