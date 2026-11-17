import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function SolarEnergyCard({ astronomy }) {
  // Solar ephemeris & simulated smart grid telemetry based on solar elevation
  const sunrise = astronomy?.sunrise || '06:48 AM';
  const sunset = astronomy?.sunset || '06:05 PM';
  const solarIrradiance = 820; // W/m²
  const pvOutput = 3.8; // kW
  const batteryLevel = 92; // %
  const gridFeed = 2.4; // kW

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="solar-power" size={18} color="#f59e0b" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Renewable Solar & Grid Flow</Text>
          <Text style={styles.headerSubtitle}>Urban Photovoltaic Telemetry</Text>
        </View>
        <View style={styles.badgeSolar}>
          <Text style={styles.badgeSolarText}>Grid Tied</Text>
        </View>
      </View>

      {/* Primary Highlights: PV Power & Solar Irradiance */}
      <View style={styles.highlightRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>PV Generation</Text>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue}>{pvOutput}</Text>
            <Text style={styles.metricUnit}>kW</Text>
          </View>
          <Text style={styles.metricSub}>Active Inverter Output</Text>
        </View>

        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Solar Irradiance</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{solarIrradiance}</Text>
            <Text style={styles.metricUnit}>W/m²</Text>
          </View>
          <Text style={styles.metricSub}>Peak Daylight Hours</Text>
        </View>
      </View>

      {/* Grid of Battery Storage & Grid Feed */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Battery Storage</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{batteryLevel}%</Text>
            <Text style={styles.itemUnit}>• 13.8 kWh</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${batteryLevel}%`, backgroundColor: '#10b981' }]} />
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Grid Export / Feed</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{gridFeed}</Text>
            <Text style={styles.itemUnit}>kW Export</Text>
          </View>
          <Text style={styles.itemTag}>Net Metering Active</Text>
        </View>
      </View>

      {/* Ephemeris Footer */}
      <View style={styles.footerRow}>
        <View style={styles.ephemerisItem}>
          <MaterialCommunityIcons name="weather-sunset-up" size={14} color="#f59e0b" />
          <Text style={styles.ephemerisText}>Sunrise: {sunrise}</Text>
        </View>
        <View style={styles.ephemerisItem}>
          <MaterialCommunityIcons name="weather-sunset-down" size={14} color="#f97316" />
          <Text style={styles.ephemerisText}>Sunset: {sunset}</Text>
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
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
  badgeSolar: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  badgeSolarText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700'
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  metricBlock: {
    flex: 1,
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4
  },
  metricValue: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: '800'
  },
  metricUnit: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600'
  },
  metricSub: {
    color: '#64748b',
    fontSize: 9
  },
  grid: {
    flexDirection: 'row',
    gap: 12
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  itemLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  },
  itemValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800'
  },
  itemUnit: {
    color: '#64748b',
    fontSize: 10
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  itemTag: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    marginTop: 12
  },
  ephemerisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  ephemerisText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600'
  }
});
