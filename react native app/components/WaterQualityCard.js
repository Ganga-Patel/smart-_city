import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function WaterQualityCard({ water }) {
  const ph = water?.ph ?? 7.2;
  const tds = water?.tds ?? 140;
  const turbidity = water?.turbidity ?? 0.8;
  const dissolvedOxygen = water?.do ?? 8.1;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="waves" size={18} color={Colors.brand.sky} />
        </View>
        <Text style={styles.headerTitle}>Water Quality Hub</Text>
        <View style={styles.portBadge}>
          <Text style={styles.portText}>ADS1115 ADC</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {/* pH */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>pH Level</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{ph}</Text>
            <Text style={styles.itemTag}>Optimal</Text>
          </View>
        </View>

        {/* TDS */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>TDS (Purity)</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{tds}</Text>
            <Text style={styles.itemUnit}>ppm</Text>
          </View>
        </View>

        {/* Turbidity */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Turbidity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{turbidity}</Text>
            <Text style={styles.itemUnit}>NTU</Text>
          </View>
        </View>

        {/* Dissolved Oxygen */}
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Dissolved O₂</Text>
          <View style={styles.valueRow}>
            <Text style={styles.itemValue}>{dissolvedOxygen}</Text>
            <Text style={styles.itemUnit}>mg/L</Text>
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
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1
  },
  portBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  portText: {
    color: Colors.text.muted,
    fontSize: 9,
    fontFamily: 'monospace'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  itemLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4
  },
  itemValue: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  itemUnit: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500'
  },
  itemTag: {
    color: Colors.status.success,
    fontSize: 10,
    fontWeight: '600'
  }
});
