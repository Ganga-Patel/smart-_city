import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

export default function TrafficCard({ traffic, theme: appTheme = DarkTheme, isDark = true }) {
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

  const statusStyle = getStatusTheme();

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
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.25)'
          }
        ]}>
          <MaterialCommunityIcons name="car-multiple" size={18} color="#f59e0b" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={[styles.headerTitle, { color: appTheme.text.primary }]}>Urban Mobility & Live Traffic</Text>
          <Text style={[styles.headerSubtitle, { color: appTheme.text.secondary }]}>Mappls Arterial Corridor Tracking</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
        </View>
      </View>

      {/* Main Velocity & Delay Highlight */}
      <View style={styles.highlightRow}>
        <View style={styles.speedBlock}>
          <Text style={[styles.metricLabel, { color: appTheme.text.secondary }]}>ARTERIAL VELOCITY</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.speedValue, { color: appTheme.text.primary }]}>{speed}</Text>
            <Text style={[styles.speedUnit, { color: appTheme.text.secondary }]}>km/h</Text>
          </View>
          <Text style={[styles.freeFlowText, { color: appTheme.text.muted }]}>Free flow: {freeFlow} km/h</Text>
        </View>

        <View style={styles.delayBlock}>
          <View style={[styles.delayPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <MaterialCommunityIcons name="timer-sand" size={14} color={statusStyle.color} />
            <Text style={[styles.delayText, { color: statusStyle.color }]}>
              +{(delaySec / 60).toFixed(1)} min delay
            </Text>
          </View>
          <Text style={[styles.confidenceText, { color: appTheme.text.muted }]}>Signal Confidence: {confidence}%</Text>
        </View>
      </View>

      {/* Congestion Gauge Bar */}
      <View style={styles.barContainer}>
        <View style={styles.barLabels}>
          <Text style={[styles.barLabelLeft, { color: appTheme.text.secondary }]}>Congestion Index</Text>
          <Text style={[styles.barLabelRight, { color: statusStyle.color }]}>{congestion}%</Text>
        </View>
        <View style={[styles.trackBar, { backgroundColor: appTheme.trackBg }]}>
          <View 
            style={[
              styles.fillBar, 
              { 
                width: `${Math.min(congestion, 100)}%`, 
                backgroundColor: statusStyle.color 
              }
            ]} 
          />
        </View>
      </View>

      {/* Arterial Corridor List */}
      <Text style={[styles.sectionSubtitle, { color: appTheme.text.secondary }]}>MONITORED ANAND CORRIDORS</Text>
      <View style={styles.corridorList}>
        {corridors.length === 0 ? (
          <View style={[styles.corridorItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
            <Text style={[styles.corridorName, { color: appTheme.text.primary }]}>Station Road &bull; Amul Dairy Rd</Text>
            <Text style={[styles.corridorSpeed, { color: appTheme.brand.sky }]}>28 km/h &bull; Normal</Text>
          </View>
        ) : (
          corridors.map((c, i) => {
            const isCorridorHeavy = (c.congestion || 0) >= 50;
            const isCorridorModerate = (c.congestion || 0) >= 35;
            const cColor = isCorridorHeavy ? '#ef4444' : (isCorridorModerate ? '#f59e0b' : '#10b981');
            return (
              <View key={c.id || i} style={[styles.corridorItem, { backgroundColor: appTheme.subtle, borderColor: appTheme.cardBorder }]}>
                <View style={styles.corridorLeft}>
                  <View style={[styles.corridorDot, { backgroundColor: cColor }]} />
                  <Text style={[styles.corridorName, { color: appTheme.text.primary }]}>{c.name}</Text>
                </View>
                <View style={styles.corridorRight}>
                  <Text style={[styles.corridorSpeed, { color: cColor }]}>
                    {c.speed} km/h
                  </Text>
                  <Text style={[styles.corridorDelay, { color: appTheme.text.muted }]}>
                    +{c.delaySec}s
                  </Text>
                </View>
              </View>
            );
          })
        )}
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
    marginBottom: 12
  },
  speedBlock: {
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
  speedValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: '600'
  },
  freeFlowText: {
    fontSize: 10,
    marginTop: 2
  },
  delayBlock: {
    alignItems: 'flex-end',
    gap: 4
  },
  delayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4
  },
  delayText: {
    fontSize: 11,
    fontWeight: '700'
  },
  confidenceText: {
    fontSize: 9
  },
  barContainer: {
    marginBottom: 14
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  barLabelLeft: {
    fontSize: 10,
    fontWeight: '600'
  },
  barLabelRight: {
    fontSize: 10,
    fontWeight: '800'
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  fillBar: {
    height: '100%',
    borderRadius: 3
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  corridorList: {
    gap: 6
  },
  corridorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  corridorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  corridorDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  corridorName: {
    fontSize: 11,
    fontWeight: '600'
  },
  corridorRight: {
    alignItems: 'flex-end'
  },
  corridorSpeed: {
    fontSize: 11,
    fontWeight: '800'
  },
  corridorDelay: {
    fontSize: 9
  }
});
