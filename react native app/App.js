import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from './components/Header';
import DashboardScreen from './screens/DashboardScreen';
import { subscribeToTelemetry } from './services/firebase';
import { normalizeRawTelemetry } from './services/normalizer';
import { startUnifiedPolling, fetchUnifiedDashboardData } from './services/api';

export default function App() {
  // Only 2 pages as requested: 'sensor' | 'city' (Default to 'sensor' matching website)
  const [dashboardMode, setDashboardMode] = useState('sensor');
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Live Telemetry & History State
  const [telemetry, setTelemetry] = useState(normalizeRawTelemetry(null, 'smartcity'));
  const [history, setHistory] = useState([]);

  // Subscribe to Live WebApp Unified Telemetry (with Firebase fallback)
  useEffect(() => {
    // 1. Live continuous polling of /api/dashboard-data (matches WebApp backend)
    const unsubApi = startUnifiedPolling(
      (data) => {
        if (data) {
          handleIncomingTelemetry(data);
        }
      },
      (connected) => {
        setIsConnected(connected);
      },
      5000
    );

    // 2. Secondary fallback listener for direct Firebase RTDB
    const unsubFb = subscribeToTelemetry(
      (data) => {
        if (data) {
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
  }, []);

  // Handle incoming telemetry payload
  const handleIncomingTelemetry = (data) => {
    if (!data) return;
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
  };

  // Manual pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchUnifiedDashboardData();
      if (data) {
        handleIncomingTelemetry(data);
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('Manual sync failed:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isSensor = dashboardMode === 'sensor';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Top Header Matching Website */}
      <Header 
        isConnected={isConnected} 
        lastSyncTime={telemetry?.timestamp}
        onRefresh={handleRefresh}
        isFahrenheit={isFahrenheit}
        onToggleUnit={() => setIsFahrenheit(prev => !prev)}
        activeMode={dashboardMode}
        onToggleMode={() => setDashboardMode(prev => prev === 'sensor' ? 'city' : 'sensor')}
        location={telemetry?.location || 'Anand, Gujarat, India'}
      />

      {/* Main Screen Content: Dedicated City or Sensor Dashboard */}
      <View style={styles.screenContainer}>
        <DashboardScreen 
          telemetry={telemetry} 
          history={history} 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing}
          isFahrenheit={isFahrenheit}
          onToggleUnit={() => setIsFahrenheit(prev => !prev)}
          activeMode={dashboardMode}
          onToggleMode={(mode) => setDashboardMode(mode)}
        />
      </View>

      {/* Clean 2-Page Bottom Navigation Bar (ONLY City Dashboard & Sensor Dashboard) */}
      <View style={styles.tabBar}>
        {/* Page 1: City Dashboard */}
        <TouchableOpacity 
          style={[styles.tabItem, !isSensor && styles.tabItemActive]} 
          onPress={() => setDashboardMode('city')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={!isSensor ? "city-variant" : "city-variant-outline"} 
            size={22} 
            color={!isSensor ? "#38bdf8" : "#64748b"} 
          />
          <Text style={[styles.tabLabel, !isSensor && styles.tabLabelActive]}>
            City Dashboard
          </Text>
          {!isSensor && <View style={styles.activeBar} />}
        </TouchableOpacity>

        {/* Page 2: Sensor Dashboard */}
        <TouchableOpacity 
          style={[styles.tabItem, isSensor && styles.tabItemActive]} 
          onPress={() => setDashboardMode('sensor')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isSensor ? "cpu-64-bit" : "cpu-64-bit"} 
            size={22} 
            color={isSensor ? "#38bdf8" : "#64748b"} 
          />
          <Text style={[styles.tabLabel, isSensor && styles.tabLabelActive]}>
            Sensor Dashboard
          </Text>
          {isSensor && <View style={styles.activeBar} />}
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
    borderTopColor: 'rgba(51, 65, 85, 0.7)',
    paddingVertical: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    gap: 8,
    position: 'relative'
  },
  tabItemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.5)'
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  tabLabelActive: {
    color: '#38bdf8',
    fontWeight: '800'
  },
  activeBar: {
    position: 'absolute',
    bottom: 2,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#38bdf8'
  }
});
