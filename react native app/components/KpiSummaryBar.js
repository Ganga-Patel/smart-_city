import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function KpiSummaryBar({ telemetry, isConnected = true, packetCount = 0 }) {
  const isGasAlert = telemetry?.gasAlert || false;
  const isRaining = telemetry?.rainDetected || false;

  const getSafetyStatus = () => {
    if (isGasAlert) return { text: 'Gas Alert', color: '#ef4444', icon: 'alert-octagon' };
    if (isRaining) return { text: 'Precipitation', color: '#06b6d4', icon: 'weather-rainy' };
    return { text: 'Nominal', color: '#10b981', icon: 'shield-check' };
  };

  const safety = getSafetyStatus();

  return (
    <View style={styles.container}>
      {/* KPI 1: Stream Health */}
      <View style={styles.kpiCard}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
          <MaterialCommunityIcons name="radio-tower" size={16} color="#10b981" />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.kpiLabel}>STREAM HEALTH</Text>
          <Text style={[styles.kpiValue, { color: isConnected ? '#10b981' : '#ef4444' }]} numberOfLines={1}>
            {isConnected ? '100% Active' : 'Offline'}
          </Text>
          <Text style={styles.kpiSub}>Zero Latency</Text>
        </View>
      </View>

      {/* KPI 2: Monitored Probes */}
      <View style={styles.kpiCard}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
          <MaterialCommunityIcons name="chip" size={16} color="#38bdf8" />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.kpiLabel}>MONITORED</Text>
          <Text style={styles.kpiValue} numberOfLines={1}>4 Online Probes</Text>
          <Text style={styles.kpiSub}>Microclimate & Gas</Text>
        </View>
      </View>

      {/* KPI 3: Ingestion Volume */}
      <View style={styles.kpiCard}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
          <MaterialCommunityIcons name="layers" size={16} color="#f59e0b" />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.kpiLabel}>INGESTION</Text>
          <Text style={styles.kpiValue} numberOfLines={1}>Live Stream</Text>
          <Text style={styles.kpiSub}>Real Ingestion</Text>
        </View>
      </View>

      {/* KPI 4: Environmental Safety */}
      <View style={styles.kpiCard}>
        <View style={[styles.iconBox, { backgroundColor: `${safety.color}20` }]}>
          <MaterialCommunityIcons name={safety.icon} size={16} color={safety.color} />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.kpiLabel}>ENV SAFETY</Text>
          <Text style={[styles.kpiValue, { color: safety.color }]} numberOfLines={1}>{safety.text}</Text>
          <Text style={styles.kpiSub}>Continuous Watch</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textWrapper: {
    flex: 1
  },
  kpiLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  kpiValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1
  },
  kpiSub: {
    color: '#94a3b8',
    fontSize: 9,
    marginTop: 1
  }
});
