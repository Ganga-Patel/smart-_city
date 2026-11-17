import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TwelveHourAnalysisGraph from '../components/TwelveHourAnalysisGraph';

export default function DashboardScreen({
  telemetry,
  history = [],
  onRefresh,
  isRefreshing,
  isFahrenheit = false,
  onToggleUnit
}) {
  const [internalFahrenheit, setInternalFahrenheit] = useState(isFahrenheit);

  const toggleUnit = () => {
    if (onToggleUnit) {
      onToggleUnit();
    } else {
      setInternalFahrenheit(prev => !prev);
    }
  };

  const useFahrenheit = onToggleUnit ? isFahrenheit : internalFahrenheit;

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const cutoff = Date.now() - TWELVE_HOURS_MS;

  // Filter actual readings recorded strictly within the 12-hour window
  const twelveHourHistory = useMemo(() => {
    return history.filter(h => h && (h.timestamp || 0) >= cutoff);
  }, [history]);

  const currentTemp = telemetry?.temperature ?? 26.0;
  const currentHum = telemetry?.humidity ?? 47.0;
  const isRaining = Boolean(telemetry?.rainDetected);
  const isGasAlert = Boolean(telemetry?.gasAlert);

  const displayTemp = useFahrenheit ? (currentTemp * 1.8 + 32) : currentTemp;
  const tempUnit = useFahrenheit ? '°F' : '°C';

  // Status determinations matching webapp
  const getTempStatus = (temp) => {
    if (temp > 36) return { text: 'High Heat Alert', bg: 'rgba(244, 63, 94, 0.15)', textCol: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
    if (temp < 15) return { text: 'Cool', bg: 'rgba(56, 189, 248, 0.15)', textCol: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    return { text: 'Optimal', bg: 'rgba(16, 185, 129, 0.15)', textCol: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const getHumidityStatus = (hum) => {
    if (hum < 35) return { text: 'Dry Air', bg: 'rgba(245, 158, 11, 0.15)', textCol: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    if (hum > 70) return { text: 'High Moisture', bg: 'rgba(99, 102, 241, 0.15)', textCol: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    return { text: 'Comfortable', bg: 'rgba(16, 185, 129, 0.15)', textCol: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const tempStatus = getTempStatus(currentTemp);
  const humStatus = getHumidityStatus(currentHum);

  // Heat Index (Rothfusz Regression Equation)
  const heatIndexData = useMemo(() => {
    const TF = currentTemp * 1.8 + 32;
    let HIF = 0.5 * (TF + 61.0 + ((TF - 68.0) * 1.2) + (currentHum * 0.094));
    if (HIF >= 80) {
      HIF = -42.379 + 2.04901523 * TF + 10.14333127 * currentHum - 0.22475541 * TF * currentHum
            - 0.00683783 * TF * TF - 0.05481717 * currentHum * currentHum
            + 0.00122874 * TF * TF * currentHum + 0.00085282 * TF * currentHum * currentHum
            - 0.00000199 * TF * TF * currentHum * currentHum;
    }
    const HIC = (HIF - 32) / 1.8;
    const diff = HIC - currentTemp;

    let badgeText = 'Comfortable';
    let badgeColor = '#10b981';

    if (HIC >= 38) {
      badgeText = 'Extreme Heat';
      badgeColor = '#ef4444';
    } else if (HIC >= 28) {
      badgeText = 'Caution / Warm';
      badgeColor = '#f59e0b';
    }

    const dispHI = useFahrenheit ? (HIC * 1.8 + 32) : HIC;

    return {
      value: dispHI.toFixed(1),
      delta: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}°C vs Base`,
      badgeText,
      badgeColor
    };
  }, [currentTemp, currentHum, useFahrenheit]);

  // 12-Hour Statistical Aggregations (Min, Max, Average)
  const stats12h = useMemo(() => {
    const temps = twelveHourHistory.map(h => h.temperature).filter(t => typeof t === 'number');
    const hums = twelveHourHistory.map(h => h.humidity).filter(h => typeof h === 'number');

    const minT = temps.length > 0 ? Math.min(...temps) : currentTemp;
    const maxT = temps.length > 0 ? Math.max(...temps) : currentTemp;
    const avgT = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length) : currentTemp;

    const minH = hums.length > 0 ? Math.min(...hums) : currentHum;
    const maxH = hums.length > 0 ? Math.max(...hums) : currentHum;
    const avgH = hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length) : currentHum;

    const gasAlerts = twelveHourHistory.filter(h => h.isGasAlert || h.gasAlert).length;
    const rainEvents = twelveHourHistory.filter(h => h.isRaining || h.rainDetected).length;

    const toDispT = (v) => useFahrenheit ? `${(v * 1.8 + 32).toFixed(1)}°F` : `${v.toFixed(1)}°C`;

    return {
      temp: { min: toDispT(minT), max: toDispT(maxT), avg: toDispT(avgT) },
      humidity: { min: `${Math.round(minH)}%`, max: `${Math.round(maxH)}%`, avg: `${Math.round(avgH)}%` },
      gas: { state: gasAlerts === 0 ? '100% Safe' : `${gasAlerts} Alerts`, count: `${gasAlerts} Breaches` },
      rain: { events: `${rainEvents} Events`, condition: isRaining ? 'Active Rain' : 'Dry Ground' }
    };
  }, [twelveHourHistory, currentTemp, currentHum, isRaining, useFahrenheit]);

  const lastUpdatedTime = telemetry?.timestamp 
    ? new Date(telemetry.timestamp).toLocaleTimeString('en-GB')
    : new Date().toLocaleTimeString('en-GB');

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= SECTION 1: LIVE ENVIRONMENTAL SENSORS ================= */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <MaterialCommunityIcons name="pulse" size={16} color="#38bdf8" />
          <Text style={styles.sectionTitle}>Live Environmental Sensors</Text>
        </View>
        <View style={styles.sectionControlsGroup}>
          <Text style={styles.probesBadge}>Active Probes: 4</Text>
          <TouchableOpacity 
            style={styles.unitBtn} 
            onPress={toggleUnit}
            activeOpacity={0.7}
          >
            <Text style={styles.unitBtnText}>{tempUnit}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4 Main Sensor Cards in 2x2 Grid */}
      <View style={styles.cardsGrid}>
        
        {/* CARD 1: TEMPERATURE */}
        <View style={styles.sensorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                <MaterialCommunityIcons name="thermometer" size={18} color="#f43f5e" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Temperature</Text>
                <Text style={styles.cardSub}>Ambient Thermal Sensor</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: tempStatus.bg, borderColor: tempStatus.border }]}>
              <Text style={[styles.statusBadgeText, { color: tempStatus.textCol }]}>{tempStatus.text}</Text>
            </View>
          </View>

          {/* Value Row */}
          <View style={styles.valueRow}>
            <Text style={styles.bigValue}>{displayTemp.toFixed(1)}</Text>
            <Text style={styles.bigUnit}>{tempUnit}</Text>
          </View>

          {/* Range Scale */}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabelText}>{useFahrenheit ? '32°F' : '0°C'}</Text>
              <Text style={styles.scaleLabelMid}>Comfort: {useFahrenheit ? '68–86°F' : '20–30°C'}</Text>
              <Text style={styles.scaleLabelText}>{useFahrenheit ? '122°F' : '50°C'}</Text>
            </View>
            <View style={styles.scaleBarTrack}>
              <View 
                style={[
                  styles.scaleBarFill, 
                  { 
                    width: `${Math.min(100, Math.max(10, (currentTemp / 50) * 100))}%`,
                    backgroundColor: '#f43f5e'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterStatus}>Status: <Text style={styles.cardFooterGreen}>Operational</Text></Text>
            <Text style={styles.cardFooterSub}>Live Sync</Text>
          </View>
        </View>

        {/* CARD 2: HUMIDITY */}
        <View style={styles.sensorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <MaterialCommunityIcons name="water-percent" size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Humidity</Text>
                <Text style={styles.cardSub}>Relative Moisture Sensor</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: humStatus.bg, borderColor: humStatus.border }]}>
              <Text style={[styles.statusBadgeText, { color: humStatus.textCol }]}>{humStatus.text}</Text>
            </View>
          </View>

          {/* Value Row */}
          <View style={styles.valueRow}>
            <Text style={styles.bigValue}>{Math.round(currentHum)}</Text>
            <Text style={styles.bigUnit}>%</Text>
          </View>

          {/* Range Scale */}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabelText}>0% (Dry)</Text>
              <Text style={styles.scaleLabelMid}>Target: 40–60%</Text>
              <Text style={styles.scaleLabelText}>100% (Sat.)</Text>
            </View>
            <View style={styles.scaleBarTrack}>
              <View 
                style={[
                  styles.scaleBarFill, 
                  { 
                    width: `${Math.min(100, Math.max(10, currentHum))}%`,
                    backgroundColor: '#38bdf8'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterStatus}>Status: <Text style={styles.cardFooterGreen}>Operational</Text></Text>
            <Text style={styles.cardFooterSub}>Live Sync</Text>
          </View>
        </View>

        {/* CARD 3: GAS & AIR SAFETY */}
        <View style={styles.sensorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <MaterialCommunityIcons 
                  name={isGasAlert ? "alert-circle" : "shield-check"} 
                  size={18} 
                  color={isGasAlert ? "#ef4444" : "#10b981"} 
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>Gas &amp; Air Safety</Text>
                <Text style={styles.cardSub}>Combustible &amp; Smoke Sensor</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              borderColor: isGasAlert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'
            }]}>
              <Text style={[styles.statusBadgeText, { color: isGasAlert ? '#ef4444' : '#10b981' }]}>
                {isGasAlert ? 'Gas Alert!' : 'Air Safe'}
              </Text>
            </View>
          </View>

          {/* Value Display */}
          <View style={styles.titleValueBlock}>
            <Text style={styles.statusMainTitle}>{isGasAlert ? 'Hazardous Gas Detected' : 'Nominal / Clean Air'}</Text>
            <Text style={styles.statusMainSub}>{isGasAlert ? 'Threshold breached on sensor' : 'Gases well below threshold limits'}</Text>
          </View>

          {/* Range Scale */}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabelText}>Safe</Text>
              <Text style={styles.scaleLabelMid}>Normal Ambient</Text>
              <Text style={styles.scaleLabelText}>Hazard</Text>
            </View>
            <View style={styles.scaleBarTrack}>
              <View 
                style={[
                  styles.scaleBarFill, 
                  { 
                    width: isGasAlert ? '100%' : '15%',
                    backgroundColor: isGasAlert ? '#ef4444' : '#10b981'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterStatus}>Status: <Text style={styles.cardFooterGreen}>Operational</Text></Text>
            <Text style={styles.cardFooterSub}>{isGasAlert ? 'Alert Triggered' : 'Air Nominal'}</Text>
          </View>
        </View>

        {/* CARD 4: RAIN / PRECIPITATION */}
        <View style={styles.sensorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isRaining ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.15)' }]}>
                <MaterialCommunityIcons 
                  name={isRaining ? "weather-rainy" : "weather-sunny"} 
                  size={18} 
                  color={isRaining ? "#06b6d4" : "#f59e0b"} 
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>Rain / Moisture</Text>
                <Text style={styles.cardSub}>Surface Precipitation Sensor</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: isRaining ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              borderColor: isRaining ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.3)'
            }]}>
              <Text style={[styles.statusBadgeText, { color: isRaining ? '#06b6d4' : '#10b981' }]}>
                {isRaining ? 'Precip Alert' : 'Dry Surface'}
              </Text>
            </View>
          </View>

          {/* Value Display */}
          <View style={styles.titleValueBlock}>
            <Text style={styles.statusMainTitle}>{isRaining ? 'Precipitation Active' : 'Clear & Dry'}</Text>
            <Text style={styles.statusMainSub}>{isRaining ? 'Moisture detected on physical surface' : 'Zero precipitation detected on plate'}</Text>
          </View>

          {/* Range Scale */}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabelText}>Dry Ground</Text>
              <Text style={styles.scaleLabelMid}>Precipitation Detector</Text>
              <Text style={styles.scaleLabelText}>Active Rain</Text>
            </View>
            <View style={styles.scaleBarTrack}>
              <View 
                style={[
                  styles.scaleBarFill, 
                  { 
                    width: isRaining ? '100%' : '5%',
                    backgroundColor: isRaining ? '#06b6d4' : '#10b981'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterStatus}>Status: <Text style={styles.cardFooterGreen}>Operational</Text></Text>
            <Text style={styles.cardFooterSub}>{isRaining ? 'Precip Active' : 'Surface Dry'}</Text>
          </View>
        </View>

      </View>

      {/* ================= IMPORTANT READING: HEAT INDEX ================= */}
      <View style={styles.heatIndexCard}>
        <View style={styles.heatLeft}>
          <View style={styles.heatIconBox}>
            <MaterialCommunityIcons name="fire" size={22} color="#38bdf8" />
          </View>
          <View style={styles.heatTitleGroup}>
            <View style={styles.heatTitleRow}>
              <Text style={styles.heatTitle}>Heat Index (Apparent RealFeel)</Text>
              <View style={[styles.heatBadge, { backgroundColor: `${heatIndexData.badgeColor}20`, borderColor: `${heatIndexData.badgeColor}40` }]}>
                <Text style={[styles.heatBadgeText, { color: heatIndexData.badgeColor }]}>
                  {heatIndexData.badgeText}
                </Text>
              </View>
            </View>
            <Text style={styles.heatDesc}>
              Mathematical RealFeel derived from ambient temperature and relative humidity via Rothfusz regression.
            </Text>
          </View>
        </View>

        <View style={styles.heatRight}>
          <Text style={styles.heatSubHead}>CALCULATED REALFEEL</Text>
          <View style={styles.heatValRow}>
            <Text style={styles.heatVal}>{heatIndexData.value}</Text>
            <Text style={styles.heatUnit}>{tempUnit}</Text>
          </View>
          <Text style={styles.heatDelta}>Variance: {heatIndexData.delta}</Text>
          <Text style={styles.heatTolerance}>Human Tolerance: Safe</Text>
        </View>
      </View>

      {/* ================= SECTION 2: 12-HOUR ANALYSIS & TELEMETRY GRAPHS ================= */}
      <View style={styles.analysisSectionCard}>
        
        {/* Section Header */}
        <View style={styles.analysisHeaderRow}>
          <View style={styles.analysisHeaderLeft}>
            <View style={styles.calendarIconBox}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.analysisTitle}>12-Hour Telemetry Analysis</Text>
              <Text style={styles.analysisDesc}>
                Statistical minimum, maximum, average &amp; trends computed strictly from actual sensor readings
              </Text>
            </View>
          </View>

          <View style={styles.analysisHeaderRight}>
            <Text style={styles.windowLabel}>Window: <Text style={styles.windowValue}>Last 12 Hours</Text></Text>
            <Text style={styles.actualPointsBadge}>{twelveHourHistory.length} Actual Points</Text>
          </View>
        </View>

        {/* 12-Hour Statistics (Min, Max, Average) Cards (4 in 2x2 grid) */}
        <View style={styles.statsGrid}>
          
          {/* 1. Temperature Stats */}
          <View style={styles.statBox}>
            <View style={styles.statBoxTitleRow}>
              <MaterialCommunityIcons name="thermometer" size={13} color="#f43f5e" />
              <Text style={[styles.statBoxTitle, { color: '#f43f5e' }]}>Temperature (12h)</Text>
            </View>
            <View style={styles.statRowsContainer}>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Min:</Text><Text style={styles.statRowVal}>{stats12h.temp.min}</Text></View>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Max:</Text><Text style={styles.statRowVal}>{stats12h.temp.max}</Text></View>
              <View style={[styles.statRow, styles.statRowHighlight]}>
                <Text style={styles.statRowLblBold}>Average:</Text>
                <Text style={[styles.statRowValBold, { color: '#f43f5e' }]}>{stats12h.temp.avg}</Text>
              </View>
            </View>
          </View>

          {/* 2. Humidity Stats */}
          <View style={styles.statBox}>
            <View style={styles.statBoxTitleRow}>
              <MaterialCommunityIcons name="water-percent" size={13} color="#38bdf8" />
              <Text style={[styles.statBoxTitle, { color: '#38bdf8' }]}>Humidity (12h)</Text>
            </View>
            <View style={styles.statRowsContainer}>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Min:</Text><Text style={styles.statRowVal}>{stats12h.humidity.min}</Text></View>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Max:</Text><Text style={styles.statRowVal}>{stats12h.humidity.max}</Text></View>
              <View style={[styles.statRow, styles.statRowHighlight]}>
                <Text style={styles.statRowLblBold}>Average:</Text>
                <Text style={[styles.statRowValBold, { color: '#38bdf8' }]}>{stats12h.humidity.avg}</Text>
              </View>
            </View>
          </View>

          {/* 3. Gas Safety Stats */}
          <View style={styles.statBox}>
            <View style={styles.statBoxTitleRow}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#10b981" />
              <Text style={[styles.statBoxTitle, { color: '#10b981' }]}>Gas Safety (12h)</Text>
            </View>
            <View style={styles.statRowsContainer}>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>State:</Text><Text style={[styles.statRowVal, { color: '#10b981' }]}>{stats12h.gas.state}</Text></View>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Alerts:</Text><Text style={styles.statRowVal}>{stats12h.gas.count}</Text></View>
              <View style={[styles.statRow, styles.statRowHighlight]}>
                <Text style={styles.statRowLblBold}>Air Quality:</Text>
                <Text style={[styles.statRowValBold, { color: '#10b981' }]}>Nominal</Text>
              </View>
            </View>
          </View>

          {/* 4. Rain Stats */}
          <View style={styles.statBox}>
            <View style={styles.statBoxTitleRow}>
              <MaterialCommunityIcons name="weather-rainy" size={13} color="#f59e0b" />
              <Text style={[styles.statBoxTitle, { color: '#f59e0b' }]}>Precipitation (12h)</Text>
            </View>
            <View style={styles.statRowsContainer}>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Events:</Text><Text style={styles.statRowVal}>{stats12h.rain.events}</Text></View>
              <View style={styles.statRow}><Text style={styles.statRowLbl}>Condition:</Text><Text style={[styles.statRowVal, { color: '#10b981' }]}>{stats12h.rain.condition}</Text></View>
              <View style={[styles.statRow, styles.statRowHighlight]}>
                <Text style={styles.statRowLblBold}>Precip Risk:</Text>
                <Text style={[styles.statRowValBold, { color: '#10b981' }]}>Clear</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Clean 12-Hour Telemetry Graph Component */}
        <TwelveHourAnalysisGraph 
          history={twelveHourHistory} 
          isFahrenheit={useFahrenheit} 
        />
      </View>

      {/* ================= FOOTER ================= */}
      <View style={styles.footer}>
        <View style={styles.footerStationRow}>
          <View style={styles.footerDot} />
          <Text style={styles.footerStationText}>Station: Sector 4 Node (Anand)</Text>
          <Text style={styles.footerSep}>|</Text>
          <Text style={styles.footerProbes}>Probes: Temperature • Humidity • Gas • Rain</Text>
        </View>
        <Text style={styles.footerCopy}>
          Smart City IoT Minimal Sensor Dashboard &copy; 2026 • Production Ready
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  content: {
    paddingBottom: 35
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  sectionControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  probesBadge: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  unitBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6
  },
  unitBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  cardsGrid: {
    paddingHorizontal: 16,
    gap: 12
  },
  sensorCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 8
  },
  bigValue: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  bigUnit: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  titleValueBlock: {
    marginVertical: 8
  },
  statusMainTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  statusMainSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  scaleContainer: {
    marginVertical: 4
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  scaleLabelText: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  },
  scaleLabelMid: {
    color: '#94a3b8',
    fontSize: 9,
    fontFamily: 'monospace'
  },
  scaleBarTrack: {
    height: 5,
    backgroundColor: '#030712',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden'
  },
  scaleBarFill: {
    height: '100%',
    borderRadius: 3
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)'
  },
  cardFooterStatus: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  cardFooterGreen: {
    color: '#10b981',
    fontWeight: '700'
  },
  cardFooterSub: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  heatIndexCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 12
  },
  heatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  heatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heatTitleGroup: {
    flex: 1
  },
  heatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  heatTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  heatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1
  },
  heatBadgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  heatDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2
  },
  heatRight: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    alignItems: 'flex-start'
  },
  heatSubHead: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  heatValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginVertical: 2
  },
  heatVal: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  heatUnit: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  heatDelta: {
    color: '#e2e8f0',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  heatTolerance: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 1
  },
  analysisSectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  analysisHeaderRow: {
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)'
  },
  analysisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  analysisTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  analysisDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  analysisHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4
  },
  windowLabel: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  windowValue: {
    color: '#cbd5e1',
    fontWeight: '700'
  },
  actualPointsBadge: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    gap: 4
  },
  statBoxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2
  },
  statBoxTitle: {
    fontSize: 10,
    fontWeight: '800'
  },
  statRowsContainer: {
    gap: 2
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statRowHighlight: {
    paddingTop: 3,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)'
  },
  statRowLbl: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  },
  statRowVal: {
    color: '#f8fafc',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  statRowLblBold: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  statRowValBold: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800'
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    gap: 4
  },
  footerStationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap'
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  footerStationText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  footerSep: {
    color: '#475569',
    fontSize: 10
  },
  footerProbes: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  },
  footerCopy: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  }
});
