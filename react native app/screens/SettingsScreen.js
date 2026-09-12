import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { NODES, FIREBASE_CONFIG, DEFAULT_THRESHOLDS } from '../constants/Config';

export default function SettingsScreen({ activeNode, onSelectNode, isDemoMode, onToggleDemo, isConnected }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>System Settings & Gateway</Text>
        <Text style={styles.subtitle}>Telemetry nodes, threshold configuration & cloud endpoints</Text>
      </View>

      {/* Active Node Selection */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cpu-64-bit" size={18} color={Colors.brand.sky} />
          <Text style={styles.sectionTitle}>Active Telemetry Node</Text>
        </View>
        <View style={styles.nodesList}>
          {NODES.map((node) => {
            const isSelected = activeNode === node.id;
            return (
              <TouchableOpacity
                key={node.id}
                style={[styles.nodeItem, isSelected && styles.nodeItemSelected]}
                onPress={() => onSelectNode(node.id)}
                activeOpacity={0.7}
              >
                <View style={styles.nodeLeft}>
                  <MaterialCommunityIcons 
                    name={node.hardware.includes('ESP') ? "chip" : "raspberry-pi"} 
                    size={20} 
                    color={isSelected ? Colors.brand.sky : Colors.text.muted} 
                  />
                  <View>
                    <Text style={[styles.nodeName, isSelected && { color: Colors.brand.sky }]}>{node.name}</Text>
                    <Text style={styles.nodeHardware}>{node.hardware} • Path: /{node.path}</Text>
                  </View>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.sky} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Demo Mode Toggle */}
      <View style={styles.sectionCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <MaterialCommunityIcons name="play-box-multiple" size={20} color={Colors.status.warning} />
            <View>
              <Text style={styles.toggleTitle}>Demo Simulation Feed</Text>
              <Text style={styles.toggleSub}>Generate live fluctuating metrics & periodic alerts</Text>
            </View>
          </View>
          <Switch
            value={isDemoMode}
            onValueChange={onToggleDemo}
            trackColor={{ false: Colors.surfaceHighlight, true: Colors.status.successBg }}
            thumbColor={isDemoMode ? Colors.status.success : Colors.text.muted}
          />
        </View>
      </View>

      {/* Cloud & Firebase Diagnostics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cloud-sync" size={18} color={Colors.status.success} />
          <Text style={styles.sectionTitle}>Firebase Realtime Cloud</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database URL</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{FIREBASE_CONFIG.databaseURL}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Project ID</Text>
          <Text style={styles.infoValue}>{FIREBASE_CONFIG.projectId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cloud Status</Text>
          <Text style={[styles.infoValue, { color: isConnected ? Colors.status.success : Colors.status.danger }]}>
            {isConnected ? 'Connected (Live RTDB Stream)' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Alert Thresholds */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tune" size={18} color={Colors.brand.sky} />
          <Text style={styles.sectionTitle}>Safety Threshold Settings</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Max Temperature Spike</Text>
          <Text style={styles.infoValue}>{DEFAULT_THRESHOLDS.temperatureMaxC} °C</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gas Leak Warning Limit</Text>
          <Text style={styles.infoValue}>{DEFAULT_THRESHOLDS.gasPpmWarning} PPM</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gas Critical Alarm Limit</Text>
          <Text style={styles.infoValue}>{DEFAULT_THRESHOLDS.gasPpmCritical} PPM</Text>
        </View>
      </View>

      <Text style={styles.footerNote}>Smart City IoT Mobile Client • React Native & Expo Go</Text>
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
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  nodesList: {
    gap: 8
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  nodeItemSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  nodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  nodeName: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  nodeHardware: {
    color: Colors.text.muted,
    fontSize: 10,
    marginTop: 2
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  toggleTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  toggleSub: {
    color: Colors.text.muted,
    fontSize: 10,
    marginTop: 2
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)'
  },
  infoLabel: {
    color: Colors.text.muted,
    fontSize: 11
  },
  infoValue: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  footerNote: {
    color: Colors.text.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24
  }
});
