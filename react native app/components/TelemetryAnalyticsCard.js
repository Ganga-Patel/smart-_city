import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function TelemetryAnalyticsCard({ telemetry, history = [] }) {
  const T = typeof telemetry?.temperature === 'number' ? telemetry.temperature : 26.0;
  const RH = typeof telemetry?.humidity === 'number' ? telemetry.humidity : 47.0;

  // 1. Apparent Heat Index (Rothfusz Regression Equation)
  const heatIndexData = useMemo(() => {
    const TF = T * 1.8 + 32;
    let HIF = 0.5 * (TF + 61.0 + ((TF - 68.0) * 1.2) + (RH * 0.094));
    if (HIF >= 80) {
      HIF = -42.379 + 2.04901523 * TF + 10.14333127 * RH - 0.22475541 * TF * RH
            - 0.00683783 * TF * TF - 0.05481717 * RH * RH
            + 0.00122874 * TF * TF * RH + 0.00085282 * TF * RH * RH
            - 0.00000199 * TF * TF * RH * RH;
    }
    const HIC = (HIF - 32) / 1.8;
    const diff = HIC - T;

    let status = 'Comfortable';
    let statusColor = '#10b981';
    let desc = 'Thermal index within optimal human tolerance.';

    if (HIC >= 38) {
      status = 'Extreme Heat';
      statusColor = '#ef4444';
      desc = 'Elevated heat index. Active cooling recommended.';
    } else if (HIC >= 28) {
      status = 'Caution / Warm';
      statusColor = '#f59e0b';
      desc = 'Mild thermal elevation. Stay hydrated.';
    }

    return {
      value: HIC.toFixed(1),
      delta: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}°C vs Base`,
      status,
      statusColor,
      desc
    };
  }, [T, RH]);

  // 2. Atmospheric Dew Point (Magnus-Tetens Equation)
  const dewPointData = useMemo(() => {
    const a = 17.27, b = 237.7;
    const alpha = ((a * T) / (b + T)) + Math.log(Math.max(1, RH) / 100);
    const dewC = (b * alpha) / (a - alpha);

    let status = 'Optimal Comfort';
    let statusColor = '#10b981';
    let risk = 'Zero Risk';
    let riskColor = '#10b981';

    if (dewC > 18) {
      status = 'High Moisture';
      statusColor = '#f59e0b';
      risk = 'Condensation Watch';
      riskColor = '#f59e0b';
    } else if (dewC < 10) {
      status = 'Crisp & Dry';
      statusColor = '#38bdf8';
    }

    return {
      value: dewC.toFixed(1),
      status,
      statusColor,
      risk,
      riskColor,
      desc: 'Magnus-Tetens condensation threshold.'
    };
  }, [T, RH]);

  // 3. Vapor Pressure Deficit (VPD in kPa)
  const vpdData = useMemo(() => {
    const vpSat = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    const vpActual = vpSat * (RH / 100);
    const vpd = Math.max(0, vpSat - vpActual);

    let status = 'Optimal Balance';
    let statusColor = '#10b981';

    if (vpd < 0.4) {
      status = 'Low Transpiration';
      statusColor = '#6366f1';
    } else if (vpd > 1.25) {
      status = 'Active Evaporative';
      statusColor = '#f59e0b';
    }

    return {
      value: vpd.toFixed(2),
      status,
      statusColor,
      gradient: `${vpd.toFixed(2)} kPa Gradient`,
      desc: 'Atmospheric moisture absorption potential.'
    };
  }, [T, RH]);

  // 4. Rolling Session Stability & Anomaly Flagging
  const stabilityData = useMemo(() => {
    const temps = history.map(h => h.temperature).filter(v => typeof v === 'number');
    let stabilityPct = 99.8;
    let anomalies = 0;

    if (temps.length >= 2) {
      const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
      const variance = temps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / temps.length;
      const stdDev = Math.sqrt(variance);
      stabilityPct = Math.max(88, Math.min(99.9, 100 - (stdDev * 3.5)));

      const lastTwo = temps.slice(-2);
      if (Math.abs(lastTwo[1] - lastTwo[0]) > 2.5) anomalies++;
    }

    if (telemetry?.gasAlert) anomalies++;
    if (telemetry?.rainDetected) anomalies++;

    return {
      value: `${stabilityPct.toFixed(1)}%`,
      status: anomalies > 0 ? 'Event Active' : 'Stable',
      statusColor: anomalies > 0 ? '#ef4444' : '#10b981',
      anomalies: anomalies === 0 ? '0 Critical' : `${anomalies} Triggered`,
      anomaliesColor: anomalies === 0 ? '#10b981' : '#ef4444',
      desc: 'Rolling variance & rapid drift detection.'
    };
  }, [history, telemetry]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="gauge" size={18} color="#38bdf8" />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Sensor Telemetry Analytics</Text>
          <Text style={styles.headerSubtitle}>Continuous mathematical derivation from live readings</Text>
        </View>
        <View style={styles.badgeActive}>
          <View style={styles.dotPulse} />
          <Text style={styles.badgeActiveText}>Active</Text>
        </View>
      </View>

      {/* Grid of 4 Core Mathematical Analysis Insights */}
      <View style={styles.grid}>
        {/* Insight 1: Heat Index */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Heat Index</Text>
            <View style={[styles.miniBadge, { backgroundColor: `${heatIndexData.statusColor}20` }]}>
              <Text style={[styles.miniBadgeText, { color: heatIndexData.statusColor }]}>{heatIndexData.status}</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricVal}>{heatIndexData.value}</Text>
            <Text style={styles.metricUnit}>°C</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{heatIndexData.desc}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Variance</Text>
            <Text style={styles.footerValue}>{heatIndexData.delta}</Text>
          </View>
        </View>

        {/* Insight 2: Dew Point */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Dew Point</Text>
            <View style={[styles.miniBadge, { backgroundColor: `${dewPointData.statusColor}20` }]}>
              <Text style={[styles.miniBadgeText, { color: dewPointData.statusColor }]}>{dewPointData.status}</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricVal}>{dewPointData.value}</Text>
            <Text style={styles.metricUnit}>°C</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{dewPointData.desc}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Condensation</Text>
            <Text style={[styles.footerValue, { color: dewPointData.riskColor }]}>{dewPointData.risk}</Text>
          </View>
        </View>

        {/* Insight 3: Vapor Pressure Deficit */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Vapor Deficit</Text>
            <View style={[styles.miniBadge, { backgroundColor: `${vpdData.statusColor}20` }]}>
              <Text style={[styles.miniBadgeText, { color: vpdData.statusColor }]}>{vpdData.status}</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricVal}>{vpdData.value}</Text>
            <Text style={styles.metricUnit}>kPa</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{vpdData.desc}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Moisture</Text>
            <Text style={styles.footerValue}>{vpdData.gradient}</Text>
          </View>
        </View>

        {/* Insight 4: Telemetry Stability */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Stability</Text>
            <View style={[styles.miniBadge, { backgroundColor: `${stabilityData.statusColor}20` }]}>
              <Text style={[styles.miniBadgeText, { color: stabilityData.statusColor }]}>{stabilityData.status}</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricVal}>{stabilityData.value}</Text>
            <Text style={styles.metricUnit}>rate</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{stabilityData.desc}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Anomalies</Text>
            <Text style={[styles.footerValue, { color: stabilityData.anomaliesColor }]}>{stabilityData.anomalies}</Text>
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
    marginBottom: 14,
    gap: 10
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleWrapper: {
    flex: 1
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5
  },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  badgeActiveText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  insightCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4
  },
  metricVal: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800'
  },
  metricUnit: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600'
  },
  cardDesc: {
    color: '#64748b',
    fontSize: 9,
    lineHeight: 12,
    marginVertical: 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
    marginTop: 4
  },
  footerLabel: {
    color: '#475569',
    fontSize: 9
  },
  footerValue: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700'
  }
});
