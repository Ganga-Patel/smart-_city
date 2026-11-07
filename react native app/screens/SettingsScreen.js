import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { NODES, FIREBASE_CONFIG, DEFAULT_THRESHOLDS, API_CONFIG } from '../constants/Config';
import { getActiveBaseUrl, setActiveBaseUrl, fetchUnifiedDashboardData } from '../services/api';

export default function SettingsScreen({ 
  activeNode, 
  onSelectNode, 
  isDemoMode, 
  onToggleDemo, 
  isConnected,
  onSyncNow
}) {
  const [customUrl, setCustomUrl] = useState(getActiveBaseUrl());
  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  const handleApplyUrl = async (urlToApply) => {
    const url = (urlToApply || customUrl).trim();
    if (!url) return;
    setActiveBaseUrl(url);
    setCustomUrl(url);
    setTestStatus('testing');
    setTestMessage('Connecting to ' + url + '...');

    try {
      const data = await fetchUnifiedDashboardData(url);
      setTestStatus('success');
      setTestMessage(`Connected! Received telemetry from ${data.location} (Temp: ${data.temperature}°C)`);
      if (onSyncNow) onSyncNow();
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Failed: ${err.message}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>System Settings & Gateway</Text>
        <Text style={styles.subtitle}>Telemetry nodes, WebApp/Vercel endpoints & thresholds</Text>
      </View>

      {/* Backend & Vercel Sync Endpoint */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="server-network" size={18} color={Colors.brand.sky} />
          <Text style={styles.sectionTitle}>WebApp & Vercel Backend Sync</Text>
        </View>

        <Text style={styles.inputHelp}>
          Sync live sensor telemetry, Anand city weather, air quality, and traffic from your running webapp or Vercel deployment:
        </Text>

        <View style={styles.urlInputRow}>
          <TextInput
            style={styles.urlInput}
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder="http://10.10.223.209:3000 or https://your-app.vercel.app"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.applyBtn} 
            onPress={() => handleApplyUrl(customUrl)}
            activeOpacity={0.7}
          >
            <Text style={styles.applyBtnText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          <TouchableOpacity 
            style={styles.presetChip}
            onPress={() => handleApplyUrl(API_CONFIG.lanUrl)}
          >
            <MaterialCommunityIcons name="wifi" size={12} color="#38bdf8" />
            <Text style={styles.presetText}>Local WebApp (LAN)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.presetChip}
            onPress={() => handleApplyUrl(API_CONFIG.localUrl)}
          >
            <MaterialCommunityIcons name="laptop" size={12} color="#a855f7" />
            <Text style={styles.presetText}>Localhost</Text>
          </TouchableOpacity>
        </View>

        {testStatus && (
          <View style={[
            styles.testBanner, 
            testStatus === 'success' ? styles.testSuccess : testStatus === 'error' ? styles.testError : styles.testInfo
          ]}>
            <MaterialCommunityIcons 
              name={testStatus === 'success' ? "check-circle" : testStatus === 'error' ? "alert-circle" : "progress-clock"} 
              size={14} 
              color={testStatus === 'success' ? '#10b981' : testStatus === 'error' ? '#ef4444' : '#38bdf8'} 
            />
            <Text style={styles.testBannerText}>{testMessage}</Text>
          </View>
        )}
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
          <Text style={styles.infoLabel}>Cloud Telemetry Status</Text>
          <Text style={[styles.infoValue, { color: isConnected ? Colors.status.success : Colors.status.danger }]}>
            {isConnected ? 'Connected & Synchronized' : 'Offline / Standby'}
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
    marginBottom: 10
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputHelp: {
    color: Colors.text.muted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8
  },
  urlInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  applyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  presetText: {
    color: Colors.text.secondary,
    fontSize: 11
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1
  },
  testSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  testError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  testInfo: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  testBannerText: {
    color: Colors.text.primary,
    fontSize: 11,
    flex: 1
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
