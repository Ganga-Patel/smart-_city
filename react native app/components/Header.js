import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

const BRAND_LOGO = require('../assets/logo.png');

export default function Header({ 
  isConnected = false, 
  lastSyncTime, 
  onRefresh, 
  isFahrenheit = false, 
  onToggleUnit,
  activeMode = 'sensor',
  location = 'Anand, Gujarat, India',
  theme = DarkTheme,
  isDark = true
}) {
  const safeFormatTime = (ts) => {
    try {
      if (!ts) return new Date().toLocaleTimeString('en-GB');
      const d = new Date(ts);
      if (isNaN(d.getTime())) return new Date().toLocaleTimeString('en-GB');
      return d.toLocaleTimeString('en-GB');
    } catch (e) {
      return '--:--:--';
    }
  };

  const isCity = activeMode === 'city';
  const timeStr = safeFormatTime(lastSyncTime);

  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor: theme.headerBg, 
        borderBottomColor: theme.surfaceBorder 
      }
    ]}>
      {/* Top Row: Brand & Identity */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          {/* Website 1:1 Brand Logo */}
          <View style={[
            styles.logoBox, 
            { 
              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.25)'
            }
          ]}>
            <Image 
              source={BRAND_LOGO} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: theme.text.primary }]}>
                {isCity ? 'Smart City Weather & Mobility' : 'Smart City Sensor Dashboard'}
              </Text>
              <View style={[
                styles.pillBadge,
                {
                  backgroundColor: isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)'
                }
              ]}>
                <View style={[styles.pulseDotCyan, { backgroundColor: theme.brand.sky }]} />
                <Text style={[styles.pillBadgeText, { color: theme.brand.sky }]}>
                  {isCity ? 'Global Live' : 'Sector 4 Node'}
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitleText, { color: theme.text.secondary }]} numberOfLines={1}>
              {isCity 
                ? `Real-Time City Telemetry • ${location}` 
                : 'Real-Time Environmental Telemetry • Minimal Command Center'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls Bar: Status, Clock, Unit Toggle & Refresh (Dashboard Switch is strictly in the Footer) */}
      <View style={[styles.controlsBar, { borderTopColor: theme.surfaceBorder }]}>
        <View style={styles.controlsLeft}>
          {/* Live Protocol Status Pill */}
          <View style={[
            styles.statusBadge, 
            isConnected 
              ? { backgroundColor: theme.status.successBg, borderColor: theme.status.successBorder } 
              : { backgroundColor: theme.status.dangerBg, borderColor: theme.status.dangerBorder }
          ]}>
            <View style={[
              styles.pulseDot, 
              { backgroundColor: isConnected ? theme.status.success : theme.status.danger }
            ]} />
            <Text style={[
              styles.statusText, 
              { color: isConnected ? theme.status.success : theme.status.danger }
            ]}>
              {isConnected ? 'Live Telemetry' : 'Offline'}
            </Text>
          </View>

          {/* Clock Pill */}
          <View style={[
            styles.clockPill, 
            { 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
              borderColor: theme.surfaceBorder
            }
          ]}>
            <MaterialCommunityIcons name="clock-outline" size={11} color={theme.text.muted} />
            <Text style={[styles.clockText, { color: theme.text.secondary }]}>
              {timeStr}
            </Text>
          </View>
        </View>

        <View style={styles.controlsRight}>
          {/* Unit Toggle Button */}
          {onToggleUnit && (
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                { 
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  borderColor: theme.surfaceBorder
                }
              ]} 
              onPress={onToggleUnit}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: theme.brand.sky }]}>
                {isFahrenheit ? '°F' : '°C'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Manual Refresh Trigger */}
          {onRefresh && (
            <TouchableOpacity 
              style={[
                styles.iconBtn, 
                { 
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  borderColor: theme.surfaceBorder
                }
              ]} 
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="sync" size={13} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2
  },
  logoImage: {
    width: 30,
    height: 30
  },
  titleColumn: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 12,
    borderWidth: 1
  },
  pulseDotCyan: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  clockText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  actionBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  actionBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
