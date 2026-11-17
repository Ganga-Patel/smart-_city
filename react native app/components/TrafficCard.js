import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function TrafficCard({ traffic }) {
  const speed = traffic?.currentSpeed ?? 27;
  const freeFlow = traffic?.freeFlowSpeed ?? 54;
  const status = traffic?.status || 'Moderate Flow';
  const congestion = traffic?.congestionIndex ?? 48;
  const delaySec = traffic?.delaySeconds ?? 367;
  const corridors = traffic?.corridors || [];
  const confidence = traffic?.confidence ?? 96;

  const isSmooth = congestion < 30;
  const isHeavy = congestion >= 50;

  const getStatusTheme = () => {
    if (isHeavy) {
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (isSmooth) {
      return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    }
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
  };

  const theme = getStatusTheme();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="car-multiple" size={18} color="#f59e0b" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Urban Mobility &amp; Live Traffic</Text>
          <Text style={styles.headerSubtitle}>Mappls Arterial Corridor Tracking</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.statusText, { color: theme.color }]}>{status}</Text>
        </View>
      </View>

      {/* Main Velocity & Delay Highlight */}
      <View style={styles.highlightRow}>
        <View style={styles.speedBlock}>
          <Text style={styles.metricLabel}>ARTERIAL VELOCITY</Text>
          <View style={styles.valueRow}>
            <Text style={styles.speedValue}>{speed}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
          <Text style={styles.freeFlowText}>Base Free-Flow: {freeFlow} km/h</Text>
        </View>

        <View style={styles.delayBlock}>
          <Text style={styles.metricLabel}>CONGESTION INDEX</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.speedValue, { color: theme.color }]}>{congestion}%</Text>
          </View>
          <Text style={styles.delayText}>+{delaySec}s Estimated Delay</Text>
        </View>
      </View>

      {/* Active Corridors Breakdown */}
      {corridors.length > 0 && (
        <View style={styles.corridorsList}>
          <Text style={styles.corridorsHeader}>Monitored Indian Arterial Corridors:</Text>
          {corridors.slice(0, 4).map((c, idx) => {
            const corridorHeavy = (c.congestion ?? 0) >= 50;
            const corridorSmooth = (c.congestion ?? 0) < 35;
            const cColor = corridorHeavy ? '#ef4444' : corridorSmooth ? '#10b981' : '#f59e0b';

            return (
              <View key={idx} style={styles.corridorItem}>
                <View style={styles.corridorLeft}>
                  <MaterialCommunityIcons name="road-variant" size={14} color="#38bdf8" />
                  <Text style={styles.corridorName} numberOfLines={1}>{c.name}</Text>
                </View>
                <View style={styles.corridorRight}>
                  <Text style={styles.corridorSpeed}>{c.speed} km/h</Text>
                  <View style={[styles.corridorBadge, { backgroundColor: `${cColor}18` }]}>
                    <Text style={[styles.corridorStatus, { color: cColor }]}>{c.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer Info */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Flow Engine: Mappls Traffic &bull; Reliability {confidence}%</Text>
        <View style={styles.liveDotRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>Active Corridors</Text>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  highlightRow: {
    flexDirection: 'row',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    gap: 16
  },
  speedBlock: {
    flex: 1
  },
  delayBlock: {
    flex: 1
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2
  },
  speedValue: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800'
  },
  speedUnit: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  freeFlowText: {
    color: '#64748b',
    fontSize: 9
  },
  delayText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  },
  corridorsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    gap: 6
  },
  corridorsHeader: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2
  },
  corridorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070b14',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  corridorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  corridorName: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    flex: 1
  },
  corridorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  corridorSpeed: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700'
  },
  corridorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  corridorStatus: {
    fontSize: 9,
    fontWeight: '700'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginTop: 10
  },
  footerText: {
    color: '#64748b',
    fontSize: 9
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981'
  },
  liveText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700'
  }
});
