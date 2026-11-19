import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WeatherCard from '../components/WeatherCard';
import AirQualityCard from '../components/AirQualityCard';
import TrafficCard from '../components/TrafficCard';
import TwelveHourAnalysisGraph from '../components/TwelveHourAnalysisGraph';

export default function DashboardScreen({
  telemetry,
  history = [],
  onRefresh,
  isRefreshing,
  isFahrenheit = false,
  onToggleUnit,
  activeMode = 'sensor',
  onToggleMode,
  onSwitchToWebMirror
}) {
  const [internalMode, setInternalMode] = useState(activeMode);
  const [internalFahrenheit, setInternalFahrenheit] = useState(isFahrenheit);

  useEffect(() => {
    if (activeMode) {
      setInternalMode(activeMode);
    }
  }, [activeMode]);

  useEffect(() => {
    setInternalFahrenheit(isFahrenheit);
  }, [isFahrenheit]);

  const setMode = (mode) => {
    setInternalMode(mode);
    if (onToggleMode) {
      onToggleMode(mode);
    }
  };

  const toggleUnit = () => {
    if (onToggleUnit) {
      onToggleUnit();
    } else {
      setInternalFahrenheit(prev => !prev);
    }
  };

  const useFahrenheit = onToggleUnit ? isFahrenheit : internalFahrenheit;

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

    const minH = hums.length > 0 ? Math.min(...hms => hms, ...hums) : currentHum;
    const maxH = hums.length > 0 ? Math.max(...hums) : currentHum;
    const avgH = hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length) : currentHum;

    const gasAlertCount = twelveHourHistory.filter(h => h.isGasAlert).length;
    const rainCount = twelveHourHistory.filter(h => h.isRaining).length;

    const dispMinT = useFahrenheit ? (minT * 1.8 + 32) : minT;
    const dispMaxT = useFahrenheit ? (maxT * 1.8 + 32) : maxT;
    const dispAvgT = useFahrenheit ? (avgT * 1.8 + 32) : avgT;

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
  }, [twelveHourHistory, currentTemp, currentHum, useFahrenheit]);

  const lastUpdatedTime = safeFormatTime(telemetry?.timestamp);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1:1 Localhost Web Mirror Quick-Switch Pill */}
      {onSwitchToWebMirror && (
        <TouchableOpacity 
          style={styles.webMirrorBanner} 
          onPress={onSwitchToWebMirror}
          activeOpacity={0.8}
        >
          <View style={styles.webMirrorBannerLeft}>
            <MaterialCommunityIcons name="web" size={16} color="#38bdf8" />
            <Text style={styles.webMirrorBannerText}>
              Switch to 1:1 Localhost Web Dashboard
            </Text>
          </View>
          <View style={styles.webMirrorBadge}>
            <Text style={styles.webMirrorBadgeText}>Exact Web UI</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color="#38bdf8" />
          </View>
        </TouchableOpacity>
      )}

      {/* ================= TOP SEGMENTED SWITCHER (CITY VS SENSORS) ================= */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentBtn, internalMode === 'city' && styles.segmentBtnActive]}
          onPress={() => setMode('city')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="city-variant" 
            size={16} 
            color={internalMode === 'city' ? '#38bdf8' : '#94a3b8'} 
          />
          <Text style={[styles.segmentText, internalMode === 'city' && styles.segmentTextActive]}>
            City Dashboard
          </Text>
          {internalMode === 'city' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.segmentBtn, internalMode === 'sensor' && styles.segmentBtnActive]}
          onPress={() => setMode('sensor')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="cpu-64-bit" 
            size={16} 
            color={internalMode === 'sensor' ? '#38bdf8' : '#94a3b8'} 
          />
          <Text style={[styles.segmentText, internalMode === 'sensor' && styles.segmentTextActive]}>
            Sensor Dashboard
          </Text>
          {internalMode === 'sensor' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* MODE 1: CITY DASHBOARD (WEATHER, AIR QUALITY, TRAFFIC)                    */}
      {/* ========================================================================= */}
      {internalMode === 'city' && (
        <View style={styles.citySection}>
          {/* Status Subtitle Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusLeft}>
              <View style={styles.livePulseDot} />
              <Text style={styles.statusSubtitle}>Real-Time City Weather & Mobility</Text>
            </View>
            <Text style={styles.syncClock}>Updated: {lastUpdatedTime}</Text>
          </View>

          {/* BOX 1: REAL-TIME WEATHER INTELLIGENCE */}
          <WeatherCard 
            cityWeather={telemetry?.cityWeather} 
            weather={telemetry?.weather} 
          />

          {/* BOX 2: URBAN AIR QUALITY & ATMOSPHERIC INDEX */}
          <AirQualityCard 
            airQuality={telemetry?.airQuality} 
          />

          {/* BOX 3: URBAN MOBILITY & LIVE TRAFFIC */}
          <TrafficCard 
            traffic={telemetry?.traffic} 
          />

          {/* Quick Switch Banner to Sensor Dashboard */}
          <TouchableOpacity 
            style={styles.switchBanner} 
            onPress={() => setMode('sensor')}
            activeOpacity={0.8}
          >
            <View style={styles.switchBannerLeft}>
              <View style={styles.switchBannerIcon}>
                <MaterialCommunityIcons name="chip" size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.switchBannerTitle}>Open Sensor Monitoring Dashboard</Text>
                <Text style={styles.switchBannerDesc}>View DHT22, MQ2, Rain & 12-Hour Telemetry Graph</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SENSOR DASHBOARD (DHT22, MQ2, RAIN, HEAT INDEX, 12H GRAPH)        */}
      {/* ========================================================================= */}
      {internalMode === 'sensor' && (
        <View style={styles.sensorSection}>
          {/* Section 1 Header */}
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

          {/* 4 Main Sensor Cards */}
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

              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>{displayTemp.toFixed(1)}</Text>
                <Text style={styles.bigUnit}>{tempUnit}</Text>
              </View>

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
                    <Text style={styles.cardSub}>Relative Moisture</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: humStatus.bg, borderColor: humStatus.border }]}>
                  <Text style={[styles.statusBadgeText, { color: humStatus.textCol }]}>{humStatus.text}</Text>
                </View>
              </View>

              <View style={styles.valueRow}>
                <Text style={styles.bigValue}>{currentHum.toFixed(1)}</Text>
                <Text style={styles.bigUnit}>% RH</Text>
              </View>

              <View style={styles.scaleContainer}>
                <View style={styles.scaleLabels}>
                  <Text style={styles.scaleLabelText}>0%</Text>
                  <Text style={styles.scaleLabelMid}>Ideal: 35–65%</Text>
                  <Text style={styles.scaleLabelText}>100%</Text>
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

            {/* CARD 3: GAS SENSOR */}
            <View style={styles.sensorCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                    <MaterialCommunityIcons name="molecule" size={18} color={isGasAlert ? '#ef4444' : '#10b981'} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Gas (MQ-2)</Text>
                    <Text style={styles.cardSub}>Hazardous Vapor / Smoke</Text>
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
                <Text style={styles.bigUnit}>{isGasAlert ? 'ALERT' : 'SAFE'}</Text>
              </View>

              <View style={styles.indicatorContainer}>
                <View style={[styles.indicatorPill, { backgroundColor: isGasAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)' }]}>
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

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterStatus}>Sensor: <Text style={styles.cardFooterGreen}>Active</Text></Text>
                <Text style={styles.cardFooterSub}>Updated: {lastUpdatedTime}</Text>
              </View>
            </View>

            {/* CARD 4: RAIN SENSOR */}
            <View style={styles.sensorCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isRaining ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                    <MaterialCommunityIcons name={isRaining ? "weather-rainy" : "weather-sunny"} size={18} color={isRaining ? '#38bdf8' : '#f59e0b'} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Rain Detector</Text>
                    <Text style={styles.cardSub}>Surface Precipitation</Text>
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
                <Text style={[styles.bigValue, { color: isRaining ? '#38bdf8' : '#f8fafc' }]}>
                  {isRaining ? 'Active' : 'Dry'}
                </Text>
                <Text style={styles.bigUnit}>{isRaining ? 'RAIN' : 'NO RAIN'}</Text>
              </View>

              <View style={styles.indicatorContainer}>
                <View style={[styles.indicatorPill, { backgroundColor: isRaining ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.12)' }]}>
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

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterStatus}>Probe: <Text style={styles.cardFooterGreen}>Connected</Text></Text>
                <Text style={styles.cardFooterSub}>Updated: {lastUpdatedTime}</Text>
              </View>
            </View>

          </View>

          {/* ================= SECTION 2: HEAT INDEX CARD ================= */}
          <View style={styles.heatIndexCard}>
            <View style={styles.heatIndexHeader}>
              <View style={styles.heatIndexHeaderLeft}>
                <View style={styles.heatIndexIconBox}>
                  <MaterialCommunityIcons name="fire" size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text style={styles.heatIndexTitle}>Heat Index (Apparent Temperature)</Text>
                  <Text style={styles.heatIndexSubtitle}>Biometeorological Apparent Comfort Level</Text>
                </View>
              </View>
              <View style={[styles.heatBadge, { backgroundColor: `${heatIndexData.badgeColor}20`, borderColor: heatIndexData.badgeColor }]}>
                <Text style={[styles.heatBadgeText, { color: heatIndexData.badgeColor }]}>{heatIndexData.badgeText}</Text>
              </View>
            </View>

            <View style={styles.heatIndexBody}>
              <View style={styles.heatIndexMainValue}>
                <Text style={styles.heatIndexNumber}>{heatIndexData.value}</Text>
                <Text style={styles.heatIndexUnit}>{tempUnit}</Text>
              </View>
              <View style={styles.heatIndexDeltaPill}>
                <MaterialCommunityIcons name="information-outline" size={12} color="#94a3b8" />
                <Text style={styles.heatIndexDeltaText}>{heatIndexData.delta}</Text>
              </View>
            </View>

            <View style={styles.heatIndexFooter}>
              <Text style={styles.heatIndexFormula}>
                Derived via Rothfusz Regression from Ambient Temp ({displayTemp.toFixed(1)}{tempUnit}) & Relative Humidity ({currentHum.toFixed(0)}%)
              </Text>
            </View>
          </View>

          {/* ================= SECTION 3: 12-HOUR ANALYSIS & GRAPHS ================= */}
          <View style={styles.analysisHeaderRow}>
            <View style={styles.analysisTitleGroup}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={16} color="#38bdf8" />
              <Text style={styles.analysisTitle}>12-Hour Telemetry Analysis</Text>
            </View>
            <View style={styles.analysisWindowBadge}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={11} color="#94a3b8" />
              <Text style={styles.analysisWindowText}>Rolling 12 Hours</Text>
            </View>
          </View>

          {/* 12-Hour Summary Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Temp Stats Box */}
            <View style={styles.statBox}>
              <Text style={styles.statBoxTitle}>Temperature</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Min:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.temp.min}{tempUnit}</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Avg:</Text>
                  <Text style={[styles.statMiniVal, { color: '#38bdf8' }]}>{stats12h.temp.avg}{tempUnit}</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Max:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.temp.max}{tempUnit}</Text>
                </View>
              </View>
            </View>

            {/* Humidity Stats Box */}
            <View style={styles.statBox}>
              <Text style={styles.statBoxTitle}>Humidity</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Min:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.hum.min}%</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Avg:</Text>
                  <Text style={[styles.statMiniVal, { color: '#38bdf8' }]}>{stats12h.hum.avg}%</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Max:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.hum.max}%</Text>
                </View>
              </View>
            </View>

            {/* Gas Stats Box */}
            <View style={styles.statBox}>
              <Text style={styles.statBoxTitle}>Gas Hazard</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Active:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.gas.alertHours} hrs</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Status:</Text>
                  <Text style={[styles.statMiniVal, { color: '#10b981' }]}>{stats12h.gas.status}</Text>
                </View>
              </View>
            </View>

            {/* Rain Stats Box */}
            <View style={styles.statBox}>
              <Text style={styles.statBoxTitle}>Precipitation</Text>
              <View style={styles.statRows}>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Duration:</Text>
                  <Text style={styles.statMiniVal}>{stats12h.rain.activeHours} hrs</Text>
                </View>
                <View style={styles.statMiniRow}>
                  <Text style={styles.statMiniLabel}>Status:</Text>
                  <Text style={[styles.statMiniVal, { color: '#38bdf8' }]}>{stats12h.rain.status}</Text>
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
            isFahrenheit={useFahrenheit}
          />

          {/* Quick Switch Banner to City Dashboard */}
          <TouchableOpacity 
            style={styles.switchBanner} 
            onPress={() => setMode('city')}
            activeOpacity={0.8}
          >
            <View style={styles.switchBannerLeft}>
              <View style={styles.switchBannerIcon}>
                <MaterialCommunityIcons name="city" size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.switchBannerTitle}>Open City Weather & Traffic Dashboard</Text>
                <Text style={styles.switchBannerDesc}>View Anand Weather, AQI & Live Corridor Traffic</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Smart City Urban Platform • Hardware Node 01</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>Live Telemetry</Text>
          </View>
        </View>
        <Text style={styles.footerSubText}>Connected to Express Backend & Firebase RTDB</Text>
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
    padding: 14,
    paddingBottom: 40
  },
  webMirrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12
  },
  webMirrorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  webMirrorBannerText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600'
  },
  webMirrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  webMirrorBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700'
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    marginBottom: 14
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
    position: 'relative'
  },
  segmentBtnActive: {
    backgroundColor: '#1e293b'
  },
  segmentText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: '#f8fafc',
    fontWeight: '700'
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38bdf8',
    position: 'absolute',
    bottom: 3
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
    borderRadius: 4,
    backgroundColor: '#10b981'
  },
  statusSubtitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600'
  },
  syncClock: {
    color: '#94a3b8',
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
    color: '#f8fafc',
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
    color: '#94a3b8',
    fontSize: 11,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    fontFamily: 'monospace'
  },
  unitBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  unitBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  cardsGrid: {
    gap: 12,
    marginBottom: 16
  },
  sensorCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)'
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
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  cardSub: {
    color: '#64748b',
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
    color: '#f8fafc',
    fontFamily: 'monospace'
  },
  bigUnit: {
    fontSize: 13,
    color: '#94a3b8',
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
    color: '#64748b',
    fontSize: 9,
    fontFamily: 'monospace'
  },
  scaleLabelMid: {
    color: '#94a3b8',
    fontSize: 9
  },
  scaleBarTrack: {
    height: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
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
    borderRadius: 8
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
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    paddingTop: 8,
    marginTop: 4
  },
  cardFooterStatus: {
    color: '#94a3b8',
    fontSize: 10
  },
  cardFooterGreen: {
    color: '#10b981',
    fontWeight: '600'
  },
  cardFooterSub: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  heatIndexCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
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
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700'
  },
  heatIndexSubtitle: {
    color: '#64748b',
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
    color: '#94a3b8',
    fontWeight: '600'
  },
  heatIndexDeltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)'
  },
  heatIndexDeltaText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  heatIndexFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    paddingTop: 8,
    marginTop: 6
  },
  heatIndexFormula: {
    color: '#64748b',
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
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  analysisWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)'
  },
  analysisWindowText: {
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)'
  },
  statBoxTitle: {
    color: '#94a3b8',
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
    color: '#64748b',
    fontSize: 10
  },
  statMiniVal: {
    color: '#f8fafc',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 14,
    padding: 14,
    marginTop: 16
  },
  switchBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  switchBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  switchBannerTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700'
  },
  switchBannerDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2
  },
  footer: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    alignItems: 'center',
    gap: 4
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  footerText: {
    color: '#64748b',
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
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  liveText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600'
  },
  footerSubText: {
    color: '#475569',
    fontSize: 10
  }
});
