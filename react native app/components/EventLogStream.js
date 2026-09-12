import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function EventLogStream({ logs = [], onClear }) {
  const getTagColor = (tag) => {
    switch (tag) {
      case 'ALERT':
      case 'SEC':
        return Colors.status.danger;
      case 'WARN':
        return Colors.status.warning;
      case 'NET':
        return Colors.brand.sky;
      default:
        return Colors.status.success;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="console" size={18} color={Colors.status.success} />
          <Text style={styles.headerTitle}>Real-time Event Audit Log</Text>
        </View>
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsList}>
        {logs.length > 0 ? (
          logs.slice(0, 8).map((log, idx) => (
            <View key={idx} style={styles.logItem}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={[styles.logTag, { color: getTagColor(log.tag) }]}>[{log.tag}]</Text>
              <Text style={styles.logMsg} numberOfLines={1}>{log.message}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent security or telemetry events.</Text>
        )}
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
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  clearBtn: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600'
  },
  logsList: {
    gap: 6
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)'
  },
  logTime: {
    color: Colors.text.muted,
    fontSize: 10,
    fontFamily: 'monospace'
  },
  logTag: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  logMsg: {
    color: Colors.text.secondary,
    fontSize: 11,
    flex: 1
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 10
  }
});
