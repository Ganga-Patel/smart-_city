import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function SecurityMatrix({ pirMotion, irObstacle, reedLocked = true }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-alert" size={18} color={Colors.brand.sky} />
        </View>
        <Text style={styles.headerTitle}>Security & Surveillance Matrix</Text>
      </View>

      <View style={styles.tilesList}>
        {/* 1. PIR Motion Detector */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, pirMotion ? styles.iconDanger : styles.iconNormal]}>
              <MaterialCommunityIcons 
                name="motion-sensor" 
                size={18} 
                color={pirMotion ? Colors.status.danger : Colors.status.success} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>PIR Motion Sensor</Text>
              <Text style={styles.tileSub}>HC-SR501 • Pin D2</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, pirMotion ? styles.badgeDanger : styles.badgeNormal]}>
            <Text style={[styles.statusText, pirMotion ? styles.textDanger : styles.textNormal]}>
              {pirMotion ? 'MOTION ACTIVE' : 'Clear'}
            </Text>
          </View>
        </View>

        {/* 2. IR Obstacle Sensor */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, irObstacle ? styles.iconWarning : styles.iconNormal]}>
              <MaterialCommunityIcons 
                name="radar" 
                size={18} 
                color={irObstacle ? Colors.status.warning : Colors.status.success} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>IR Proximity Sensor</Text>
              <Text style={styles.tileSub}>HW-201 • Pin D2</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, irObstacle ? styles.badgeWarning : styles.badgeNormal]}>
            <Text style={[styles.statusText, irObstacle ? styles.textWarning : styles.textNormal]}>
              {irObstacle ? 'OBSTACLE' : 'Clear'}
            </Text>
          </View>
        </View>

        {/* 3. Cabinet Reed Switch */}
        <View style={styles.tile}>
          <View style={styles.tileLeft}>
            <View style={[styles.tileIcon, !reedLocked ? styles.iconDanger : styles.iconNormal]}>
              <MaterialCommunityIcons 
                name={reedLocked ? "lock" : "lock-open-variant"} 
                size={18} 
                color={reedLocked ? Colors.status.success : Colors.status.danger} 
              />
            </View>
            <View>
              <Text style={styles.tileName}>Cabinet Enclosure</Text>
              <Text style={styles.tileSub}>Magnetic Reed Switch</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, !reedLocked ? styles.badgeDanger : styles.badgeNormal]}>
            <Text style={[styles.statusText, !reedLocked ? styles.textDanger : styles.textNormal]}>
              {reedLocked ? 'Locked' : 'OPEN'}
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
    gap: 8,
    marginBottom: 12
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tilesList: {
    gap: 8
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  tileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconNormal: {
    backgroundColor: Colors.status.successBg
  },
  iconWarning: {
    backgroundColor: Colors.status.warningBg
  },
  iconDanger: {
    backgroundColor: Colors.status.dangerBg
  },
  tileName: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600'
  },
  tileSub: {
    color: Colors.text.muted,
    fontSize: 10,
    fontFamily: 'monospace'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  badgeNormal: {
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.successBorder
  },
  badgeWarning: {
    backgroundColor: Colors.status.warningBg,
    borderColor: Colors.status.warningBorder
  },
  badgeDanger: {
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  textNormal: {
    color: Colors.status.success
  },
  textWarning: {
    color: Colors.status.warning
  },
  textDanger: {
    color: Colors.status.danger
  }
});
