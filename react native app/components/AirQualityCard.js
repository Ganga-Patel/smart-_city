import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function AirQualityCard({ airQuality }) {
  const aqi = airQuality?.aqi ?? 78;
  const status = airQuality?.status || 'Moderate';
  const pm25 = airQuality?.pm25 ?? 32.4;
  const pm10 = airQuality?.pm10 ?? 49.7;
  const no2 = airQuality?.no2 ?? 3.3;
  const o3 = airQuality?.o3 ?? 155;

  // Determine status color
  const getAqiTheme = (score) => {
    if (score <= 50) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    if (score <= 100) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    if (score <= 150) return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
  };

  const theme = getAqiTheme(aqi);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: theme.bg }]}>
          <MaterialCommunityIcons name="air-filter" size={18} color={theme.color} />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Anand Air Quality (AQI)</Text>
          <Text style={styles.headerSubtitle}>EPA / NAAQS Pollution Index</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.statusBadgeText, { color: theme.color }]}>{status}</Text>
        </View>
      </View>

      {/* Main AQI Score Banner */}
      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.aqiLabel}>Air Quality Index</Text>
          <View style={styles.scoreValueRow}>
            <Text style={[styles.scoreValue, { color: theme.color }]}>{aqi}</Text>
            <Text style={styles.scoreScale}>/ 500 US AQI</Text>
          </View>
        </View>
        <View style={styles.advisoryBlock}>
          <Text style={styles.advisoryText}>
            {aqi <= 50 ? 'Air quality is satisfactory.' : aqi <= 100 ? 'Acceptable air quality.' : 'Sensitive groups take caution.'}
          </Text>
        </View>
      </View>

      {/* Pollutant Breakdown Grid */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>PM 2.5</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{pm25}</Text>
            <Text style={styles.itemUnit}>µg/m³</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>PM 10</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{pm10}</Text>
            <Text style={styles.itemUnit}>µg/m³</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Nitrogen Dioxide (NO₂)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{no2}</Text>
            <Text style={styles.itemUnit}>ppb</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Ozone (O₃)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{o3}</Text>
            <Text style={styles.itemUnit}>µg/m³</Text>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  scoreRow: {
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
  aqiLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  scoreScale: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  advisoryBlock: {
    maxWidth: 150
  },
  advisoryText: {
    color: Colors.text.secondary,
    fontSize: 11,
    textAlign: 'right'
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
  }
});
