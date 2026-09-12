// Alert Evaluator & Incident Management

import { DEFAULT_THRESHOLDS } from '../constants/Config';

export function evaluateTelemetryAlerts(data, activeAlerts, acknowledgedKeys) {
  const newAlerts = new Map(activeAlerts);

  // 1. Gas / Smoke Check
  if (data.gasAlert || data.gasPpm >= DEFAULT_THRESHOLDS.gasPpmWarning) {
    const isCritical = data.gasPpm >= DEFAULT_THRESHOLDS.gasPpmCritical;
    const key = 'GAS_HAZARD';
    newAlerts.set(key, {
      id: key,
      title: isCritical ? 'CRITICAL GAS SPIKE' : 'ELEVATED GAS WARNING',
      message: `Gas concentration reached ${data.gasPpm} PPM.`,
      severity: isCritical ? 'critical' : 'warning',
      timestamp: Date.now()
    });
  } else {
    newAlerts.delete('GAS_HAZARD');
  }

  // 2. High Temperature Spike
  if (data.temperature >= DEFAULT_THRESHOLDS.temperatureMaxC) {
    const key = 'HEAT_SPIKE';
    newAlerts.set(key, {
      id: key,
      title: 'HIGH TEMPERATURE SPIKE',
      message: `Ambient heat reached ${data.temperature}°C.`,
      severity: 'warning',
      timestamp: Date.now()
    });
  } else {
    newAlerts.delete('HEAT_SPIKE');
  }

  // 3. Motion / Intrusion
  if (data.pirMotion) {
    const key = 'MOTION_BREACH';
    newAlerts.set(key, {
      id: key,
      title: 'PERIMETER INTRUSION DETECTED',
      message: 'HC-SR501 PIR sensor triggered active movement.',
      severity: 'critical',
      timestamp: Date.now()
    });
  } else {
    newAlerts.delete('MOTION_BREACH');
  }

  // Get active unacknowledged alert for banner display
  const unacknowledged = Array.from(newAlerts.values())
    .filter(alert => !acknowledgedKeys.has(alert.id));

  return {
    allAlerts: newAlerts,
    activeBannerAlert: unacknowledged.length > 0 ? unacknowledged[0] : null
  };
}
