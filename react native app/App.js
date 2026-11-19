import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from './components/Header';
import DashboardScreen from './screens/DashboardScreen';
import { subscribeToTelemetry } from './services/firebase';
import { normalizeRawTelemetry } from './services/normalizer';
import { startUnifiedPolling, fetchUnifiedDashboardData } from './services/api';
import { DarkTheme, LightTheme } from './constants/Colors';

export default function App() {
  // Only 2 dashboard pages as requested: 'city' | 'sensor'
  const [dashboardMode, setDashboardMode] = useState('city');
  // Dark / Light Theme Mode (defaulting to dark matching website theme)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Derive active theme tokens
  const theme = isDarkMode ? DarkTheme : LightTheme;

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.headerBg} 
      />
      
      {/* Top Header Matching Website */}
      <Header 
        isConnected={isConnected} 
        lastSyncTime={telemetry?.timestamp}
        onRefresh={handleRefresh}
        isFahrenheit={isFahrenheit}
        onToggleUnit={() => setIsFahrenheit(prev => !prev)}
        activeMode={dashboardMode}
        location={telemetry?.location || 'Anand, Gujarat, India'}
        theme={theme}
        isDark={isDarkMode}
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
          theme={theme}
          isDark={isDarkMode}
        />
      </View>

      {/* ========================================================================= */}
      {/* FOOTER BAR: DASHBOARD SWITCHER (CITY / SENSORS) + DARK / LIGHT THEME TOGGLE */}
      {/* ========================================================================= */}
      <View style={[
        styles.tabBar, 
        { 
          backgroundColor: theme.footerBg, 
          borderTopColor: theme.footerBorder 
        }
      ]}>
        {/* Page 1: City Dashboard */}
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            !isSensor 
              ? {
                  backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)',
                  borderColor: theme.brand.sky
                }
              : {
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                  borderColor: theme.surfaceBorder
                }
          ]} 
          onPress={() => setDashboardMode('city')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={!isSensor ? "city-variant" : "city-variant-outline"} 
            size={20} 
            color={!isSensor ? theme.brand.sky : theme.text.muted} 
          />
          <Text style={[
            styles.tabLabel, 
            { color: !isSensor ? theme.brand.sky : theme.text.muted },
            !isSensor && styles.tabLabelActive
          ]}>
            City
          </Text>
          {!isSensor && <View style={[styles.activeBar, { backgroundColor: theme.brand.sky }]} />}
        </TouchableOpacity>

        {/* Page 2: Sensor Dashboard */}
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            isSensor 
              ? {
                  backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)',
                  borderColor: theme.brand.sky
                }
              : {
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                  borderColor: theme.surfaceBorder
                }
          ]} 
          onPress={() => setDashboardMode('sensor')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isSensor ? "cpu-64-bit" : "cpu-64-bit"} 
            size={20} 
            color={isSensor ? theme.brand.sky : theme.text.muted} 
          />
          <Text style={[
            styles.tabLabel, 
            { color: isSensor ? theme.brand.sky : theme.text.muted },
            isSensor && styles.tabLabelActive
          ]}>
            Sensors
          </Text>
          {isSensor && <View style={[styles.activeBar, { backgroundColor: theme.brand.sky }]} />}
        </TouchableOpacity>

        {/* Dark / Light Theme Toggle Option */}
        <TouchableOpacity 
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
              borderColor: theme.surfaceBorder
            }
          ]}
          onPress={() => setIsDarkMode(prev => !prev)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isDarkMode ? "weather-sunny" : "weather-night"} 
            size={18} 
            color={isDarkMode ? "#f59e0b" : "#6366f1"} 
          />
          <Text style={[styles.themeToggleText, { color: theme.text.secondary }]}>
            {isDarkMode ? 'Light' : 'Dark'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  screenContainer: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    gap: 8
  },
  tabItem: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    position: 'relative'
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  tabLabelActive: {
    fontWeight: '800'
  },
  activeBar: {
    position: 'absolute',
    bottom: 2,
    width: 24,
    height: 3,
    borderRadius: 1.5
  },
  themeToggleBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace'
  }
});
