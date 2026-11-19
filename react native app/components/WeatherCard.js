import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkTheme } from '../constants/Colors';

export default function WeatherCard({ cityWeather, weather, theme = DarkTheme, isDark = true }) {
  const location = cityWeather?.location || 'Anand, Gujarat, India';
  const temp = cityWeather?.temperature ?? 32.0;
  const feelsLike = cityWeather?.feelsLike ?? 31.0;
  const condition = cityWeather?.condition || 'Sunny';
  const windSpeed = cityWeather?.windSpeed ?? weather?.windSpeed ?? 7;
  const windDir = cityWeather?.windDirection ?? weather?.windDir ?? 'ENE';
  const pressure = cityWeather?.pressure ?? weather?.pressure ?? 1014;
  const humidity = cityWeather?.humidity ?? 30;
  const uvIndex = cityWeather?.uvIndex ?? 5;
  const visibility = cityWeather?.visibility ?? 10;
  const rainStatus = cityWeather?.rainStatus || '0.0 mm (No Active Rain)';
  const rainProb = cityWeather?.rainProbability ?? 15;
  const cloudCover = cityWeather?.cloudCover ?? 0;

  const getWeatherIcon = (cond) => {
    const c = String(cond).toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'weather-rainy';
    if (c.includes('cloud') || c.includes('overcast')) return 'weather-cloudy';
    if (c.includes('storm') || c.includes('thunder')) return 'weather-lightning';
    if (c.includes('snow')) return 'weather-snowy';
    if (c.includes('fog') || c.includes('mist')) return 'weather-fog';
    return 'weather-sunny';
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.card, 
        borderColor: theme.cardBorder 
      }
    ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[
          styles.headerIcon,
          {
            backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.25)'
          }
        ]}>
          <MaterialCommunityIcons name={getWeatherIcon(condition)} size={18} color={theme.brand.sky} />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{location}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>Live Meteorological Telemetry</Text>
        </View>
        <View style={[
          styles.liveBadge,
          {
            backgroundColor: theme.status.successBg,
            borderColor: theme.status.successBorder
          }
        ]}>
          <View style={[styles.pulseDot, { backgroundColor: theme.status.success }]} />
          <Text style={[styles.liveBadgeText, { color: theme.status.success }]}>Live</Text>
        </View>
      </View>

      {/* Primary Highlights: Condition & Temperature */}
      <View style={styles.highlightRow}>
        <View style={styles.tempBlock}>
          <Text style={[styles.conditionText, { color: theme.brand.sky }]}>{condition}</Text>
          <View style={styles.tempValueRow}>
            <Text style={[styles.tempValue, { color: theme.text.primary }]}>
              {typeof temp === 'number' ? temp.toFixed(1) : temp}
            </Text>
            <Text style={[styles.tempUnit, { color: theme.text.secondary }]}>°C</Text>
          </View>
          <Text style={[styles.feelsLikeText, { color: theme.text.muted }]}>
            Feels like {typeof feelsLike === 'number' ? feelsLike.toFixed(1) : feelsLike}°C
          </Text>
        </View>

        <View style={styles.rainPillBlock}>
          <View style={[
            styles.rainBadge,
            {
              backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.12)',
              borderColor: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.25)'
            }
          ]}>
            <MaterialCommunityIcons name="weather-rainy" size={14} color="#06b6d4" />
            <Text style={styles.rainBadgeText}>{rainProb}% Rain</Text>
          </View>
          <Text style={[styles.rainSubText, { color: theme.text.muted }]} numberOfLines={1}>{rainStatus}</Text>
        </View>
      </View>

      {/* Grid of Meteorological Attributes */}
      <View style={styles.grid}>
        {/* Wind Speed & Direction */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>Wind Flow</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: theme.text.primary }]}>{windSpeed}</Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>km/h</Text>
            <View style={[styles.dirTag, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.1)' }]}>
              <Text style={[styles.dirTagText, { color: theme.brand.sky }]}>{windDir}</Text>
            </View>
          </View>
        </View>

        {/* Humidity */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>Relative Humidity</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: theme.text.primary }]}>{humidity}</Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>%</Text>
          </View>
        </View>

        {/* Atmospheric Pressure */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>Barometric Pressure</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: theme.text.primary }]}>{pressure}</Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>hPa</Text>
          </View>
        </View>

        {/* UV Index */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>UV Index</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: uvIndex > 7 ? '#ef4444' : (uvIndex > 4 ? '#f59e0b' : '#10b981') }]}>
              {uvIndex}
            </Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>
              {uvIndex > 7 ? 'High' : (uvIndex > 4 ? 'Moderate' : 'Low')}
            </Text>
          </View>
        </View>

        {/* Cloud Cover */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>Cloud Coverage</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: theme.text.primary }]}>{cloudCover}</Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>%</Text>
          </View>
        </View>

        {/* Visibility */}
        <View style={[styles.gridItem, { backgroundColor: theme.subtle, borderColor: theme.cardBorder }]}>
          <Text style={[styles.itemLabel, { color: theme.text.secondary }]}>Sight Distance</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.itemValue, { color: theme.text.primary }]}>{visibility}</Text>
            <Text style={[styles.itemUnit, { color: theme.text.muted }]}>km</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  titleWrapper: {
    flex: 1
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 1
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '700'
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  tempBlock: {
    flex: 1
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  tempValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  tempValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1
  },
  tempUnit: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2
  },
  feelsLikeText: {
    fontSize: 10,
    marginTop: 2
  },
  rainPillBlock: {
    alignItems: 'flex-end',
    gap: 4
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4
  },
  rainBadgeText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '700'
  },
  rainSubText: {
    fontSize: 9,
    maxWidth: 120
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  gridItem: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '800'
  },
  itemUnit: {
    fontSize: 10
  },
  dirTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4
  },
  dirTagText: {
    fontSize: 9,
    fontWeight: '700'
  }
});
