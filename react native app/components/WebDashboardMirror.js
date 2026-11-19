import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_CONFIG } from '../constants/Config';

export default function WebDashboardMirror({ 
  initialPath = '/sensor-dashboard', 
  onSwitchToNative 
}) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const webViewRef = useRef(null);

  const baseUrl = API_CONFIG.lanUrl.replace(/\/+$/, '');
  const targetUrl = `${baseUrl}${initialPath}?mobile=1&t=${Date.now()}`;

  const handleReload = () => {
    setLoading(true);
    setHasError(false);
    setReloadKey(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* 100% Full Screen WebView: Exact Pixel-for-Pixel Replica of Website */}
      <View style={styles.webWrapper}>
        <WebView
          key={`${targetUrl}_${reloadKey}`}
          ref={webViewRef}
          source={{ uri: targetUrl }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          onLoadStart={() => {
            setLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
          renderLoading={() => (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loaderText}>Loading 1:1 Live Website Dashboard...</Text>
              <Text style={styles.loaderSub}>{targetUrl}</Text>
            </View>
          )}
        />

        {/* Minimal Floating Switcher / Reload Pill at Bottom Right */}
        <View style={styles.floatingBar}>
          <TouchableOpacity 
            style={styles.floatingBtn} 
            onPress={handleReload}
            activeOpacity={0.8}
            title="Reload Web Page"
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#38bdf8" />
          </TouchableOpacity>

          {onSwitchToNative && (
            <TouchableOpacity 
              style={[styles.floatingBtn, styles.nativeBtn]} 
              onPress={onSwitchToNative}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cellphone" size={13} color="#10b981" />
              <Text style={styles.nativeBtnText}>Native UI</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="wifi-off" size={42} color="#ef4444" />
            <Text style={styles.errorTitle}>Cannot Connect to Web Server</Text>
            <Text style={styles.errorDesc}>
              Make sure your phone is connected to the same Wi-Fi and server is running at:
            </Text>
            <Text style={styles.errorUrl}>{targetUrl}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleReload}>
                <Text style={styles.retryBtnText}>Retry Connection</Text>
              </TouchableOpacity>
              {onSwitchToNative && (
                <TouchableOpacity style={styles.fallbackBtn} onPress={onSwitchToNative}>
                  <Text style={styles.fallbackBtnText}>Switch to Native UI</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  webWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#030712'
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712'
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10
  },
  loaderText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14
  },
  loaderSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  floatingBar: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8
  },
  floatingBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  nativeBtn: {
    width: 'auto',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  nativeBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700'
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12
  },
  errorDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  errorUrl: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 8,
    textAlign: 'center'
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  fallbackBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  fallbackBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600'
  }
});
