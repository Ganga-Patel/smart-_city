import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function WeatherCard({ cityWeather, weather }) {
  const location = cityWeather?.location || 'Anand, Gujarat, India';
  const temp = cityWeather?.temperature ?? 32.0;
  const feelsLike = cityWeather?.feelsLike ?? 31.0;
  const condition = cityWeather?.condition || 'Sunny';
  const windSpeed = cityWeather?.windSpeed ?? weather?.windSpeed ?? 7;
  const windDir = cityWeather?.windDirection ?? weather?.windDir ?? 'ENE';
  const pressure = cityWeather?.pressure ?? weather?.pressure ?? 1014;
  const humidity = cityWeather?.humidity ?? 30;
  const uvIndex = cityWeather?.uvIndex ?? 5;
  const visibility = cityWeather?.visibility ?? 10;
  const rainStatus = cityWeather?.rainStatus || '0.0 mm (No Active Rain)';
  const rainProb = cityWeather?.rainProbability ?? 15;
  const cloudCover = cityWeather?.cloudCover ?? 0;

  const getWeatherIcon = (cond) => {
    const c = String(cond).toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'weather-rainy';
    if (c.includes('cloud') || c.includes('overcast')) return 'weather-cloudy';
    if (c.includes('storm') || c.includes('thunder')) return 'weather-lightning';
    if (c.includes('snow')) return 'weather-snowy';
    if (c.includes('fog') || c.includes('mist')) return 'weather-fog';
    return 'weather-sunny';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name={getWeatherIcon(condition)} size={18} color="#38bdf8" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>{location}</Text>
          <Text style={styles.headerSubtitle}>Live Meteorological Telemetry</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveBadgeText}>Live</Text>
        </View>
      </View>

      {/* Primary Highlights: Condition & Temperature */}
      <View style={styles.highlightRow}>
        <View style={styles.tempBlock}>
          <Text style={styles.conditionText}>{condition}</Text>
          <View style={styles.tempValueRow}>
            <Text style={styles.tempValue}>{typeof temp === 'number' ? temp.toFixed(1) : temp}</Text>
            <Text style={styles.tempUnit}>°C</Text>
          </View>
          <Text style={styles.feelsLikeText}>Feels like {typeof feelsLike === 'number' ? feelsLike.toFixed(1) : feelsLike}°C</Text>
        </View>

        <View style={styles.rainPillBlock}>
          <View style={styles.rainBadge}>
            <MaterialCommunityIcons name="weather-rainy" size={14} color="#06b6d4" />
            <Text style={styles.rainBadgeText}>{rainProb}% Rain</Text>
          </View>
          <Text style={styles.rainSubText} numberOfLines={1}>{rainStatus}</Text>
        </View>
      </View>

      {/* Grid of Meteorological Attributes */}
      <View style={styles.grid}>
        {/* Wind Speed & Direction */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Wind Flow</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{windSpeed}</Text>
            <Text style={styles.itemUnit}>km/h</Text>
            <View style={styles.dirTag}>
              <Text style={styles.dirTagText}>{windDir}</Text>
            </View>
          </View>
        </View>

        {/* Air Pressure */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Baro Pressure</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{pressure}</Text>
            <Text style={styles.itemUnit}>hPa</Text>
          </View>
        </View>

        {/* Relative Humidity */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Atm Humidity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{humidity}</Text>
            <Text style={styles.itemUnit}>%</Text>
          </View>
        </View>

        {/* UV Index & Visibility */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>UV / Visibility</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>UV {uvIndex}</Text>
            <Text style={styles.itemUnit}>• {visibility} km</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 14
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleWrapper: {
    flex: 1
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  liveBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700'
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12
  },
  tempBlock: {
    flex: 1
  },
  conditionText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  tempValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2
  },
  tempValue: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800'
  },
  tempUnit: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600'
  },
  feelsLikeText: {
    color: '#64748b',
    fontSize: 10
  },
  rainPillBlock: {
    alignItems: 'flex-end',
    gap: 4
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4
  },
  rainBadgeText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '700'
  },
  rainSubText: {
    color: '#64748b',
    fontSize: 9,
    maxWidth: 120
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  itemLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4
  },
  itemValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800'
  },
  itemUnit: {
    color: '#64748b',
    fontSize: 10
  },
  dirTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4
  },
  dirTagText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700'
  }
});
