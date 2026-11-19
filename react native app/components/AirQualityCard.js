import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

export default function AirQualityCard({ airQuality, theme: appTheme = DarkTheme, isDark = true }) {
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

  const aqiLevel = getAqiTheme(aqi);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: appTheme.card, 
        borderColor: appTheme.cardBorder 
      }
    ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[
          styles.headerIcon,
          {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.25)'
          }
        ]}>
          <MaterialCommunityIcons name="molecule" size={18} color="#10b981" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={[styles.headerTitle, { color: appTheme.text.primary }]}>Urban Air Quality Index</Text>
          <Text style={[styles.headerSubtitle, { color: appTheme.text.secondary }]}>Atmospheric Pollutant Telemetry</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: aqiLevel.bg, borderColor: aqiLevel.border }]}>
          <Text style={[styles.statusText, { color: aqiLevel.color }]}>{status}</Text>
        </View>
      </View>

      {/* Main AQI Meter Display */}
      <View style={styles.highlightRow}>
        <View style={styles.aqiBlock}>
          <Text style={[styles.metricLabel, { color: appTheme.text.secondary }]}>COMPOSITE AQI SCORE</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.aqiValue, { color: aqiLevel.color }]}>{aqi}</Text>
            <Text style={[styles.aqiMax, { color: appTheme.text.muted }]}>/ 500</Text>
          </View>
        </View>

        <View style={styles.advisoryBlock}>
          <View style={[styles.advisoryPill, { backgroundColor: aqiLevel.bg, borderColor: aqiLevel.border }]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={13} color={aqiLevel.color} />
            <Text style={[styles.advisoryText, { color: aqiLevel.color }]} numberOfLines={2}>
              {aqiLevel.advisory}
            </Text>
          </View>
        </View>
      </View>

      {/* Pollutant Matrix */}
      <View style={styles.grid}>
        {/* PM2.5 */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>PM2.5</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Fine Particles</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: pm25 > 35 ? '#ef4444' : '#10b981' }]}>{pm25}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
        </View>

        {/* PM10 */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>PM10</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Coarse Dust</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: pm10 > 50 ? '#f59e0b' : '#10b981' }]}>{pm10}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
        </View>

        {/* Ozone (O3) */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>Ozone (O₃)</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Surface Gas</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: appTheme.text.primary }]}>{o3}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
        </View>

        {/* Nitrogen Dioxide (NO2) */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>NO₂</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Auto Emissions</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: appTheme.text.primary }]}>{no2}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
        </View>

        {/* Carbon Monoxide (CO) */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>CO</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Combustion</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: appTheme.text.primary }]}>{co}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
        </View>

        {/* Sulfur Dioxide (SO2) */}
        <View style={[styles.gridItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.pollutantName, { color: appTheme.text.primary }]}>SO₂</Text>
            <Text style={[styles.pollutantType, { color: appTheme.text.muted }]}>Industrial Gas</Text>
          </View>
          <View style={styles.itemValueRow}>
            <Text style={[styles.itemValue, { color: appTheme.text.primary }]}>{so2}</Text>
            <Text style={[styles.itemUnit, { color: appTheme.text.muted }]}>µg/m³</Text>
          </View>
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
    marginTop: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  titleWrapper: {
    flex: 1
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10
  },
  aqiBlock: {
    flex: 1
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  aqiValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1
  },
  aqiMax: {
    fontSize: 12,
    fontWeight: '600'
  },
  advisoryBlock: {
    flex: 1.2
  },
  advisoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  advisoryText: {
    fontSize: 9,
    fontWeight: '600',
    flex: 1,
    lineHeight: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4
  },
  pollutantName: {
    fontSize: 11,
    fontWeight: '700'
  },
  pollutantType: {
    fontSize: 9
  },
  itemValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '800'
  },
  itemUnit: {
    fontSize: 9
  }
});
