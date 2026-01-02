
/**
 * Server Health Indicator
 * 
 * Visual component that displays the current health status of the Expo server
 * and Metro bundler connection. Only visible in development mode.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useServerHealth } from '@/utils/expoServerHealth';
import { metroConnectionGuard } from '@/utils/metroConnectionGuard';
import { IconSymbol } from '@/components/IconSymbol';

export function ServerHealthIndicator() {
  const healthStatus = useServerHealth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [metroStatus, setMetroStatus] = useState(metroConnectionGuard.getStatus());
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Update Metro status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetroStatus(metroConnectionGuard.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  const getStatusColor = () => {
    if (!healthStatus.isHealthy) return '#EF4444'; // Red
    if (metroStatus.isRecovering) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  const getStatusIcon = () => {
    if (!healthStatus.isHealthy) return 'error';
    if (metroStatus.isRecovering) return 'warning';
    return 'check-circle';
  };

  const getStatusText = () => {
    if (!healthStatus.isHealthy) return 'Disconnected';
    if (metroStatus.isRecovering) return 'Reconnecting';
    return 'Connected';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[styles.indicator, { backgroundColor: getStatusColor() }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <IconSymbol
          ios_icon_name="wifi"
          android_material_icon_name={getStatusIcon()}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network:</Text>
            <Text style={styles.detailValue}>
              {healthStatus.networkState?.type || 'Unknown'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Internet:</Text>
            <Text style={styles.detailValue}>
              {healthStatus.networkState?.isInternetReachable ? 'Yes' : 'No'}
            </Text>
          </View>

          {metroStatus.connectionAttempts > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Retries:</Text>
              <Text style={styles.detailValue}>
                {metroStatus.connectionAttempts}/{metroStatus.maxRetries}
              </Text>
            </View>
          )}

          {healthStatus.errors.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Errors:</Text>
              <Text style={[styles.detailValue, styles.errorText]}>
                {healthStatus.errors[healthStatus.errors.length - 1]}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Check:</Text>
            <Text style={styles.detailValue}>
              {new Date(healthStatus.lastCheck).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    right: 16,
    zIndex: 9999,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    minWidth: 200,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
  },
});
