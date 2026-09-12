// Main UI Controller & Dashboard Orchestrator (Milestones 3 - 6)
import { firebaseService } from './firebase-service.js';
import { chartService } from './charts.js';
import { alertService } from './alerts.js';
import { NODES_METADATA } from './config.js';

class DashboardApp {
  constructor() {
    this.isFahrenheit = false;
    this.currentData = null;
    this.minTemp = Infinity;
    this.maxTemp = -Infinity;
    this.isDemoMode = false;
    this.demoInterval = null;
  }

  init() {
    console.log('🚀 Initializing Smart City Command Center...');

    // 1. Initialize subsystem services
    chartService.init();
    alertService.init();
    firebaseService.init();

    // 2. Register UI Event Listeners
    this.bindControls();

    // 3. Register Firebase Telemetry & Connection Listeners
    firebaseService.onConnectionChange((connected) => this.handleConnectionChange(connected));
    firebaseService.onData((telemetry) => this.renderTelemetry(telemetry));

    // 4. Initial default rendering
    this.renderTelemetry(firebaseService.getDefaultTelemetry());

    alertService.logEvent('SYS', 'Dashboard UI and services operational.', 'emerald');
  }

  bindControls() {
    // Node selector dropdown
    const nodeSelector = document.getElementById('nodeSelector');
    if (nodeSelector) {
      nodeSelector.addEventListener('change', (e) => {
        const nodeId = e.target.value;
        firebaseService.setActiveNode(nodeId);
        const nodeInfo = NODES_METADATA[nodeId] || { name: nodeId };
        alertService.logEvent('NET', `Switched active node to: ${nodeInfo.name}`, 'sky');
      });
    }

    // Temperature unit toggle (°C / °F)
    const tempUnitToggle = document.getElementById('tempUnitToggle');
    if (tempUnitToggle) {
      tempUnitToggle.addEventListener('click', () => {
        this.isFahrenheit = !this.isFahrenheit;
        tempUnitToggle.textContent = this.isFahrenheit ? '°F / °C' : '°C / °F';
        if (this.currentData) this.updateTemperatureDisplay(this.currentData.temperature);
      });
    }

    // Demo Mode toggle button
    const demoModeBtn = document.getElementById('demoModeBtn');
    if (demoModeBtn) {
      demoModeBtn.addEventListener('click', () => this.toggleDemoMode(demoModeBtn));
    }

    // Clear Audit Logs button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        const container = document.getElementById('eventLogContainer');
        if (container) {
          container.innerHTML = `
            <div class="p-2 rounded bg-dark-800/60 border border-slate-800/80 text-slate-400 flex items-start gap-2">
              <span class="text-[10px] text-slate-500">${new Date().toLocaleTimeString('en-GB')}</span>
              <span class="text-sky-400 font-semibold">[LOG]</span>
              <span>Audit log cleared.</span>
            </div>
          `;
          document.getElementById('logCount').textContent = '1 event logged';
        }
      });
    }
  }

  handleConnectionChange(connected) {
    const badge = document.getElementById('connectionBadge');
    const text = document.getElementById('connectionText');
    if (!badge || !text) return;

    if (connected) {
      badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium';
      badge.innerHTML = `
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Firebase Live</span>
      `;
      alertService.logEvent('NET', 'Connected to Firebase Realtime Database.', 'emerald');
    } else {
      badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium';
      badge.innerHTML = `
        <span class="h-2 w-2 rounded-full bg-rose-500"></span>
        <span>Cloud Disconnected</span>
      `;
      alertService.logEvent('NET', 'Firebase disconnected. Retrying...', 'rose');
    }
  }

  renderTelemetry(data) {
    this.currentData = data;

    // 1. Temperature
    if (data.temperature !== null && data.temperature !== undefined) {
      this.updateTemperatureDisplay(data.temperature);
      if (data.temperature < this.minTemp) this.minTemp = data.temperature;
      if (data.temperature > this.maxTemp) this.maxTemp = data.temperature;
      document.getElementById('tempMin').textContent = this.formatTemp(this.minTemp);
      document.getElementById('tempMax').textContent = this.formatTemp(this.maxTemp);
    }

    // 2. Humidity
    if (data.humidity !== null && data.humidity !== undefined) {
      const humVal = Math.round(data.humidity);
      document.getElementById('humidityValue').textContent = humVal;
      document.getElementById('humidityBar').style.width = `${Math.min(100, humVal)}%`;

      const pill = document.getElementById('humidityStatusPill');
      if (humVal < 30) {
        pill.textContent = 'Dry';
        pill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else if (humVal <= 65) {
        pill.textContent = 'Optimal';
        pill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else {
        pill.textContent = 'High Moisture';
        pill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
      }
    }

    // 3. Rain / Precipitation
    const isRaining = data.rainDetected;
    const rainStateText = document.getElementById('rainStateText');
    const rainStatusSummary = document.getElementById('rainStatusSummary');
    const rainRawValue = document.getElementById('rainRawValue');
    const rainIconContainer = document.getElementById('rainIconContainer');

    if (rainStateText && rainStatusSummary) {
      if (isRaining) {
        rainStateText.textContent = 'Precipitation Active';
        rainStatusSummary.textContent = 'Raining';
        rainStatusSummary.className = 'text-rose-400 font-bold';
        rainIconContainer.innerHTML = '<i data-lucide="cloud-rain" class="w-6 h-6 text-indigo-400"></i>';
        rainIconContainer.className = 'p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse';
      } else {
        rainStateText.textContent = 'Clear & Dry';
        rainStatusSummary.textContent = 'No Rain';
        rainStatusSummary.className = 'text-emerald-400 font-semibold';
        rainIconContainer.innerHTML = '<i data-lucide="sun" class="w-6 h-6 text-amber-400"></i>';
        rainIconContainer.className = 'p-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700';
      }
      if (rainRawValue) rainRawValue.textContent = `Raw Pin: ${data.rainRaw ?? 1}`;
    }

    // 4. Gas & Air Quality
    const gasVal = Math.round(data.gasPpm || data.gasRaw || 0);
    const gasValueEl = document.getElementById('gasValue');
    const gasPill = document.getElementById('gasStatusPill');
    const gasBar = document.getElementById('gasBar');

    if (gasValueEl && gasPill && gasBar) {
      gasValueEl.textContent = gasVal;
      const barPercent = Math.min(100, Math.max(10, (gasVal / 600) * 100));
      gasBar.style.width = `${barPercent}%`;

      if (gasVal < 250 && !data.gasAlert) {
        gasPill.textContent = 'Good (Safe)';
        gasPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        gasBar.className = 'bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700';
      } else if (gasVal < 400 && !data.gasAlert) {
        gasPill.textContent = 'Moderate';
        gasPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
        gasBar.className = 'bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700';
      } else {
        gasPill.textContent = 'Hazardous!';
        gasPill.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse';
        gasBar.className = 'bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-700';
      }
    }

    // 5. Security & Surveillance Matrix
    const pirBadge = document.getElementById('pirStatusBadge');
    if (pirBadge) {
      if (data.pirMotion) {
        pirBadge.textContent = 'MOTION ACTIVE';
        pirBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse';
      } else {
        pirBadge.textContent = 'Clear';
        pirBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    }

    const irBadge = document.getElementById('irStatusBadge');
    if (irBadge) {
      if (data.irObstacle) {
        irBadge.textContent = 'OBSTACLE DETECTED';
        irBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      } else {
        irBadge.textContent = 'Clear';
        irBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    }

    // 6. Water Quality Station (Auxiliary)
    if (data.water) {
      if (document.getElementById('waterPh')) document.getElementById('waterPh').innerHTML = `${data.water.ph} <span class="text-[10px] text-emerald-400 font-normal">Optimal</span>`;
      if (document.getElementById('waterTds')) document.getElementById('waterTds').innerHTML = `${data.water.tds} <span class="text-[10px] text-slate-400 font-normal">ppm</span>`;
      if (document.getElementById('waterTurbidity')) document.getElementById('waterTurbidity').innerHTML = `${data.water.turbidity} <span class="text-[10px] text-slate-400 font-normal">NTU</span>`;
      if (document.getElementById('waterDo')) document.getElementById('waterDo').innerHTML = `${data.water.do} <span class="text-[10px] text-slate-400 font-normal">mg/L</span>`;
    }

    // 7. Weather & Wind Station (Auxiliary)
    if (data.weather) {
      if (document.getElementById('windSpeed')) document.getElementById('windSpeed').innerHTML = `${data.weather.windSpeed} <span class="text-[10px] text-slate-400 font-normal">km/h</span>`;
      if (document.getElementById('windDir')) document.getElementById('windDir').innerHTML = `${data.weather.windDir} <span class="text-[10px] text-slate-400 font-normal">(68°)</span>`;
      if (document.getElementById('ambientLux')) document.getElementById('ambientLux').innerHTML = `${data.weather.lux} <span class="text-[10px] text-slate-400 font-normal">Lux</span>`;
      if (document.getElementById('airPressure')) document.getElementById('airPressure').innerHTML = `${data.weather.pressure} <span class="text-[10px] text-slate-400 font-normal">hPa</span>`;
    }

    // 8. Update Time-Series Chart
    if (data.temperature !== null && data.humidity !== null) {
      chartService.updateData(data.temperature, data.humidity, data.timestamp);
    }

    // 9. Evaluate Thresholds & Trigger Safety Alerts
    alertService.evaluateTelemetry(data);

    // Refresh Lucide Icons on dynamic DOM nodes
    if (window.lucide) window.lucide.createIcons();
  }

  updateTemperatureDisplay(tempC) {
    const valEl = document.getElementById('tempValue');
    const pillEl = document.getElementById('tempStatusPill');
    const dewEl = document.getElementById('tempDew');

    const displayVal = this.isFahrenheit ? (tempC * 9 / 5 + 32).toFixed(1) : tempC.toFixed(1);
    if (valEl) valEl.textContent = displayVal;

    if (pillEl) {
      if (tempC >= 38) {
        pillEl.textContent = 'Heat Warning';
        pillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse';
      } else if (tempC <= 10) {
        pillEl.textContent = 'Cold';
        pillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20';
      } else {
        pillEl.textContent = 'Normal';
        pillEl.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    }

    // Estimated dewpoint: T - ((100 - RH)/5)
    if (dewEl && this.currentData?.humidity) {
      const dew = (tempC - ((100 - this.currentData.humidity) / 5)).toFixed(1);
      dewEl.textContent = `Dew: ${this.isFahrenheit ? (dew * 9 / 5 + 32).toFixed(1) + '°F' : dew + '°C'}`;
    }
  }

  formatTemp(tempC) {
    if (tempC === Infinity || tempC === -Infinity) return '--';
    return this.isFahrenheit ? (tempC * 9 / 5 + 32).toFixed(0) : tempC.toFixed(0);
  }

  // Demo Feed Simulator (Milestone 6)
  toggleDemoMode(btn) {
    this.isDemoMode = !this.isDemoMode;

    if (this.isDemoMode) {
      btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 transition';
      btn.innerHTML = '<i data-lucide="square" class="w-3.5 h-3.5 text-emerald-400"></i><span>Simulating</span>';
      alertService.logEvent('SIM', 'Demo Simulation Feed STARTED.', 'emerald');

      let tick = 0;
      this.demoInterval = setInterval(() => {
        tick++;
        // Create realistic fluctuating telemetry
        const mockData = {
          temperature: +(27 + Math.sin(tick * 0.4) * 4 + (Math.random() * 0.8 - 0.4)).toFixed(1),
          humidity: +(60 + Math.cos(tick * 0.3) * 12 + (Math.random() * 2 - 1)).toFixed(1),
          rainDetected: (tick % 15 === 0 || tick % 15 === 1), // Periodic rain trigger
          rainRaw: (tick % 15 === 0 || tick % 15 === 1) ? 0 : 1,
          gasPpm: +(120 + Math.abs(Math.sin(tick * 0.2)) * 180 + (tick % 20 === 0 ? 250 : 0)).toFixed(0),
          gasRaw: 140,
          gasAlert: (tick % 20 === 0),
          pirMotion: (tick % 8 === 0), // Periodic motion trigger
          irObstacle: (tick % 12 === 0),
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

        this.renderTelemetry(mockData);
      }, 3000);

    } else {
      btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 border border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:text-white transition';
      btn.innerHTML = '<i data-lucide="play" class="w-3.5 h-3.5 text-amber-400"></i><span>Demo Feed</span>';
      clearInterval(this.demoInterval);
      alertService.logEvent('SIM', 'Demo Simulation Feed STOPPED.', 'amber');
    }

    if (window.lucide) window.lucide.createIcons();
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DashboardApp();
  app.init();
});
