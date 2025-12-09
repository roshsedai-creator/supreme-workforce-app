import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { clockIn, clockOut, manageBreak, getTimesheets } from '../../utils/api';
import { colors } from '../../constants/colors';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentTimesheet, setCurrentTimesheet] = useState<any>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    requestLocationPermission();
    fetchCurrentTimesheet();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required to clock in/out.');
    }
  };

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      return loc;
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please enable location services.');
      return null;
    }
  };

  const fetchCurrentTimesheet = async () => {
    try {
      const timesheets = await getTimesheets(user?.id);
      const active = timesheets.find((ts: any) => !ts.clock_out);
      if (active) {
        setCurrentTimesheet(active);
        setOnBreak(active.break_start && !active.break_end);
      }
    } catch (error) {
      console.error('Failed to fetch timesheet:', error);
    }
  };

  const handleClockIn = async () => {
    if (!user?.site_id) {
      Alert.alert('Error', 'No site assigned. Please contact your supervisor.');
      return;
    }

    setLoading(true);
    const loc = await getLocation();
    if (!loc) {
      setLoading(false);
      return;
    }

    try {
      const response = await clockIn(
        user.id,
        user.site_id,
        loc.coords.latitude,
        loc.coords.longitude
      );
      setCurrentTimesheet(response.timesheet);
      Alert.alert('Success', 'Clocked in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    const loc = await getLocation();
    if (!loc) {
      setLoading(false);
      return;
    }

    try {
      await clockOut(currentTimesheet.id, loc.coords.latitude, loc.coords.longitude);
      setCurrentTimesheet(null);
      setOnBreak(false);
      Alert.alert('Success', 'Clocked out successfully!');
      // Refresh to make sure UI is updated
      await fetchCurrentTimesheet();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = async (action: 'start' | 'end') => {
    setLoading(true);
    try {
      const response = await manageBreak(currentTimesheet.id, action);
      setCurrentTimesheet(response.timesheet);
      setOnBreak(action === 'start');
      Alert.alert('Success', `Break ${action === 'start' ? 'started' : 'ended'}!`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to manage break');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.job_title}</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={currentTimesheet ? 'checkmark-circle' : 'close-circle'}
            size={32}
            color={currentTimesheet ? colors.success : colors.gray[400]}
          />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {currentTimesheet ? 'Currently Clocked In' : 'Not Clocked In'}
            </Text>
            {currentTimesheet && (
              <Text style={styles.statusTime}>
                Since {format(new Date(currentTimesheet.clock_in), 'h:mm a')}
              </Text>
            )}
          </View>
        </View>

        {currentTimesheet && onBreak && (
          <View style={styles.breakBanner}>
            <Ionicons name="cafe" size={20} color={colors.warning} />
            <Text style={styles.breakText}>On Break</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        {!currentTimesheet ? (
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleClockIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="log-in" size={24} color={colors.white} />
                <Text style={styles.primaryButtonText}>Clock In</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.buttonRow}>
              {!onBreak ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={() => handleBreak('start')}
                  disabled={loading}
                >
                  <Ionicons name="cafe" size={20} color={colors.warning} />
                  <Text style={styles.secondaryButtonText}>Start Break</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={() => handleBreak('end')}
                  disabled={loading}
                >
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                  <Text style={styles.secondaryButtonText}>End Break</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.dangerButton, loading && styles.buttonDisabled]}
              onPress={handleClockOut}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="log-out" size={24} color={colors.white} />
                  <Text style={styles.dangerButtonText}>Clock Out</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>GPS Verification</Text>
          <Text style={styles.infoText}>
            Your location is verified when clocking in and out to ensure you're at the assigned site.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusTime: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  breakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  breakText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  actionsCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: colors.gray[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
