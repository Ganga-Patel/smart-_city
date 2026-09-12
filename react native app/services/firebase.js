// Firebase Realtime Database Service for React Native
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { FIREBASE_CONFIG } from '../constants/Config';
import { normalizeRawTelemetry } from './normalizer';

let app;
let db;

export function initFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(FIREBASE_CONFIG);
  } else {
    app = getApp();
  }
  db = getDatabase(app);
  return { app, db };
}

export function subscribeToTelemetry(onDataCallback, onConnectionCallback) {
  if (!db) initFirebase();

  // 1. Connection state
  const connectedRef = ref(db, '.info/connected');
  const unsubConn = onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    if (onConnectionCallback) onConnectionCallback(isConnected);
  });

  // 2. Direct firmware path (/smartcity)
  const smartcityRef = ref(db, 'smartcity');
  const unsubSmartcity = onValue(smartcityRef, (snap) => {
    const raw = snap.val();
    if (raw && onDataCallback) {
      const normalized = normalizeRawTelemetry(raw, 'smartcity');
      onDataCallback(normalized);
    }
  }, (err) => {
    console.warn('Firebase /smartcity subscription error:', err);
  });

  // 3. Bridge path (/sensor)
  const sensorRef = ref(db, 'sensor');
  const unsubSensor = onValue(sensorRef, (snap) => {
    const raw = snap.val();
    if (raw && onDataCallback) {
      const normalized = normalizeRawTelemetry(raw, 'sensor');
      onDataCallback(normalized);
    }
  }, (err) => {
    console.warn('Firebase /sensor subscription error:', err);
  });

  // Return unsubscribe cleanup function
  return () => {
    unsubConn();
    unsubSmartcity();
    unsubSensor();
  };
}
