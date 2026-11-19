import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

export default function TwelveHourAnalysisGraph({ 
  history = [], 
  isFahrenheit = false,
  theme = DarkTheme,
  isDark = true
}) {
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
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.card, 
        borderColor: theme.cardBorder 
      }
    ]}>
      {/* Top Header & Metric Selector Tabs */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={[styles.headerLabel, { color: theme.text.primary }]}>
            12-Hour Sensor Progression:
          </Text>
          <Text style={[styles.activeMetricTitle, { color: theme.brand.sky }]}>
            {activeMetric === 'climate' 
              ? 'Temperature & Humidity Trend' 
              : activeMetric === 'gas' 
                ? 'Gas & Air Safety Timeline' 
                : 'Precipitation Detection Timeline'}
          </Text>
        </View>

        <View style={[
          styles.tabContainer, 
          { 
            backgroundColor: theme.cardSubtle, 
            borderColor: theme.surfaceBorder 
          }
        ]}>
          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeMetric === 'climate' && {
                backgroundColor: isDark ? 'rgba(14, 165, 233, 0.25)' : 'rgba(14, 165, 233, 0.15)',
                borderWidth: 1,
                borderColor: theme.brand.sky
              }
            ]}
            onPress={() => setActiveMetric('climate')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { color: activeMetric === 'climate' ? theme.brand.sky : theme.text.muted },
              activeMetric === 'climate' && styles.tabTextActive
            ]}>
              Temp &bull; Hum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeMetric === 'gas' && {
                backgroundColor: isDark ? 'rgba(14, 165, 233, 0.25)' : 'rgba(14, 165, 233, 0.15)',
                borderWidth: 1,
                borderColor: theme.brand.sky
              }
            ]}
            onPress={() => setActiveMetric('gas')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { color: activeMetric === 'gas' ? theme.brand.sky : theme.text.muted },
              activeMetric === 'gas' && styles.tabTextActive
            ]}>
              Gas Safety
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeMetric === 'rain' && {
                backgroundColor: isDark ? 'rgba(14, 165, 233, 0.25)' : 'rgba(14, 165, 233, 0.15)',
                borderWidth: 1,
                borderColor: theme.brand.sky
              }
            ]}
            onPress={() => setActiveMetric('rain')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { color: activeMetric === 'rain' ? theme.brand.sky : theme.text.muted },
              activeMetric === 'rain' && styles.tabTextActive
            ]}>
              Rain
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend Row for Climate Mode */}
      {activeMetric === 'climate' && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>
              Temperature ({isFahrenheit ? '°F' : '°C'})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>
              Humidity (%)
            </Text>
          </View>
        </View>
      )}

      {/* Graph Plot Area */}
      <View style={styles.graphArea}>
        {/* Horizontal grid guidelines */}
        <View style={[styles.gridLineTop, { backgroundColor: theme.surfaceBorder }]} />
        <View style={[styles.gridLineMid, { backgroundColor: theme.surfaceBorder }]} />
        <View style={[styles.gridLineBottom, { backgroundColor: theme.surfaceBorder }]} />

        {samplePoints.length === 0 ? (
          <View style={[styles.emptyOverlay, { backgroundColor: isDark ? 'rgba(3, 7, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)' }]}>
            <MaterialCommunityIcons name="timer-sand" size={24} color={theme.brand.sky} />
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Collecting 12-Hour History</Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
              Live samples accumulate every cycle into hardware memory
            </Text>
          </View>
        ) : (
          <View style={styles.barsContainer}>
            {samplePoints.map((point, index) => {
              const timeLabel = safeFormatTime(point.timestamp);
              
              if (activeMetric === 'climate') {
                const dispT = toDispTemp(point.temperature);
                const hum = point.humidity ?? 50;
                // Normalize heights (temp roughly 0-50 C -> 0-100 px, hum 0-100% -> 0-100 px)
                const tempHeight = Math.max(10, Math.min(100, isFahrenheit ? (dispT - 32) * 1.5 : dispT * 2.2));
                const humHeight = Math.max(10, Math.min(100, hum));

                return (
                  <View key={index} style={styles.columnWrapper}>
                    <View style={styles.barsColumn}>
                      <View style={[styles.singleBar, { height: tempHeight, backgroundColor: '#f43f5e' }]} />
                      <View style={[styles.singleBar, { height: humHeight, backgroundColor: '#38bdf8' }]} />
                    </View>
                    {index % 3 === 0 && (
                      <Text style={[styles.axisTimeText, { color: theme.text.muted }]}>{timeLabel}</Text>
                    )}
                  </View>
                );
              }

              if (activeMetric === 'gas') {
                const isAlert = point.isGasAlert;
                const gasHeight = isAlert ? 95 : 25;
                const barColor = isAlert ? '#ef4444' : '#10b981';

                return (
                  <View key={index} style={styles.columnWrapper}>
                    <View style={styles.barsColumn}>
                      <View style={[styles.singleBarWide, { height: gasHeight, backgroundColor: barColor }]} />
                    </View>
                    {index % 3 === 0 && (
                      <Text style={[styles.axisTimeText, { color: theme.text.muted }]}>{timeLabel}</Text>
                    )}
                  </View>
                );
              }

              if (activeMetric === 'rain') {
                const isRaining = point.isRaining;
                const rainHeight = isRaining ? 95 : 15;
                const barColor = isRaining ? '#38bdf8' : (isDark ? '#334155' : '#cbd5e1');

                return (
                  <View key={index} style={styles.columnWrapper}>
                    <View style={styles.barsColumn}>
                      <View style={[styles.singleBarWide, { height: rainHeight, backgroundColor: barColor }]} />
                    </View>
                    {index % 3 === 0 && (
                      <Text style={[styles.axisTimeText, { color: theme.text.muted }]}>{timeLabel}</Text>
                    )}
                  </View>
                );
              }

              return null;
            })}
          </View>
        )}
      </View>

      {/* Footer Info */}
      <View style={[styles.footerRow, { borderTopColor: theme.surfaceBorder }]}>
        <Text style={[styles.footerText, { color: theme.text.muted }]}>
          Sample Frequency: Rolling 12-Hour Telemetry Buffer
        </Text>
        <Text style={[styles.footerText, { color: theme.text.muted }]}>
          {records.length} Points
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 14
  },
  headerRow: {
    marginBottom: 8
  },
  titleWrapper: {
    marginBottom: 8
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  activeMetricTitle: {
    fontSize: 11,
    fontFamily: 'monospace'
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7
  },
  tabText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  tabTextActive: {
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
    height: 1
  },
  gridLineMid: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    height: 1
  },
  gridLineBottom: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    height: 1
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
    fontFamily: 'monospace'
  },
  emptyOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 12
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  emptySubtitle: {
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
    borderTopWidth: 1
  },
  footerText: {
    fontSize: 9,
    fontFamily: 'monospace'
  }
});
