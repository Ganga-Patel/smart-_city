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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeNode, setActiveNode] = useState('node_01');
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Telemetry & History State
  const [telemetry, setTelemetry] = useState(normalizeRawTelemetry(null, 'smartcity'));
  const [history, setHistory] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState(new Map());
  const [acknowledgedKeys, setAcknowledgedKeys] = useState(new Set());
  const [activeBannerAlert, setActiveBannerAlert] = useState(null);
  
  // Real-time Event Audit Logs
  const [logs, setLogs] = useState([
    { time: '16:00:00', tag: 'SYS', message: 'Smart City Mobile App started.' },
    { time: '16:00:02', tag: 'NET', message: 'Connecting to Firebase Realtime Database...' }
  ]);

  const demoIntervalRef = useRef(null);

  // Append a new event to audit log
  const logEvent = (tag, message) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setLogs(prev => [{ time, tag, message }, ...prev.slice(0, 30)]);
  };

  // 1. Subscribe to Firebase Realtime Database
  useEffect(() => {
    logEvent('NET', 'Listening to Firebase /smartcity and /sensor paths.');
    
    const unsubscribe = subscribeToTelemetry(
      (data) => {
        if (!isDemoMode) {
          handleIncomingTelemetry(data);
        }
      },
      (connected) => {
        setIsConnected(connected);
        logEvent('NET', connected ? 'Firebase connected.' : 'Firebase disconnected.');
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isDemoMode]);

  // Handle incoming telemetry payload
  const handleIncomingTelemetry = (data) => {
    setTelemetry(data);

    // Update rolling history buffer (keep last 20)
    setHistory(prev => {
      const updated = [...prev, {
        temperature: data.temperature,
        humidity: data.humidity,
        gasPpm: data.gasPpm,
        timestamp: data.timestamp
      }];
      return updated.slice(-20);
    });

    // Evaluate safety alerts
    const { allAlerts, activeBannerAlert: bannerAlert } = evaluateTelemetryAlerts(
      data,
      activeAlerts,
      acknowledgedKeys
    );

    setActiveAlerts(allAlerts);
    setActiveBannerAlert(bannerAlert);
  };

  // Demo Feed Simulator
  const toggleDemoMode = () => {
    const nextState = !isDemoMode;
    setIsDemoMode(nextState);

    if (nextState) {
      logEvent('SIM', 'Demo Simulation Feed STARTED.');
      let tick = 0;
      demoIntervalRef.current = setInterval(() => {
        tick++;
        const mockData = {
          temperature: +(27 + Math.sin(tick * 0.4) * 4 + (Math.random() * 0.6 - 0.3)).toFixed(1),
          humidity: +(60 + Math.cos(tick * 0.3) * 12 + (Math.random() * 2 - 1)).toFixed(1),
          rainDetected: (tick % 12 === 0 || tick % 12 === 1),
          rainRaw: (tick % 12 === 0 || tick % 12 === 1) ? 0 : 1,
          gasPpm: +(120 + Math.abs(Math.sin(tick * 0.2)) * 180 + (tick % 18 === 0 ? 260 : 0)).toFixed(0),
          gasRaw: 140,
          gasAlert: (tick % 18 === 0),
          pirMotion: (tick % 8 === 0),
          irObstacle: (tick % 10 === 0),
          reedLocked: true,
          water: {
            ph: +(7.2 + Math.sin(tick * 0.1) * 0.3).toFixed(2),
            tds: +(140 + Math.cos(tick * 0.1) * 15).toFixed(0),
            turbidity: +(0.8 + Math.sin(tick * 0.2) * 0.4).toFixed(1),
            do: +(8.1 + Math.cos(tick * 0.2) * 0.5).toFixed(1)
          },
          weather: {
            windSpeed: +(12 + Math.sin(tick * 0.5) * 6).toFixed(1),
            windDir: ['N', 'NE', 'ENE', 'E', 'SE', 'S'][tick % 6],
            lux: Math.round(750 + Math.sin(tick * 0.2) * 150),
            pressure: Math.round(1012 + Math.cos(tick * 0.1) * 3)
          },
          timestamp: Date.now(),
          sourceNode: 'simulation_node'
        };

        handleIncomingTelemetry(mockData);
      }, 3000);
    } else {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      logEvent('SIM', 'Demo Simulation Feed STOPPED.');
    }
  };

  // Acknowledge hazard alert
  const handleAcknowledgeAlert = (alertId) => {
    setAcknowledgedKeys(prev => new Set(prev).add(alertId));
    setActiveBannerAlert(null);
    logEvent('ACK', `Hazard alert [${alertId}] acknowledged.`);
  };

  // Clear audit log
  const handleClearLogs = () => {
    setLogs([{ time: new Date().toLocaleTimeString('en-GB'), tag: 'LOG', message: 'Audit log cleared.' }]);
  };

  // Pull to refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    logEvent('NET', 'Refreshing telemetry stream...');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
            onToggleDemo={toggleDemoMode} 
            isConnected={isConnected} 
          />
        );
      default:
        return (
          <DashboardScreen 
            telemetry={telemetry} 
            history={history} 
            activeAlert={activeBannerAlert} 
            logs={logs} 
            onAcknowledgeAlert={handleAcknowledgeAlert} 
            onClearLogs={handleClearLogs} 
            onRefresh={handleRefresh} 
            isRefreshing={isRefreshing} 
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Top Header */}
      <Header 
        activeNode={activeNode} 
        isConnected={isConnected} 
        onSelectNode={setActiveNode} 
        isDemoMode={isDemoMode} 
        onToggleDemo={toggleDemoMode} 
      />

      {/* Main Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {/* 1. Dashboard Tab */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={activeTab === 'dashboard' ? 'view-dashboard' : 'view-dashboard-outline'} 
            size={22} 
            color={activeTab === 'dashboard' ? Colors.brand.sky : Colors.text.muted} 
          />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* 2. Analytics Tab */}
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

        {/* 3. Alerts Tab */}
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
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
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
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600'
  },
  tabLabelActive: {
    color: Colors.brand.sky,
    fontWeight: '700'
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.danger
  }
});
