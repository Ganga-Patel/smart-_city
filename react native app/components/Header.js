import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function Header({ activeNode, isConnected, onSelectNode, isDemoMode, onToggleDemo }) {
  return (
    <View style={styles.header}>
      {/* Brand & Subtitle */}
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="city-variant" size={22} color={Colors.brand.sky} />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Smart City IoT</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.0</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Mobile Telemetry Command</Text>
        </View>
      </View>

      {/* Right Actions: Connection Badge & Demo Mode */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.demoBtn, isDemoMode && styles.demoBtnActive]} 
          onPress={onToggleDemo}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isDemoMode ? "play-circle" : "play"} 
            size={14} 
            color={isDemoMode ? Colors.status.success : Colors.status.warning} 
          />
          <Text style={[styles.demoText, isDemoMode && { color: Colors.status.success }]}>
            {isDemoMode ? 'Demo' : 'Feed'}
          </Text>
        </TouchableOpacity>

        {/* Cloud Connection Badge */}
        <View style={[styles.connBadge, isConnected ? styles.connLive : styles.connOffline]}>
          <View style={[styles.dot, { backgroundColor: isConnected ? Colors.status.success : Colors.status.danger }]} />
          <Text style={[styles.connText, { color: isConnected ? Colors.status.success : Colors.status.danger }]}>
            {isConnected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700'
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  versionText: {
    color: Colors.brand.sky,
    fontSize: 9,
    fontWeight: '700'
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  demoBtnActive: {
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.successBorder
  },
  demoText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600'
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  connLive: {
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.successBorder
  },
  connOffline: {
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  connText: {
    fontSize: 11,
    fontWeight: '600'
  }
});
