// Hazard Alert & Notification Service (Milestone 5)
import { DEFAULT_THRESHOLDS } from './config.js';

export class AlertService {
  constructor() {
    this.soundEnabled = true;
    this.audioCtx = null;
    this.activeAlerts = new Map();
    this.acknowledgedAlerts = new Set();
    this.audioInterval = null;
  }

  init() {
    console.log('🚨 AlertService initialized.');
    
    // Wire sound toggle button
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        soundToggleBtn.innerHTML = this.soundEnabled 
          ? '<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i>'
          : '<i data-lucide="volume-x" class="w-4 h-4 text-rose-400"></i>';
        if (window.lucide) window.lucide.createIcons();
        this.logEvent('SYS', `Audio alerts ${this.soundEnabled ? 'enabled' : 'muted'}.`);
      });
    }

    // Wire alert dismissal / acknowledgment button
    const dismissAlertBtn = document.getElementById('dismissAlertBtn');
    if (dismissAlertBtn) {
      dismissAlertBtn.addEventListener('click', () => {
        this.acknowledgeCurrentAlerts();
      });
    }
  }

  // Synthesize alarm sound via Web Audio API
  playAlarmChime() {
    if (!this.soundEnabled) return;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.3); // Drop to A4

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Evaluates telemetry against safety thresholds
  evaluateTelemetry(data) {
    const currentAlertKeys = [];

    // 1. Gas / Smoke Check
    if (data.gasAlert || data.gasPpm >= DEFAULT_THRESHOLDS.gasPpmWarning) {
      const isCritical = data.gasPpm >= DEFAULT_THRESHOLDS.gasPpmCritical;
      const key = 'GAS_HAZARD';
      currentAlertKeys.push(key);
      if (!this.activeAlerts.has(key)) {
        this.activeAlerts.set(key, {
          title: isCritical ? 'CRITICAL GAS / SMOKE HAZARD' : 'ELEVATED GAS WARNING',
          message: `Gas concentration is ${data.gasPpm} PPM (Exceeds threshold).`,
          level: isCritical ? 'critical' : 'warning'
        });
        this.logEvent('ALERT', `Gas spike detected: ${data.gasPpm} PPM!`, 'rose');
        this.triggerAlarm();
      }
    } else {
      this.activeAlerts.delete('GAS_HAZARD');
    }

    // 2. Temperature Spike Check
    if (data.temperature >= DEFAULT_THRESHOLDS.temperatureMaxC) {
      const key = 'HEAT_SPIKE';
      currentAlertKeys.push(key);
      if (!this.activeAlerts.has(key)) {
        this.activeAlerts.set(key, {
          title: 'HIGH TEMPERATURE SPIKE',
          message: `Ambient temperature reached ${data.temperature}°C.`,
          level: 'warning'
        });
        this.logEvent('WARN', `High heat warning: ${data.temperature}°C`, 'amber');
      }
    } else {
      this.activeAlerts.delete('HEAT_SPIKE');
    }

    // 3. Security Check (PIR Motion or IR Obstacle)
    if (data.pirMotion) {
      const key = 'MOTION_BREACH';
      currentAlertKeys.push(key);
      if (!this.activeAlerts.has(key)) {
        this.activeAlerts.set(key, {
          title: 'PERIMETER INTRUSION DETECTED',
          message: 'HC-SR501 PIR sensor triggered active motion.',
          level: 'critical'
        });
        this.logEvent('SEC', 'PIR Motion Sensor triggered!', 'rose');
        this.triggerAlarm();
      }
    } else {
      this.activeAlerts.delete('MOTION_BREACH');
    }

    this.renderAlertBanner();
  }

  triggerAlarm() {
    this.playAlarmChime();
  }

  acknowledgeCurrentAlerts() {
    for (const key of this.activeAlerts.keys()) {
      this.acknowledgedAlerts.add(key);
    }
    this.logEvent('ACK', 'Hazard alert acknowledged by operator.', 'sky');
    this.renderAlertBanner();
  }

  renderAlertBanner() {
    const banner = document.getElementById('hazardAlertBanner');
    const titleEl = document.getElementById('alertBannerTitle');
    const msgEl = document.getElementById('alertBannerMsg');

    if (!banner || !titleEl || !msgEl) return;

    // Filter out acknowledged alerts
    const unacknowledged = Array.from(this.activeAlerts.entries())
      .filter(([k]) => !this.acknowledgedAlerts.has(k));

    if (unacknowledged.length > 0) {
      const [_, alert] = unacknowledged[0];
      titleEl.textContent = alert.title;
      msgEl.textContent = alert.message;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // Appends a real-time event to the Audit Log Stream
  logEvent(tag, message, color = 'emerald') {
    const container = document.getElementById('eventLogContainer');
    const logCountEl = document.getElementById('logCount');
    if (!container) return;

    const time = new Date().toLocaleTimeString('en-GB');
    const colorClasses = {
      emerald: 'text-emerald-400',
      sky: 'text-sky-400',
      amber: 'text-amber-400',
      rose: 'text-rose-400'
    };

    const tagColor = colorClasses[color] || 'text-emerald-400';

    const div = document.createElement('div');
    div.className = 'p-2 rounded bg-dark-800/60 border border-slate-800/80 text-slate-300 flex items-start gap-2 animate-fadeIn';
    div.innerHTML = `
      <span class="text-[10px] text-slate-500">${time}</span>
      <span class="${tagColor} font-semibold">[${tag}]</span>
      <span class="text-slate-300">${message}</span>
    `;

    container.prepend(div);

    // Limit log count to 40 entries
    while (container.children.length > 40) {
      container.removeChild(container.lastChild);
    }

    if (logCountEl) {
      logCountEl.textContent = `${container.children.length} events logged`;
    }
  }
}

export const alertService = new AlertService();
