import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function TrafficCard({ traffic }) {
  const speed = traffic?.currentSpeed ?? 38;
  const status = traffic?.status || 'Smooth Flow';
  const congestion = traffic?.congestionIndex ?? 20;
  const delaySec = traffic?.delaySeconds ?? 25;
  const corridors = traffic?.corridors || [];

  const isSmooth = congestion < 30;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="car-multiple" size={18} color="#f59e0b" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Anand Urban Traffic</Text>
          <Text style={styles.headerSubtitle}>Live Arterial Corridor Flow</Text>
        </View>
        <View style={[styles.statusBadge, isSmooth ? styles.statusSmooth : styles.statusModerate]}>
          <Text style={[styles.statusText, isSmooth ? { color: '#10b981' } : { color: '#f59e0b' }]}>
            {status}
          </Text>
        </View>
      </View>

      {/* Main Velocity & Delay Highlight */}
      <View style={styles.highlightRow}>
        <View>
          <Text style={styles.metricLabel}>Arterial Velocity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.speedValue}>{speed}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        </View>
        <View style={styles.delayBlock}>
          <Text style={styles.metricLabel}>Congestion Delay</Text>
          <Text style={styles.delayValue}>+{delaySec}s delay</Text>
          <Text style={styles.congestionText}>{congestion}% Congestion Index</Text>
        </View>
      </View>

      {/* Corridor Breakdown */}
      {corridors.length > 0 && (
        <View style={styles.corridorsList}>
          <Text style={styles.corridorsHeader}>Key Arteries:</Text>
          {corridors.slice(0, 3).map((c, idx) => (
            <View key={idx} style={styles.corridorItem}>
              <View style={styles.corridorLeft}>
                <MaterialCommunityIcons name="road-variant" size={14} color="#94a3b8" />
                <Text style={styles.corridorName} numberOfLines={1}>{c.name}</Text>
              </View>
              <View style={styles.corridorRight}>
                <Text style={styles.corridorSpeed}>{c.speed} km/h</Text>
                <Text style={styles.corridorStatus}>{c.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
  statusSmooth: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  statusModerate: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  statusText: {
    fontSize: 11,
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
  metricLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2
  },
  speedValue: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  speedUnit: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '800'
  },
  delayBlock: {
    alignItems: 'flex-end'
  },
  delayValue: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  congestionText: {
    color: Colors.text.muted,
    fontSize: 10
  },
  corridorsList: {
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  corridorsHeader: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  corridorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  corridorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  corridorName: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '500'
  },
  corridorRight: {
    alignItems: 'flex-end'
  },
  corridorSpeed: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  corridorStatus: {
    color: Colors.text.muted,
    fontSize: 9
  }
});
