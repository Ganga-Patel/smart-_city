import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ 
  isConnected = false, 
  lastSyncTime, 
  onRefresh, 
  isFahrenheit = false, 
  onToggleUnit,
  activeMode = 'sensor',
  onToggleMode,
  location = 'Anand, Gujarat, India',
  viewEngine = 'webMirror',
  onToggleViewEngine
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
    <View style={styles.header}>
      {/* Top Row: Brand & Identity */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons 
              name={isCity ? "city-variant" : "cpu-64-bit"} 
              size={20} 
              color="#38bdf8" 
            />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>
                {isCity ? 'Smart City Weather & Mobility' : 'Smart City Sensor Dashboard'}
              </Text>
              <View style={styles.pillBadge}>
                <View style={styles.pulseDotCyan} />
                <Text style={styles.pillBadgeText}>
                  {isCity ? 'Global Live' : 'Sector 4 Node'}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {isCity 
                ? `Real-Time City Telemetry • ${location}` 
                : 'Real-Time Environmental Telemetry • Minimal Command Center'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls Bar: Mode Switcher, Status & Actions */}
      <View style={styles.controlsBar}>
        {/* Switch Dashboard Mode Button (City <-> Sensors) */}
        {onToggleMode && (
          <TouchableOpacity 
            style={styles.modeSwitchBtn} 
            onPress={onToggleMode}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isCity ? "cpu-64-bit" : "city-variant"} 
              size={13} 
              color="#38bdf8" 
            />
            <Text style={styles.modeSwitchBtnText}>
              {isCity ? 'Sensors' : 'City'}
            </Text>
          </TouchableOpacity>
        )}

        {/* View Engine Switcher Button (1:1 Web Mirror vs Native Mobile) */}
        {onToggleViewEngine && (
          <TouchableOpacity 
            style={[styles.engineBtn, viewEngine === 'webMirror' ? styles.engineBtnWeb : styles.engineBtnNative]} 
            onPress={onToggleViewEngine}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={viewEngine === 'webMirror' ? "web" : "cellphone"} 
              size={12} 
              color={viewEngine === 'webMirror' ? "#38bdf8" : "#10b981"} 
            />
            <Text style={[styles.engineBtnText, { color: viewEngine === 'webMirror' ? "#38bdf8" : "#10b981" }]}>
              {viewEngine === 'webMirror' ? 'Web Mirror' : 'Native'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Live Protocol Status Pill */}
        <View style={[styles.statusBadge, isConnected ? styles.statusBadgeLive : styles.statusBadgeOffline]}>
          <View style={[styles.pulseDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={[styles.statusText, { color: isConnected ? '#10b981' : '#ef4444' }]}>
            {isConnected ? 'Live' : 'Offline'}
          </Text>
        </View>

        {/* Updated Clock Pill */}
        <View style={styles.clockPill}>
          <MaterialCommunityIcons name="clock-outline" size={10} color="#64748b" />
          <Text style={styles.clockText}>{timeStr}</Text>
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
            <MaterialCommunityIcons name="sync" size={13} color="#94a3b8" />
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
  pillBadge: {
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
  pillBadgeText: {
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
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    gap: 6
  },
  modeSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7
  },
  modeSwitchBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  engineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1
  },
  engineBtnWeb: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)'
  },
  engineBtnNative: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  engineBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
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
    width: 4,
    height: 4,
    borderRadius: 2
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  clockText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  actionBtnText: {
    color: '#38bdf8',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  iconBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
