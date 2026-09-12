import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import SensorCard from '../components/SensorCard';
import SecurityMatrix from '../components/SecurityMatrix';
import WaterQualityCard from '../components/WaterQualityCard';
import WeatherCard from '../components/WeatherCard';
import ClimateChart from '../components/ClimateChart';
import EventLogStream from '../components/EventLogStream';
import HazardBanner from '../components/HazardBanner';
import { SensorIcons } from '../constants/Icons';

export default function DashboardScreen({
  telemetry,
  history,
  activeAlert,
  logs,
  onAcknowledgeAlert,
  onClearLogs,
  onRefresh,
  isRefreshing
}) {
  const isRaining = telemetry.rainDetected;
  const gasVal = Math.round(telemetry.gasPpm || telemetry.gasRaw || 0);

  // Status determinations
  const getTempStatus = (temp) => {
    if (temp >= 38) return { text: 'Heat Spike', type: 'danger' };
    if (temp <= 10) return { text: 'Cold', type: 'info' };
    return { text: 'Normal', type: 'success' };
  };

  const getHumidityStatus = (hum) => {
    if (hum < 30) return { text: 'Dry', type: 'warning' };
    if (hum <= 65) return { text: 'Optimal', type: 'success' };
    return { text: 'High Moisture', type: 'info' };
  };

  const getGasStatus = (gas, alert) => {
    if (alert || gas >= 300) return { text: 'HAZARDOUS', type: 'danger' };
    if (gas >= 250) return { text: 'Moderate', type: 'warning' };
    return { text: 'Good (Safe)', type: 'success' };
  };

  const tempStatus = getTempStatus(telemetry.temperature);
  const humStatus = getHumidityStatus(telemetry.humidity);
  const gasStatus = getGasStatus(gasVal, telemetry.gasAlert);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Active Hazard Banner */}
      <HazardBanner alert={activeAlert} onAcknowledge={onAcknowledgeAlert} />

      {/* Row 1: Primary Metrics Grid (2 Columns) */}
      <View style={styles.gridRow}>
        {/* Temperature */}
        <SensorCard
          title="Ambient Temp"
          value={telemetry.temperature ? telemetry.temperature.toFixed(1) : '--'}
          unit="°C"
          iconName={SensorIcons.temperature.name}
          iconColor={SensorIcons.temperature.color}
          iconBgColor={SensorIcons.temperature.bgColor}
          statusText={tempStatus.text}
          statusType={tempStatus.type}
          progressPercent={(telemetry.temperature / 50) * 100}
          subInfo="Min: 22°C • Max: 34°C"
        />

        {/* Humidity */}
        <SensorCard
          title="Humidity"
          value={telemetry.humidity ? Math.round(telemetry.humidity) : '--'}
          unit="%"
          iconName={SensorIcons.humidity.name}
          iconColor={SensorIcons.humidity.color}
          iconBgColor={SensorIcons.humidity.bgColor}
          statusText={humStatus.text}
          statusType={humStatus.type}
          progressPercent={telemetry.humidity}
          subInfo="Target: 40-60% RH"
        />
      </View>

      {/* Row 2: Rain & Gas Metrics Grid (2 Columns) */}
      <View style={styles.gridRow}>
        {/* Rain Detection */}
        <SensorCard
          title="Precipitation"
          value={isRaining ? 'Raining' : 'Clear'}
          unit=""
          iconName={isRaining ? SensorIcons.rainWet.name : SensorIcons.rainDry.name}
          iconColor={isRaining ? SensorIcons.rainWet.color : SensorIcons.rainDry.color}
          iconBgColor={isRaining ? SensorIcons.rainWet.bgColor : SensorIcons.rainDry.bgColor}
          statusText={isRaining ? 'PRECIPITATION' : 'DRY'}
          statusType={isRaining ? 'info' : 'success'}
          subInfo={`Raw Sensor DO: ${telemetry.rainRaw ?? 1}`}
        />

        {/* Gas & Air Quality */}
        <SensorCard
          title="Gas / Smoke"
          value={gasVal}
          unit="PPM"
          iconName={telemetry.gasAlert ? SensorIcons.gasAlert.name : SensorIcons.gasSafe.name}
          iconColor={telemetry.gasAlert ? SensorIcons.gasAlert.color : SensorIcons.gasSafe.color}
          iconBgColor={telemetry.gasAlert ? SensorIcons.gasAlert.bgColor : SensorIcons.gasSafe.bgColor}
          statusText={gasStatus.text}
          statusType={gasStatus.type}
          progressPercent={(gasVal / 600) * 100}
          subInfo="MQ-2 / MQ-135 Sensor"
        />
      </View>

      {/* Real-time Climate Timeline Chart */}
      <ClimateChart history={history} />

      {/* Security & Surveillance Matrix */}
      <SecurityMatrix 
        pirMotion={telemetry.pirMotion} 
        irObstacle={telemetry.irObstacle} 
        reedLocked={telemetry.reedLocked} 
      />

      {/* Expansion Stations */}
      <WaterQualityCard water={telemetry.water} />
      <WeatherCard weather={telemetry.weather} />

      {/* Event Audit Stream */}
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
    paddingBottom: 30
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12
  }
});
