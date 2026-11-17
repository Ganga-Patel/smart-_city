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
  minVal,
  maxVal,
  onPress
}) {
  const getStatusStyles = () => {
    switch (statusType) {
      case 'danger':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          text: '#ef4444',
          bar: '#ef4444'
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          text: '#f59e0b',
          bar: '#f59e0b'
        };
      case 'info':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.35)',
          text: '#06b6d4',
          bar: '#06b6d4'
        };
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          text: '#10b981',
          bar: '#10b981'
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
          <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusText}</Text>
        </View>
      </View>

      {/* Sensor Title & Subtitle */}
      <Text style={styles.title}>{title}</Text>
      {subInfo ? <Text style={styles.subInfoText} numberOfLines={1}>{subInfo}</Text> : null}

      {/* Main Metric Value */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value !== null && value !== undefined ? value : '--'}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {/* Range Progress Bar */}
      {progressPercent > 0 && (
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(100, Math.max(5, progressPercent))}%`, 
                backgroundColor: statusStyle.bar 
              }
            ]} 
          />
        </View>
      )}

      {/* Session Min / Max Footer */}
      {(minVal !== undefined && maxVal !== undefined) && (
        <View style={styles.minMaxRow}>
          <Text style={styles.minMaxText}>Min: <Text style={styles.minMaxVal}>{minVal}</Text></Text>
          <Text style={styles.minMaxText}>Max: <Text style={styles.minMaxVal}>{maxVal}</Text></Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'space-between'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700'
  },
  title: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  subInfoText: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginVertical: 4
  },
  value: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800'
  },
  unit: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#070b14',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 4,
    marginTop: 4
  },
  minMaxText: {
    color: '#64748b',
    fontSize: 9
  },
  minMaxVal: {
    color: '#cbd5e1',
    fontWeight: '700'
  }
});
