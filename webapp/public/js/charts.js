// Chart.js Telemetry Time-Series Service (Milestone 4)
import { DEFAULT_THRESHOLDS } from './config.js';

export class ChartService {
  constructor() {
    this.chart = null;
    this.maxPoints = DEFAULT_THRESHOLDS.maxChartPoints || 25;
    this.labels = [];
    this.tempData = [];
    this.humidityData = [];
  }

  init() {
    const ctx = document.getElementById('climateChart');
    if (!ctx) {
      console.warn('Canvas #climateChart not found.');
      return;
    }

    // Set initial dummy history points to establish clean visual baseline
    const now = Date.now();
    for (let i = 10; i >= 1; i--) {
      const t = new Date(now - i * 5000);
      this.labels.push(t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      this.tempData.push(26 + Math.sin(i) * 1.5);
      this.humidityData.push(55 + Math.cos(i) * 4);
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: this.tempData,
            borderColor: '#f43f5e', // Rose 500
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f43f5e',
            tension: 0.35,
            fill: true,
            yAxisID: 'yTemp'
          },
          {
            label: 'Humidity (%)',
            data: this.humidityData,
            borderColor: '#38bdf8', // Sky 400
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#38bdf8',
            tension: 0.35,
            fill: true,
            yAxisID: 'yHumidity'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false // Using custom HTML legend in header
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#e2e8f0',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono' },
              maxTicksLimit: 7
            }
          },
          yTemp: {
            type: 'linear',
            position: 'left',
            min: 15,
            max: 50,
            grid: {
              color: 'rgba(244, 63, 94, 0.08)',
              drawBorder: false
            },
            ticks: {
              color: '#f43f5e',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${v}°C`
            }
          },
          yHumidity: {
            type: 'linear',
            position: 'right',
            min: 20,
            max: 100,
            grid: {
              drawOnChartArea: false, // Avoid overlapping grid lines
              drawBorder: false
            },
            ticks: {
              color: '#38bdf8',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });

    console.log('📈 ChartService initialized with rolling buffer.');
  }

  // Push new telemetry sample into rolling chart
  updateData(temperature, humidity, timestamp = Date.now()) {
    if (!this.chart) return;

    const timeLabel = new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Add new data
    this.labels.push(timeLabel);
    this.tempData.push(temperature);
    this.humidityData.push(humidity);

    // Keep within maxPoints limit
    if (this.labels.length > this.maxPoints) {
      this.labels.shift();
      this.tempData.shift();
      this.humidityData.shift();
    }

    this.chart.update('none'); // Update without full redraw animation for smooth stream
  }
}

export const chartService = new ChartService();
