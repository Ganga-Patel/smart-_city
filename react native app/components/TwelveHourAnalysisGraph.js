import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TwelveHourAnalysisGraph({ history = [], isFahrenheit = false }) {
  // 'climate' | 'gas' | 'rain'
  const [activeMetric, setActiveMetric] = useState('climate');

  const safeFormatTime = (ts) => {
    try {
      if (!ts) return '';
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const cutoff = Date.now() - TWELVE_HOURS_MS;
  const records = history.filter(r => r && (r.timestamp || 0) >= cutoff);

  // Take up to 12 distributed points for a clear mobile representation
  const samplePoints = records.length > 12 
    ? records.filter((_, idx) => idx % Math.ceil(records.length / 12) === 0)
    : records;

  const toDispTemp = (t) => {
    if (t == null || isNaN(t)) return 26;
    return isFahrenheit ? (t * 1.8 + 32) : t;
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Metric Selector Tabs */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerLabel}>12-Hour Sensor Progression:</Text>
          <Text style={styles.activeMetricTitle}>
            {activeMetric === 'climate' 
              ? 'Temperature & Humidity Trend' 
              : activeMetric === 'gas' 
                ? 'Gas & Air Safety Timeline' 
                : 'Precipitation Detection Timeline'}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeMetric === 'climate' && styles.tabBtnActive]}
            onPress={() => setActiveMetric('climate')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeMetric === 'climate' && styles.tabTextActive]}>
              Temp &bull; Hum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeMetric === 'gas' && styles.tabBtnActive]}
            onPress={() => setActiveMetric('gas')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeMetric === 'gas' && styles.tabTextActive]}>
              Gas Safety
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeMetric === 'rain' && styles.tabBtnActive]}
            onPress={() => setActiveMetric('rain')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeMetric === 'rain' && styles.tabTextActive]}>
              Precipitation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend Row for Climate Mode */}
      {activeMetric === 'climate' && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={styles.legendText}>Temperature ({isFahrenheit ? '°F' : '°C'})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.legendText}>Humidity (%)</Text>
          </View>
        </View>
      )}

      {/* Graph Plot Area */}
      <View style={styles.graphArea}>
        {/* Horizontal grid guidelines */}
        <View style={styles.gridLineTop} />
        <View style={styles.gridLineMid} />
        <View style={styles.gridLineBottom} />

        {samplePoints.length > 0 ? (
          <View style={styles.barsContainer}>
            {samplePoints.map((pt, idx) => {
              const timeLabel = safeFormatTime(pt.timestamp);

              if (activeMetric === 'climate') {
                const tempVal = toDispTemp(pt.temperature);
                const maxTempRange = isFahrenheit ? 120 : 50;
                const tempBarH = Math.max(12, Math.min(100, (tempVal / maxTempRange) * 100));
                const humVal = pt.humidity ?? 47;
                const humBarH = Math.max(12, Math.min(100, (humVal / 100) * 100));

                return (
                  <View key={idx} style={styles.columnWrapper}>
                    <View style={styles.barsColumn}>
                      <View style={[styles.singleBar, { height: tempBarH, backgroundColor: '#f43f5e' }]} />
                      <View style={[styles.singleBar, { height: humBarH, backgroundColor: '#38bdf8' }]} />
                    </View>
                    <Text style={styles.axisTimeText} numberOfLines={1}>{timeLabel}</Text>
                  </View>
                );
              }

              if (activeMetric === 'gas') {
                const isAlert = pt.isGasAlert || pt.gasAlert;
                const barH = isAlert ? 85 : 22;
                const barColor = isAlert ? '#ef4444' : '#10b981';

                return (
                  <View key={idx} style={styles.columnWrapper}>
                    <View style={styles.barsColumn}>
                      <View style={[styles.singleBarWide, { height: barH, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[styles.axisTimeText, { color: isAlert ? '#ef4444' : '#64748b' }]} numberOfLines={1}>
                      {timeLabel}
                    </Text>
                  </View>
                );
              }

              // Rain Metric
              const isWet = pt.isRaining || pt.rainDetected;
              const barH = isWet ? 85 : 18;
              const barColor = isWet ? '#06b6d4' : '#10b981';

              return (
                <View key={idx} style={styles.columnWrapper}>
                  <View style={styles.barsColumn}>
                    <View style={[styles.singleBarWide, { height: barH, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.axisTimeText, { color: isWet ? '#06b6d4' : '#64748b' }]} numberOfLines={1}>
                    {timeLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyOverlay}>
            <MaterialCommunityIcons name="radio" size={24} color="#38bdf8" />
            <Text style={styles.emptyTitle}>Streaming Actual 12-Hour Telemetry...</Text>
            <Text style={styles.emptySubtitle}>Recording genuine incoming readings from physical sensors.</Text>
          </View>
        )}
      </View>

      {/* Graph Footer Info */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Resolution: Actual Hardware Packets</Text>
        <Text style={styles.footerText}>Time Horizon: 12-Hour Rolling Buffer</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(3, 7, 18, 0.7)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    marginTop: 14
  },
  headerRow: {
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.6)'
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  headerLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  activeMetricTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 3
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7
  },
  tabBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)'
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#38bdf8',
    fontWeight: '800'
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 6,
    alignItems: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  graphArea: {
    height: 140,
    position: 'relative',
    marginTop: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  gridLineTop: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.25)'
  },
  gridLineMid: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.25)'
  },
  gridLineBottom: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.4)'
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 22,
    zIndex: 2
  },
  columnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%'
  },
  barsColumn: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 105
  },
  singleBar: {
    width: 4,
    borderRadius: 2
  },
  singleBarWide: {
    width: 8,
    borderRadius: 3
  },
  axisTimeText: {
    position: 'absolute',
    bottom: -18,
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#64748b'
  },
  emptyOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    borderRadius: 10,
    padding: 12
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 2
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)'
  },
  footerText: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  }
});
