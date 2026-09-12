import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function HazardBanner({ alert, onAcknowledge }) {
  if (!alert) return null;

  const isCritical = alert.severity === 'critical';
  const bgColor = isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
  const borderColor = isCritical ? Colors.status.danger : Colors.status.warning;
  const iconName = isCritical ? 'alert-octagon' : 'alert-circle';
  const iconColor = isCritical ? Colors.status.danger : Colors.status.warning;

  return (
    <View style={[styles.banner, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}25` }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: iconColor }]}>{alert.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{alert.message}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.ackBtn, { borderColor: `${iconColor}50`, backgroundColor: `${iconColor}20` }]} 
        onPress={() => onAcknowledge(alert.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.ackText, { color: iconColor }]}>Acknowledge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  message: {
    color: Colors.text.primary,
    fontSize: 11,
    marginTop: 2
  },
  ackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  ackText: {
    fontSize: 11,
    fontWeight: '700'
  }
});
