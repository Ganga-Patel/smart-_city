import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function WeatherCard({ weather }) {
  const windSpeed = weather?.windSpeed ?? 12.4;
  const windDir = weather?.windDir ?? 'ENE';
  const lux = weather?.lux ?? 780;
  const pressure = weather?.pressure ?? 1013;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="weather-windy" size={18} color={Colors.status.warning} />
        </View>
        <Text style={styles.headerTitle}>Weather & Anemometer</Text>
        <View style={styles.portBadge}>
          <Text style={styles.portText}>RS485 Bus</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {/* Wind Speed */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Wind Velocity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{windSpeed}</Text>
            <Text style={styles.itemUnit}>km/h</Text>
          </View>
        </View>

        {/* Wind Direction */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Direction</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{windDir}</Text>
            <Text style={styles.itemTag}>68°</Text>
          </View>
        </View>

        {/* Ambient Light */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Ambient Light</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{lux}</Text>
            <Text style={styles.itemUnit}>Lux</Text>
          </View>
        </View>

        {/* Atmospheric Pressure */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Air Pressure</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{pressure}</Text>
            <Text style={styles.itemUnit}>hPa</Text>
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
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1
  },
  portBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  portText: {
    color: Colors.text.muted,
    fontSize: 9,
    fontFamily: 'monospace'
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
    fontSize: 16,
    fontWeight: '800'
  },
  itemUnit: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500'
  },
  itemTag: {
    color: Colors.status.warning,
    fontSize: 10,
    fontWeight: '600'
  }
});
