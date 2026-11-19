import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WeatherCard from '../components/WeatherCard';
import AirQualityCard from '../components/AirQualityCard';
import TrafficCard from '../components/TrafficCard';
import UrbanLiveMap from '../components/UrbanLiveMap';
import TwelveHourAnalysisGraph from '../components/TwelveHourAnalysisGraph';
import { DarkTheme } from '../constants/Colors';

export default function DashboardScreen({
  telemetry,
  history = [],
  onRefresh,
  isRefreshing,
  isFahrenheit = false,
  onToggleUnit,
  activeMode = 'sensor',
  theme = DarkTheme,
  isDark = true
}) {
  const safeFormatTime = (ts) => {
    try {
      if (!ts) return new Date().toLocaleTimeString('en-GB');
      const d = new Date(ts);
      if (isNaN(d.getTime())) return new Date().toLocaleTimeString('en-GB');
      return d.toLocaleTimeString('en-GB');
    } catch (e) {
      return '--:--:--';
    }
  };

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

  const displayTemp = isFahrenheit ? (currentTemp * 1.8 + 32) : currentTemp;
  const tempUnit = isFahrenheit ? '°F' : '°C';

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

    const dispHI = isFahrenheit ? (HIC * 1.8 + 32) : HIC;

    return {
      value: dispHI.toFixed(1),
      delta: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}°C vs Base`,
      badgeText,
      badgeColor
    };
  }, [currentTemp, currentHum, isFahrenheit]);

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

    const gasAlertCount = twelveHourHistory.filter(h => h.isGasAlert).length;
    const rainCount = twelveHourHistory.filter(h => h.isRaining).length;

    const dispMinT = isFahrenheit ? (minT * 1.8 + 32) : minT;
    const dispMaxT = isFahrenheit ? (maxT * 1.8 + 32) : maxT;
    const dispAvgT = isFahrenheit ? (avgT * 1.8 + 32) : avgT;

    return {
      temp: {
        min: dispMinT.toFixed(1),
        max: dispMaxT.toFixed(1),
        avg: dispAvgT.toFixed(1)
      },
      hum: {
        min: minH.toFixed(0),
        max: maxH.toFixed(0),
        avg: avgH.toFixed(0)
      },
      gas: {
        alertHours: (gasAlertCount * 0.25).toFixed(1),
        status: gasAlertCount > 0 ? 'Alert Events' : 'Normal / Safe'
      },
      rain: {
        activeHours: (rainCount * 0.25).toFixed(1),
        status: rainCount > 0 ? 'Rain Observed' : 'Dry Period'
      }
    };
  }, [twelveHourHistory, currentTemp, currentHum, isFahrenheit]);

  const lastUpdatedTime = safeFormatTime(telemetry?.timestamp);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.brand.sky} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================================================= */}
      {/* PAGE 1: CITY DASHBOARD (WEATHER, AIR QUALITY, TRAFFIC, URBAN MAP)         */}
      {/* ========================================================================= */}
      {activeMode === 'city' && (
        <View style={styles.citySection}>
          {/* Status Subtitle Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusLeft}>
              <View style={[styles.livePulseDot, { backgroundColor: theme.status.success }]} />
              <Text style={[styles.statusSubtitle, { color: theme.text.primary }]}>
                Real-Time City Weather & Mobility
              </Text>
            </View>
            <Text style={[styles.syncClock, { color: theme.text.muted }]}>
              Updated: {lastUpdatedTime}
            </Text>
          </View>

          {/* BOX 1: REAL-TIME WEATHER INTELLIGENCE */}
          <WeatherCard 
            cityWeather={telemetry?.cityWeather} 
            weather={telemetry?.weather} 
            theme={theme}
            isDark={isDark}
          />

          {/* BOX 2: URBAN AIR QUALITY & ATMOSPHERIC INDEX */}
          <AirQualityCard 
            airQuality={telemetry?.airQuality} 
            theme={theme}
            isDark={isDark}
          />

          {/* BOX 3: URBAN MOBILITY & LIVE TRAFFIC */}
          <TrafficCard 
            traffic={telemetry?.traffic} 
            theme={theme}
            isDark={isDark}
          />

          {/* BOX 4: URBAN LIVE MAP (SPATIAL VECTOR & TRAFFIC CORRIDORS CANVAS) */}
          <UrbanLiveMap 
            location={telemetry?.location || 'Anand, Gujarat, India'}
            traffic={telemetry?.traffic}
            telemetry={telemetry}
            theme={theme}
            isDark={isDark}
          />
        </View>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: SENSOR DASHBOARD (4 PROBES, HEAT INDEX, 12H GRAPH)                */}
      {/* ========================================================================= */}
      {activeMode === 'sensor' && (
        <View style={styles.sensorSection}>
          {/* Section 1 Header */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <MaterialCommunityIcons name="pulse" size={16} color={theme.brand.sky} />
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                Live Environmental Sensors
              </Text>
            </View>
            <View style={styles.sectionControlsGroup}>
              <View style={[styles.probesBadge, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
                <Text style={[styles.probesBadgeText, { color: theme.text.secondary }]}>
                  Active Probes: 4
                </Text>
              </View>
              {onToggleUnit && (
                <TouchableOpacity 
                  style={[styles.unitBtn, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)', borderColor: theme.surfaceBorder }]} 
                  onPress={onToggleUnit}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, { color: theme.brand.sky }]}>{tempUnit}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 4 Main Sensor Cards */}
          <View style={styles.cardsGrid}>
            
            {/* CARD 1: TEMPERATURE */}
            <View style={[styles.sensorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <MaterialCommunityIcons name="thermometer" size={18} color="#f43f5e" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Temperature</Text>
                    <Text style={[styles.cardSub, { color: theme.text.muted }]}>Ambient Thermal Sensor</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tempStatus.bg, borderColor: tempStatus.border }]}>
                  <Text style={[styles.statusBadgeText, { color: tempStatus.textCol }]}>{tempStatus.text}</Text>
                </View>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.bigValue, { color: theme.text.primary }]}>{displayTemp.toFixed(1)}</Text>
                <Text style={[styles.bigUnit, { color: theme.text.secondary }]}>{tempUnit}</Text>
              </View>

              <View style={styles.scaleContainer}>
                <View style={styles.scaleLabels}>
                  <Text style={[styles.scaleLabelText, { color: theme.text.muted }]}>{isFahrenheit ? '32°F' : '0°C'}</Text>
                  <Text style={[styles.scaleLabelMid, { color: theme.text.secondary }]}>Comfort: {isFahrenheit ? '68–86°F' : '20–30°C'}</Text>
                  <Text style={[styles.scaleLabelText, { color: theme.text.muted }]}>{isFahrenheit ? '122°F' : '50°C'}</Text>
                </View>
                <View style={[styles.scaleBarTrack, { backgroundColor: theme.trackBg }]}>
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

              <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorder }]}>
                <Text style={[styles.cardFooterStatus, { color: theme.text.secondary }]}>
                  Status: <Text style={styles.cardFooterGreen}>Operational</Text>
                </Text>
                <Text style={[styles.cardFooterSub, { color: theme.text.muted }]}>Live Sync</Text>
              </View>
            </View>

            {/* CARD 2: HUMIDITY */}
            <View style={[styles.sensorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <MaterialCommunityIcons name="water-percent" size={18} color="#38bdf8" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Humidity</Text>
                    <Text style={[styles.cardSub, { color: theme.text.muted }]}>Relative Moisture</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: humStatus.bg, borderColor: humStatus.border }]}>
                  <Text style={[styles.statusBadgeText, { color: humStatus.textCol }]}>{humStatus.text}</Text>
                </View>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.bigValue, { color: theme.text.primary }]}>{currentHum.toFixed(1)}</Text>
                <Text style={[styles.bigUnit, { color: theme.text.secondary }]}>% RH</Text>
              </View>

              <View style={styles.scaleContainer}>
                <View style={styles.scaleLabels}>
                  <Text style={[styles.scaleLabelText, { color: theme.text.muted }]}>0%</Text>
                  <Text style={[styles.scaleLabelMid, { color: theme.text.secondary }]}>Ideal: 35–65%</Text>
                  <Text style={[styles.scaleLabelText, { color: theme.text.muted }]}>100%</Text>
                </View>
                <View style={[styles.scaleBarTrack, { backgroundColor: theme.trackBg }]}>
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

              <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorder }]}>
                <Text style={[styles.cardFooterStatus, { color: theme.text.secondary }]}>
                  Status: <Text style={styles.cardFooterGreen}>Operational</Text>
                </Text>
                <Text style={[styles.cardFooterSub, { color: theme.text.muted }]}>Live Sync</Text>
              </View>
            </View>

            {/* CARD 3: GAS SENSOR */}
            <View style={[styles.sensorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                    <MaterialCommunityIcons name="molecule" size={18} color={isGasAlert ? '#ef4444' : '#10b981'} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Gas (MQ-2)</Text>
                    <Text style={[styles.cardSub, { color: theme.text.muted }]}>Hazardous Vapor / Smoke</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    borderColor: isGasAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                  }
                ]}>
                  <Text style={[styles.statusBadgeText, { color: isGasAlert ? '#ef4444' : '#10b981' }]}>
                    {isGasAlert ? 'Alert / Warning' : 'Safe / Normal'}
                  </Text>
                </View>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.bigValue, { color: isGasAlert ? '#ef4444' : '#10b981' }]}>
                  {isGasAlert ? 'Detected' : 'Clear'}
                </Text>
                <Text style={[styles.bigUnit, { color: theme.text.secondary }]}>{isGasAlert ? 'ALERT' : 'SAFE'}</Text>
              </View>

              <View style={styles.indicatorContainer}>
                <View style={[
                  styles.indicatorPill, 
                  { 
                    backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                    borderColor: isGasAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name={isGasAlert ? "shield-alert" : "shield-check"} 
                    size={14} 
                    color={isGasAlert ? "#ef4444" : "#10b981"} 
                  />
                  <Text style={[styles.indicatorText, { color: isGasAlert ? '#ef4444' : '#10b981' }]}>
                    {isGasAlert ? 'Combustible Vapor Detected' : 'Atmosphere Clean & Protected'}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorder }]}>
                <Text style={[styles.cardFooterStatus, { color: theme.text.secondary }]}>
                  Sensor: <Text style={styles.cardFooterGreen}>Active</Text>
                </Text>
                <Text style={[styles.cardFooterSub, { color: theme.text.muted }]}>Updated: {lastUpdatedTime}</Text>
              </View>
            </View>

            {/* CARD 4: RAIN SENSOR */}
            <View style={[styles.sensorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isRaining ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                    <MaterialCommunityIcons name={isRaining ? "weather-rainy" : "weather-sunny"} size={18} color={isRaining ? '#38bdf8' : '#f59e0b'} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Rain Detector</Text>
                    <Text style={[styles.cardSub, { color: theme.text.muted }]}>Surface Precipitation</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: isRaining ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    borderColor: isRaining ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                  }
                ]}>
                  <Text style={[styles.statusBadgeText, { color: isRaining ? '#38bdf8' : '#f59e0b' }]}>
                    {isRaining ? 'Raining' : 'Clear / Dry'}
                  </Text>
                </View>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.bigValue, { color: isRaining ? '#38bdf8' : theme.text.primary }]}>
                  {isRaining ? 'Active' : 'Dry'}
                </Text>
                <Text style={[styles.bigUnit, { color: theme.text.secondary }]}>{isRaining ? 'RAIN' : 'NO RAIN'}</Text>
              </View>

              <View style={styles.indicatorContainer}>
                <View style={[
                  styles.indicatorPill, 
                  { 
                    backgroundColor: isRaining ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                    borderColor: isRaining ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.25)'
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name={isRaining ? "water-alert" : "weather-sunny"} 
                    size={14} 
                    color={isRaining ? "#38bdf8" : "#f59e0b"} 
                  />
                  <Text style={[styles.indicatorText, { color: isRaining ? '#38bdf8' : '#f59e0b' }]}>
                    {isRaining ? 'Precipitation In Progress' : 'No Surface Moisture Detected'}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorder }]}>
                <Text style={[styles.cardFooterStatus, { color: theme.text.secondary }]}>
                  Probe: <Text style={styles.cardFooterGreen}>Connected</Text>
                </Text>
                <Text style={[styles.cardFooterSub, { color: theme.text.muted }]}>Updated: {lastUpdatedTime}</Text>
              </View>
            </View>

          </View>

          {/* ================= SECTION 2: HEAT INDEX CARD ================= */}
          <View style={[styles.heatIndexCard, { backgroundColor: theme.card, borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
            <View style={styles.heatIndexHeader}>
              <View style={styles.heatIndexHeaderLeft}>
                <View style={styles.heatIndexIconBox}>
                  <MaterialCommunityIcons name="fire" size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text style={[styles.heatIndexTitle, { color: theme.text.primary }]}>Heat Index (Apparent Temperature)</Text>
                  <Text style={[styles.heatIndexSubtitle, { color: theme.text.muted }]}>Biometeorological Apparent Comfort Level</Text>
                </View>
              </View>
              <View style={[styles.heatBadge, { backgroundColor: `${heatIndexData.badgeColor}20`, borderColor: heatIndexData.badgeColor }]}>
                <Text style={[styles.heatBadgeText, { color: heatIndexData.badgeColor }]}>{heatIndexData.badgeText}</Text>
              </View>
            </View>

            <View style={styles.heatIndexBody}>
              <View style={styles.heatIndexMainValue}>
                <Text style={styles.heatIndexNumber}>{heatIndexData.value}</Text>
                <Text style={[styles.heatIndexUnit, { color: theme.text.secondary }]}>{tempUnit}</Text>
              </View>
              <View style={[styles.heatIndexDeltaPill, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="information-outline" size={12} color={theme.text.muted} />
                <Text style={[styles.heatIndexDeltaText, { color: theme.text.secondary }]}>{heatIndexData.delta}</Text>
              </View>
            </View>

            <View style={[styles.heatIndexFooter, { borderTopColor: theme.surfaceBorder }]}>
              <Text style={[styles.heatIndexFormula, { color: theme.text.muted }]}>
                Derived via Rothfusz Regression from Ambient Temp ({displayTemp.toFixed(1)}{tempUnit}) & Relative Humidity ({currentHum.toFixed(0)}%)
              </Text>
            </View>
          </View>

          {/* ================= SECTION 3: 12-HOUR ANALYSIS & GRAPHS ================= */}
          <View style={styles.analysisHeaderRow}>
            <View style={styles.analysisTitleGroup}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={16} color={theme.brand.sky} />
              <Text style={[styles.analysisTitle, { color: theme.text.primary }]}>12-Hour Telemetry Analysis</Text>
            </View>
            <View style={[styles.analysisWindowBadge, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={11} color={theme.text.muted} />
              <Text style={[styles.analysisWindowText, { color: theme.text.secondary }]}>Rolling 12 Hours</Text>
            </View>
          </View>

          {/* 12-Hour Summary Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Temp Stats Box */}
            <View style={[styles.statBox, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.statBoxTitle, { color: theme.text.secondary }]}>Temperature</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Min:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.temp.min}{tempUnit}</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Avg:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.brand.sky }]}>{stats12h.temp.avg}{tempUnit}</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Max:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.temp.max}{tempUnit}</Text>
                </View>
              </View>
            </View>

            {/* Humidity Stats Box */}
            <View style={[styles.statBox, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.statBoxTitle, { color: theme.text.secondary }]}>Humidity</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Min:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.hum.min}%</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Avg:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.brand.sky }]}>{stats12h.hum.avg}%</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Max:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.hum.max}%</Text>
                </View>
              </View>
            </View>

            {/* Gas Stats Box */}
            <View style={[styles.statBox, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.statBoxTitle, { color: theme.text.secondary }]}>Gas Hazard</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Active:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.gas.alertHours} hrs</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Status:</Text>
                  <Text style={[styles.statMiniVal, { color: '#10b981' }]}>{stats12h.gas.status}</Text>
                </View>
              </View>
            </View>

            {/* Rain Stats Box */}
            <View style={[styles.statBox, { backgroundColor: theme.cardSubtle, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.statBoxTitle, { color: theme.text.secondary }]}>Precipitation</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Duration:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.text.primary }]}>{stats12h.rain.activeHours} hrs</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={[styles.statMiniLabel, { color: theme.text.muted }]}>Status:</Text>
                  <Text style={[styles.statMiniVal, { color: theme.brand.sky }]}>{stats12h.rain.status}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 12-Hour Telemetry Graph Component */}
          <TwelveHourAnalysisGraph 
            history={twelveHourHistory}
            currentTemp={currentTemp}
            currentHum={currentHum}
            isRaining={isRaining}
            isGasAlert={isGasAlert}
            isFahrenheit={isFahrenheit}
            theme={theme}
            isDark={isDark}
          />
        </View>
      )}

      {/* Footer Info */}
      <View style={[styles.footer, { borderTopColor: theme.surfaceBorder }]}>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.text.muted }]}>Smart City Urban Platform • Hardware Node 01</Text>
          <View style={styles.liveIndicator}>
            <View style={[styles.pulseDot, { backgroundColor: theme.status.success }]} />
            <Text style={[styles.liveText, { color: theme.status.success }]}>Live Telemetry</Text>
          </View>
        </View>
        <Text style={[styles.footerSubText, { color: theme.text.muted }]}>
          Connected to Express Backend & Firebase RTDB
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 14,
    paddingBottom: 30
  },
  citySection: {
    marginBottom: 10
  },
  sensorSection: {
    marginBottom: 10
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusSubtitle: {
    fontSize: 12,
    fontWeight: '600'
  },
  syncClock: {
    fontSize: 11,
    fontFamily: 'monospace'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  sectionControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  probesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  probesBadgeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  unitBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  cardsGrid: {
    gap: 12,
    marginBottom: 16
  },
  sensorCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  cardSub: {
    fontSize: 10,
    marginTop: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4
  },
  bigValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  bigUnit: {
    fontSize: 13,
    fontWeight: '600'
  },
  scaleContainer: {
    marginTop: 8,
    marginBottom: 8
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  scaleLabelText: {
    fontSize: 9,
    fontFamily: 'monospace'
  },
  scaleLabelMid: {
    fontSize: 9
  },
  scaleBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  scaleBarFill: {
    height: '100%',
    borderRadius: 3
  },
  indicatorContainer: {
    marginVertical: 8
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600'
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4
  },
  cardFooterStatus: {
    fontSize: 10
  },
  cardFooterGreen: {
    color: '#10b981',
    fontWeight: '600'
  },
  cardFooterSub: {
    fontSize: 10,
    fontFamily: 'monospace'
  },
  heatIndexCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  heatIndexHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  heatIndexHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  heatIndexIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heatIndexTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  heatIndexSubtitle: {
    fontSize: 10
  },
  heatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  heatBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  heatIndexBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6
  },
  heatIndexMainValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  heatIndexNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f59e0b',
    fontFamily: 'monospace'
  },
  heatIndexUnit: {
    fontSize: 14,
    fontWeight: '600'
  },
  heatIndexDeltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  heatIndexDeltaText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  heatIndexFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 6
  },
  heatIndexFormula: {
    fontSize: 10,
    lineHeight: 14
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  analysisTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  analysisWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  analysisWindowText: {
    fontSize: 10,
    fontFamily: 'monospace'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1
  },
  statBoxTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  statRows: {
    gap: 2
  },
  statMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statMiniLabel: {
    fontSize: 10
  },
  statMiniVal: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  footer: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 4
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  footerText: {
    fontSize: 11
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600'
  },
  footerSubText: {
    fontSize: 10
  }
});
