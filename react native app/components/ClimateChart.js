import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function ClimateChart({ history = [] }) {
  const displayPoints = history.slice(-10); // Show last 10 points

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={Colors.brand.sky} />
        </View>
        <Text style={styles.headerTitle}>Live Climate Timeline</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={styles.legendText}>Temp</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.legendText}>Hum</Text>
          </View>
        </View>
      </View>

      {/* Visual Sparkline Stream */}
      <View style={styles.timelineRow}>
        {displayPoints.length > 0 ? (
          displayPoints.map((pt, idx) => {
            const tempHeight = Math.max(15, Math.min(60, (pt.temperature / 45) * 60));
            const humHeight = Math.max(15, Math.min(60, (pt.humidity / 100) * 60));
            const timeLabel = new Date(pt.timestamp).toLocaleTimeString('en-GB', { minute: '2-digit', second: '2-digit' });

            return (
              <View key={idx} style={styles.pointCol}>
                <View style={styles.barsContainer}>
                  {/* Temp Bar */}
                  <View style={[styles.bar, { height: tempHeight, backgroundColor: '#f43f5e' }]} />
                  {/* Humidity Bar */}
                  <View style={[styles.bar, { height: humHeight, backgroundColor: '#38bdf8' }]} />
                </View>
                <Text style={styles.timeLabel}>{timeLabel}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Gathering real-time telemetry buffer...</Text>
          </View>
        )}
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
    marginBottom: 14
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
  legendRow: {
    flexDirection: 'row',
    gap: 10
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '600'
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    paddingTop: 10
  },
  pointCol: {
    alignItems: 'center',
    flex: 1
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 65
  },
  bar: {
    width: 6,
    borderRadius: 3
  },
  timeLabel: {
    color: Colors.text.muted,
    fontSize: 8,
    marginTop: 6,
    fontFamily: 'monospace'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 11
  }
});
