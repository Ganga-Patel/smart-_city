import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import HazardBanner from '../components/HazardBanner';
import EventLogStream from '../components/EventLogStream';

export default function AlertsScreen({ activeAlert, logs, onAcknowledgeAlert, onClearLogs }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Incident Command & Alerts</Text>
        <Text style={styles.subtitle}>Active hazard triggers & real-time security events</Text>
      </View>

      {/* Active Banner */}
      <HazardBanner alert={activeAlert} onAcknowledge={onAcknowledgeAlert} />

      {/* Safety System Status Overview */}
      <View style={styles.statusBox}>
        <View style={styles.statusRow}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: activeAlert ? Colors.status.danger : Colors.status.success }]} />
            <Text style={styles.statusTitle}>
              {activeAlert ? 'Hazard Alarm Active' : 'All City Subsystems Secure'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: activeAlert ? Colors.status.dangerBg : Colors.status.successBg }]}>
            <Text style={[styles.badgeText, { color: activeAlert ? Colors.status.danger : Colors.status.success }]}>
              {activeAlert ? 'ALERTING' : 'SECURE'}
            </Text>
          </View>
        </View>
        <Text style={styles.statusDesc}>
          {activeAlert 
            ? 'Operator acknowledgment required. Continuous surveillance active on Sector 4 Station.'
            : 'No hazardous gas leaks, fire risks, or perimeter intrusions detected.'}
        </Text>
      </View>

      {/* Safety Threshold Rule Checklist */}
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Active Safety Rules</Text>
        <View style={styles.ruleItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.status.success} />
          <Text style={styles.ruleText}>Combustible Gas Leak: Trigger when &gt; 300 PPM</Text>
        </View>
        <View style={styles.ruleItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.status.success} />
          <Text style={styles.ruleText}>High Heat Spike: Trigger when &gt; 38°C</Text>
        </View>
        <View style={styles.ruleItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.status.success} />
          <Text style={styles.ruleText}>PIR Motion: Trigger on perimeter breach</Text>
        </View>
        <View style={styles.ruleItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.status.success} />
          <Text style={styles.ruleText}>Rainfall: Trigger precipitation status on DO low</Text>
        </View>
      </View>

      {/* Full Event Audit Stream */}
      <EventLogStream logs={logs} onClear={onClearLogs} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  content: {
    padding: 16,
    paddingBottom: 30
  },
  header: {
    marginBottom: 8
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2
  },
  statusBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 10
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statusDesc: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16
  },
  rulesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 14,
    gap: 8
  },
  rulesTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  ruleText: {
    color: Colors.text.secondary,
    fontSize: 11
  }
});
