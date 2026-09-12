import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function SensorCard({
  title,
  value,
  unit,
  iconName,
  iconColor,
  iconBgColor,
  statusText,
  statusType = 'success',
  progressPercent = 0,
  subInfo,
  onPress
}) {
  const getStatusStyles = () => {
    switch (statusType) {
      case 'danger':
        return {
          bg: Colors.status.dangerBg,
          border: Colors.status.dangerBorder,
          text: Colors.status.danger,
          bar: Colors.status.danger
        };
      case 'warning':
        return {
          bg: Colors.status.warningBg,
          border: Colors.status.warningBorder,
          text: Colors.status.warning,
          bar: Colors.status.warning
        };
      case 'info':
        return {
          bg: Colors.status.infoBg,
          border: Colors.status.infoBorder,
          text: Colors.status.info,
          bar: Colors.status.info
        };
      default:
        return {
          bg: Colors.status.successBg,
          border: Colors.status.successBorder,
          text: Colors.status.success,
          bar: Colors.status.success
        };
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
    >
      {/* Top Row: Icon & Status Badge */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor || `${iconColor}20` }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusText}</Text>
        </View>
      </View>

      {/* Sensor Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Main Metric Value */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value !== null && value !== undefined ? value : '--'}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {/* Progress Bar (Optional) */}
      {progressPercent > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%`, backgroundColor: statusStyle.bar }]} />
        </View>
      )}

      {/* Sub Info Row */}
      {subInfo ? (
        <View style={styles.subInfoContainer}>
          <Text style={styles.subInfoText}>{subInfo}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minHeight: 140,
    justifyContent: 'space-between'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  title: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginVertical: 4
  },
  value: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '800'
  },
  unit: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600'
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },
  subInfoContainer: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  subInfoText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontFamily: 'monospace'
  }
});
