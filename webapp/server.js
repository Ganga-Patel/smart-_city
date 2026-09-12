const express = require('express');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const smartcityService = require('./smartcity-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
let db = null;
try {
  const serviceAccount = require(path.join(__dirname, '..', 'smartcity-61fad-firebase-adminsdk-fbsvc-eea2762ce1.json'));
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smartcity-61fad-default-rtdb.firebaseio.com/"
  });
  db = getDatabase();
  console.log("🔥 Firebase Admin SDK connected to smartcity-61fad-default-rtdb");
} catch (err) {
  console.error("⚠️ Failed to initialize Firebase Admin SDK:", err.message);
}

// Middleware for JSON parsing and URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from webapp/public directory
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// UNIFIED SMART CITY DASHBOARD API ENDPOINT
// =========================================================================

/**
 * GET /api/dashboard-data
 * Single Unified Dashboard Data Endpoint:
 * 1. Firebase Sensor Telemetry (Temperature & Humidity, Rain, Gas)
 * 2. External Weather Information for Anand, Gujarat, India ONLY
 * 3. Air Quality Information for Anand, Gujarat, India ONLY
 * 4. API keys read dynamically from existing text files
 * 5. Clean production payload (no keys, no provider logos, no debug clutter)
 */
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const data = await smartcityService.getUnifiedDashboardData(db);
    res.json(data);
  } catch (err) {
    console.error("Error fetching unified dashboard data:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      location: smartcityService.FIXED_LOCATION,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    location: smartcityService.FIXED_LOCATION,
    firebase: db ? 'connected' : 'rest-fallback',
    timestamp: new Date().toISOString(),
    service: 'Smart City Unified Dashboard Server'
  });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏙️  Smart City Unified Dashboard Server Running`);
  console.log(`📍 Location: Anand, Gujarat, India`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Unified API: http://localhost:${PORT}/api/dashboard-data`);
  console.log(`📁 Serving assets from: ${path.join(__dirname, 'public')}`);
  console.log(`====================================================`);
});
