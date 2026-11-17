import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function AirQualityCard({ airQuality }) {
  const aqi = airQuality?.aqi ?? 81;
  const status = airQuality?.status || 'Moderate';
  const pm25 = airQuality?.pm25 ?? 33.8;
  const pm10 = airQuality?.pm10 ?? 41.7;
  const no2 = airQuality?.no2 ?? 11.1;
  const o3 = airQuality?.o3 ?? 137;
  const co = airQuality?.co ?? 478;
  const so2 = airQuality?.so2 ?? 20.9;

  // Determine status color & theme
  const getAqiTheme = (score) => {
    if (score <= 50) {
      return { 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.15)', 
        border: 'rgba(16, 185, 129, 0.3)',
        advisory: 'Air quality is satisfactory. Ideal for outdoor activity.'
      };
    }
    if (score <= 100) {
      return { 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.15)', 
        border: 'rgba(245, 158, 11, 0.3)',
        advisory: 'Acceptable air quality. Sensitive individuals should monitor.'
      };
    }
    if (score <= 150) {
      return { 
        color: '#f97316', 
        bg: 'rgba(249, 115, 22, 0.15)', 
        border: 'rgba(249, 115, 22, 0.3)',
        advisory: 'Unhealthy for sensitive groups. Reduce prolonged exertion.'
      };
    }
    return { 
      color: '#ef4444', 
      bg: 'rgba(239, 68, 68, 0.15)', 
      border: 'rgba(239, 68, 68, 0.3)',
      advisory: 'Health alert: increased risk of biological health effects.'
    };
  };

  const theme = getAqiTheme(aqi);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: theme.bg }]}>
          <MaterialCommunityIcons name="air-filter" size={18} color={theme.color} />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Urban Air Quality Index</Text>
          <Text style={styles.headerSubtitle}>EPA / NAAQS Comprehensive Scale</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.statusBadgeText, { color: theme.color }]}>{status}</Text>
        </View>
      </View>

      {/* Main AQI Score Highlight */}
      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.aqiLabel}>US AQI SCORE</Text>
          <View style={styles.scoreValueRow}>
            <Text style={[styles.scoreValue, { color: theme.color }]}>{aqi}</Text>
            <Text style={styles.scoreScale}>/ 500 US AQI</Text>
          </View>
        </View>
        <View style={styles.advisoryBlock}>
          <Text style={styles.advisoryText}>{theme.advisory}</Text>
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
          <Text style={styles.itemLabel}>Nitrogen (NO₂)</Text>
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

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Carbon (CO)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{co}</Text>
            <Text style={styles.itemUnit}>µg/m³</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Sulfur (SO₂)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{so2}</Text>
            <Text style={styles.itemUnit}>ppb</Text>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    gap: 12
  },
  aqiLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800'
  },
  scoreScale: {
    color: '#64748b',
    fontSize: 11
  },
  advisoryBlock: {
    flex: 1
  },
  advisoryText: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#070b14',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  itemLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 3
  },
  itemValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800'
  },
  itemUnit: {
    color: '#64748b',
    fontSize: 9
  }
});
