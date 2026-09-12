import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import ClimateChart from '../components/ClimateChart';

export default function AnalyticsScreen({ history, telemetry }) {
  const temps = history.map(h => h.temperature);
  const hums = history.map(h => h.humidity);
  
  const minTemp = temps.length > 0 ? Math.min(...temps).toFixed(1) : '--';
  const maxTemp = temps.length > 0 ? Math.max(...temps).toFixed(1) : '--';
  const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';

  const minHum = hums.length > 0 ? Math.min(...hums).toFixed(0) : '--';
  const maxHum = hums.length > 0 ? Math.max(...hums).toFixed(0) : '--';
  const avgHum = hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(0) : '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Historical Telemetry Analytics</Text>
        <Text style={styles.subtitle}>Rolling buffer analysis & environmental statistics</Text>
      </View>

      {/* Main Climate Chart */}
      <ClimateChart history={history} />

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {/* Temperature Stats */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="thermometer" size={20} color="#f43f5e" />
            <Text style={styles.statTitle}>Temperature Trend</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{telemetry.temperature ? telemetry.temperature.toFixed(1) : '--'}°C</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{minTemp}°C</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{maxTemp}°C</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{avgTemp}°C</Text>
            </View>
          </View>
        </View>

        {/* Humidity Stats */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="water-percent" size={20} color="#38bdf8" />
            <Text style={styles.statTitle}>Humidity Trend</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{telemetry.humidity ? Math.round(telemetry.humidity) : '--'}%</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{minHum}%</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{maxHum}%</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{avgHum}%</Text>
            </View>
          </View>
        </View>

        {/* Gas & Environmental Safety */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="gas-cylinder" size={20} color="#10b981" />
            <Text style={styles.statTitle}>Gas Concentration Baseline</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current PPM</Text>
              <Text style={styles.statValue}>{telemetry.gasPpm || 120}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Warning Limit</Text>
              <Text style={styles.statValue}>300 PPM</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: Colors.status.success }]}>Stable</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  content: {
    padding: 16,
    paddingBottom: 30
  },
  header: {
    marginBottom: 8
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2
  },
  statsContainer: {
    gap: 12,
    marginTop: 14
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  statTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 12,
    padding: 10
  },
  statCol: {
    alignItems: 'center'
  },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600'
  },
  statValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: 'monospace'
  }
});
