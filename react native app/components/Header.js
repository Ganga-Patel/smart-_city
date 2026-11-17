import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ 
  isConnected, 
  lastSyncTime, 
  onRefresh, 
  isFahrenheit, 
  onToggleUnit 
}) {
  const timeStr = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleTimeString('en-GB') 
    : new Date().toLocaleTimeString('en-GB');

  return (
    <View style={styles.header}>
      {/* Left: Brand Emblem & Station Identity */}
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="cpu-64-bit" size={20} color="#38bdf8" />
        </View>
        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Smart City Sensor Dashboard</Text>
            <View style={styles.stationPill}>
              <View style={styles.pulseDotCyan} />
              <Text style={styles.stationPillText}>Sector 4 Node</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>
            Real-Time Environmental Telemetry &bull; Minimal Command Center
          </Text>
        </View>
      </View>

      {/* Right Controls: Live Protocol Status, Clock & Actions */}
      <View style={styles.actionsRow}>
        {/* Live Status Pill */}
        <View style={[styles.statusBadge, isConnected ? styles.statusBadgeLive : styles.statusBadgeOffline]}>
          <View style={[styles.pulseDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={[styles.statusText, { color: isConnected ? '#10b981' : '#ef4444' }]}>
            {isConnected ? 'Live Connected' : 'Offline'}
          </Text>
        </View>

        {/* Updated Clock Pill */}
        <View style={styles.clockPill}>
          <MaterialCommunityIcons name="clock-outline" size={11} color="#64748b" />
          <Text style={styles.clockText}>Updated: <Text style={styles.clockBold}>{timeStr}</Text></Text>
        </View>

        {/* Unit Toggle Button */}
        {onToggleUnit && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={onToggleUnit}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>{isFahrenheit ? '°F' : '°C'}</Text>
          </TouchableOpacity>
        )}

        {/* Manual Refresh Trigger */}
        {onRefresh && (
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="sync" size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.8)',
    flexDirection: 'column',
    gap: 8,
    zIndex: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)'
  },
  pulseDotCyan: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38bdf8'
  },
  stationPillText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  statusBadgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  clockText: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  clockBold: {
    color: '#e2e8f0',
    fontWeight: '700'
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  actionBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
