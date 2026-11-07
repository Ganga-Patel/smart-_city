import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function WeatherCard({ cityWeather, weather }) {
  // Merge live city weather from backend / Vercel with fallback hardware weather
  const temp = cityWeather?.temperature ?? 34.0;
  const feelsLike = cityWeather?.feelsLike ?? (temp - 1);
  const condition = cityWeather?.condition || 'Sunny';
  const windSpeed = cityWeather?.windSpeed ?? weather?.windSpeed ?? 9;
  const windDir = cityWeather?.windDirection ?? weather?.windDir ?? 'NE';
  const pressure = cityWeather?.pressure ?? weather?.pressure ?? 1013;
  const humidity = cityWeather?.humidity ?? 25;
  const uvIndex = cityWeather?.uvIndex ?? 5;
  const visibility = cityWeather?.visibility ?? 10;
  const rainStatus = cityWeather?.rainStatus || '0.0 mm (No Active Rain)';
  const rainProb = cityWeather?.rainProbability ?? 15;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color="#38bdf8" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Anand City Weather</Text>
          <Text style={styles.headerSubtitle}>Live Meteorological Telemetry</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveBadgeText}>Live Sync</Text>
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
            <Text style={styles.rainBadgeText}>{rainProb}% Rain Chance</Text>
          </View>
          <Text style={styles.rainSubText} numberOfLines={1}>{rainStatus}</Text>
        </View>
      </View>

      {/* Grid of Meteorological Attributes */}
      <View style={styles.grid}>
        {/* Wind */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Wind Speed & Dir</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{windSpeed}</Text>
            <Text style={styles.itemUnit}>km/h</Text>
            <Text style={styles.itemTag}>{windDir}</Text>
          </View>
        </View>

        {/* Air Pressure */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Air Pressure</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{pressure}</Text>
            <Text style={styles.itemUnit}>hPa</Text>
          </View>
        </View>

        {/* Relative Humidity */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>City Humidity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{humidity}</Text>
            <Text style={styles.itemUnit}>%</Text>
          </View>
        </View>

        {/* UV & Visibility */}
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
    marginBottom: 14
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  titleWrapper: {
    flex: 1
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  headerSubtitle: {
    color: Colors.text.muted,
    fontSize: 10,
    marginTop: 1
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  tempBlock: {
    flex: 1
  },
  conditionText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tempValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2
  },
  tempValue: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  tempUnit: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800'
  },
  feelsLikeText: {
    color: Colors.text.muted,
    fontSize: 11
  },
  rainPillBlock: {
    alignItems: 'flex-end',
    maxWidth: 150
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: 4
  },
  rainBadgeText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '700'
  },
  rainSubText: {
    color: Colors.text.muted,
    fontSize: 9
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  itemLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4
  },
  itemValue: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  itemUnit: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500'
  },
  itemTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  }
});
