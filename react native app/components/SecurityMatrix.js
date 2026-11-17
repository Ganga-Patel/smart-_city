import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function SecurityMatrix({ pirMotion, irObstacle, reedLocked = true }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#38bdf8" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Perimeter & Station Security</Text>
          <Text style={styles.headerSubtitle}>Real-time boundary monitoring</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusPillText}>Armed</Text>
        </View>
      </View>

      <View style={styles.tilesList}>
        {/* 1. PIR Motion Detector */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, pirMotion ? styles.iconDanger : styles.iconNormal]}>
              <MaterialCommunityIcons 
                name="motion-sensor" 
                size={18} 
                color={pirMotion ? '#ef4444' : '#10b981'} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>PIR Motion Detector</Text>
              <Text style={styles.tileSub}>Infrared Passive Sensing</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, pirMotion ? styles.badgeDanger : styles.badgeNormal]}>
            <Text style={[styles.statusText, pirMotion ? styles.textDanger : styles.textNormal]}>
              {pirMotion ? 'MOTION ACTIVE' : 'Clear'}
            </Text>
          </View>
        </View>

        {/* 2. Optical Proximity Sensor */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, irObstacle ? styles.iconWarning : styles.iconNormal]}>
              <MaterialCommunityIcons 
                name="radar" 
                size={18} 
                color={irObstacle ? '#f59e0b' : '#10b981'} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>Optical Proximity Sensor</Text>
              <Text style={styles.tileSub}>Infrared Beam Guard</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, irObstacle ? styles.badgeWarning : styles.badgeNormal]}>
            <Text style={[styles.statusText, irObstacle ? styles.textWarning : styles.textNormal]}>
              {irObstacle ? 'PROXIMITY TRIGGER' : 'Clear'}
            </Text>
          </View>
        </View>

        {/* 3. Station Enclosure Lock */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, reedLocked ? styles.iconNormal : styles.iconDanger]}>
              <MaterialCommunityIcons 
                name={reedLocked ? 'lock' : 'lock-open-variant'} 
                size={18} 
                color={reedLocked ? '#10b981' : '#ef4444'} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>Station Enclosure Lock</Text>
              <Text style={styles.tileSub}>Magnetic Contact Guard</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, reedLocked ? styles.badgeNormal : styles.badgeDanger]}>
            <Text style={[styles.statusText, reedLocked ? styles.textNormal : styles.textDanger]}>
              {reedLocked ? 'SECURED' : 'UNLOCKED'}
            </Text>
          </View>
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  statusPillText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700'
  },
  tilesList: {
    gap: 8
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  tileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  iconWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)'
  },
  iconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)'
  },
  tileName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  tileSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  badgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)'
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700'
  },
  textNormal: {
    color: '#10b981'
  },
  textWarning: {
    color: '#f59e0b'
  },
  textDanger: {
    color: '#ef4444'
  }
});
