import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './constants/Colors';
import Header from './components/Header';
import DashboardScreen from './screens/DashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import AlertsScreen from './screens/AlertsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { subscribeToTelemetry } from './services/firebase';
import { evaluateTelemetryAlerts } from './services/alerts';
import { normalizeRawTelemetry } from './services/normalizer';
import { startUnifiedPolling, fetchUnifiedDashboardData } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeNode, setActiveNode] = useState('node_01');
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Live Telemetry & History State
  const [telemetry, setTelemetry] = useState(normalizeRawTelemetry(null, 'smartcity'));
  const [history, setHistory] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState(new Map());
  const [acknowledgedKeys, setAcknowledgedKeys] = useState(new Set());
  const [activeBannerAlert, setActiveBannerAlert] = useState(null);
  
  // Real-time Event Audit Logs
  const [logs, setLogs] = useState([
    { time: '16:00:00', tag: 'SYS', message: 'Smart City Sensor Dashboard started.' },
    { time: '16:00:02', tag: 'NET', message: 'Connecting to Realtime Telemetry Stream...' }
  ]);

  const demoIntervalRef = useRef(null);

  // Append a new event to audit log
  const logEvent = (tag, message) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setLogs(prev => [{ time, tag, message }, ...prev.slice(0, 30)]);
  };

  // 1. Subscribe to Live WebApp & Vercel Unified Telemetry (with Firebase fallback)
  useEffect(() => {
    logEvent('NET', 'Connecting to WebApp & Vercel Unified Telemetry Stream...');
    
    // Live continuous polling of /api/dashboard-data (matches WebApp)
    const unsubApi = startUnifiedPolling(
      (data) => {
        if (!isDemoMode) {
          handleIncomingTelemetry(data);
        }
      },
      (connected) => {
        setIsConnected(connected);
        if (connected) {
          logEvent('NET', 'Connected to WebApp & Vercel Unified API.');
        } else {
          logEvent('NET', 'Retrying WebApp API connection...');
        }
      },
      5000
    );

    // Secondary fallback listener for direct Firebase RTDB
    const unsubFb = subscribeToTelemetry(
      (data) => {
        if (!isDemoMode && data) {
          handleIncomingTelemetry(data);
        }
      },
      (connected) => {
        if (connected) setIsConnected(true);
      }
    );

    return () => {
      if (unsubApi) unsubApi();
      if (unsubFb) unsubFb();
    };
  }, [isDemoMode]);

  // Handle incoming telemetry payload
  const handleIncomingTelemetry = (data) => {
    setTelemetry(data);

    // Update rolling history buffer (keep last 200 actual readings for 12h analysis)
    setHistory(prev => {
      const updated = [...prev, {
        temperature: data.temperature,
        humidity: data.humidity,
        gasPpm: data.gasPpm,
        isGasAlert: Boolean(data.gasAlert),
        isRaining: Boolean(data.rainDetected),
        timestamp: data.timestamp || Date.now()
      }];
      return updated.slice(-200);
    });

    // Evaluate safety alerts
    const { allAlerts, activeBannerAlert: bannerAlert } = evaluateTelemetryAlerts(
      data,
      acknowledgedKeys
    );
    setActiveAlerts(allAlerts);
    setActiveBannerAlert(bannerAlert);
  };

  // Manual pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    logEvent('USR', 'Manual telemetry refresh triggered.');
    try {
      const data = await fetchUnifiedDashboardData();
      handleIncomingTelemetry(data);
      setIsConnected(true);
    } catch (err) {
      logEvent('ERR', `Manual sync failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = (alertKey) => {
    setAcknowledgedKeys(prev => new Set([...prev, alertKey]));
    if (activeBannerAlert && activeBannerAlert.id === alertKey) {
      setActiveBannerAlert(null);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Render current tab content
  const renderScreen = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsScreen history={history} telemetry={telemetry} />;
      case 'alerts':
        return (
          <AlertsScreen 
            activeAlert={activeBannerAlert} 
            logs={logs} 
            onAcknowledgeAlert={handleAcknowledgeAlert} 
            onClearLogs={handleClearLogs} 
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            activeNode={activeNode} 
            onSelectNode={setActiveNode} 
            isDemoMode={isDemoMode} 
            onToggleDemo={() => setIsDemoMode(prev => !prev)} 
            isConnected={isConnected} 
            onSyncNow={handleRefresh}
          />
        );
      default:
        return (
          <DashboardScreen 
            telemetry={telemetry} 
            history={history} 
            onRefresh={handleRefresh} 
            isRefreshing={isRefreshing}
            isFahrenheit={isFahrenheit}
            onToggleUnit={() => setIsFahrenheit(prev => !prev)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Top Header matching sensor-dashboard.html */}
      <Header 
        isConnected={isConnected} 
        lastSyncTime={telemetry?.timestamp}
        onRefresh={handleRefresh}
        isFahrenheit={isFahrenheit}
        onToggleUnit={() => setIsFahrenheit(prev => !prev)}
      />

      {/* Main Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {/* 1. Sensor Dashboard Tab */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={activeTab === 'dashboard' ? 'cpu-64-bit' : 'cpu-64-bit'} 
            size={22} 
            color={activeTab === 'dashboard' ? Colors.brand.sky : Colors.text.muted} 
          />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Sensors
          </Text>
        </TouchableOpacity>

        {/* 2. 12h Analytics Tab */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('analytics')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={activeTab === 'analytics' ? 'chart-timeline-variant-shimmer' : 'chart-timeline-variant'} 
            size={22} 
            color={activeTab === 'analytics' ? Colors.brand.sky : Colors.text.muted} 
          />
          <Text style={[styles.tabLabel, activeTab === 'analytics' && styles.tabLabelActive]}>
            Analytics
          </Text>
        </TouchableOpacity>

        {/* 3. Safety Alerts Tab */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.7}
        >
          <View>
            <MaterialCommunityIcons 
              name={activeTab === 'alerts' ? 'bell-alert' : 'bell-alert-outline'} 
              size={22} 
              color={activeBannerAlert ? Colors.status.danger : (activeTab === 'alerts' ? Colors.brand.sky : Colors.text.muted)} 
            />
            {activeBannerAlert && <View style={styles.alertBadgeDot} />}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'alerts' && styles.tabLabelActive]}>
            Alerts
          </Text>
        </TouchableOpacity>

        {/* 4. Settings Tab */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={activeTab === 'settings' ? 'cog' : 'cog-outline'} 
            size={22} 
            color={activeTab === 'settings' ? Colors.brand.sky : Colors.text.muted} 
          />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  screenContainer: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: 'space-around'
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  tabLabelActive: {
    color: '#38bdf8',
    fontWeight: '800'
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444'
  }
});
