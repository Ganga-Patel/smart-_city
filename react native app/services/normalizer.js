// Telemetry Normalizer for Multi-Schema Hardware & Bridge Feeds

export function normalizeRawTelemetry(raw, sourcePath) {
  const normalized = {
    temperature: 28.0,
    humidity: 60.0,
    rainRaw: 1,
    rainDetected: false,
    gasRaw: 120,
    gasPpm: 120,
    gasAlert: false,
    pirMotion: false,
    irObstacle: false,
    reedLocked: true,
    water: { ph: 7.2, tds: 140, turbidity: 0.8, do: 8.1 },
    weather: { windSpeed: 12.4, windDir: 'ENE', lux: 780, pressure: 1013 },
    timestamp: Date.now(),
    sourceNode: 'node_01'
  };

  if (!raw) return normalized;

  if (sourcePath === 'smartcity') {
    // DHT22 / DHT11
    if (raw.DHT22) {
      if (raw.DHT22.temperature !== undefined) normalized.temperature = parseFloat(raw.DHT22.temperature);
      if (raw.DHT22.humidity !== undefined) normalized.humidity = parseFloat(raw.DHT22.humidity);
    }

    // Rain sensor (0 = wet, 1 = dry)
    if (raw.Rain) {
      const val = parseInt(raw.Rain.value);
      normalized.rainRaw = isNaN(val) ? 1 : val;
      normalized.rainDetected = (normalized.rainRaw === 0);
    }

    // MQ2 Gas sensor
    if (raw.MQ2) {
      const val = parseInt(raw.MQ2.value);
      normalized.gasRaw = isNaN(val) ? 0 : val;
      normalized.gasPpm = normalized.gasRaw <= 1 ? (normalized.gasRaw === 1 ? 480 : 120) : normalized.gasRaw;
      normalized.gasAlert = normalized.gasPpm >= 300 || normalized.gasRaw === 1;
    }

    // PIR & IR if available
    if (raw.PIR !== undefined) normalized.pirMotion = Boolean(raw.PIR.value);
    if (raw.IR !== undefined) normalized.irObstacle = Boolean(raw.IR.value === 0);

    normalized.sourceNode = 'node_01';
  } 
  else if (sourcePath === 'sensor') {
    if (raw.temperature) normalized.temperature = parseFloat(raw.temperature.value ?? raw.temperature);
    if (raw.humidity) normalized.humidity = parseFloat(raw.humidity.value ?? raw.humidity);
    normalized.sourceNode = 'simulation_node';
  }

  normalized.timestamp = Date.now();
  return normalized;
}
