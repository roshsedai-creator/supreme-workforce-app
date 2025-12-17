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
  const [siteData, setSiteData] = useState<any>(null);

  useEffect(() => {
    requestLocationPermission();
    fetchCurrentTimesheet();
    fetchSiteData();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required to clock in/out.');
    }
  };

  const getLocation = async () => {
    try {
      // Add timeout to prevent infinite waiting for GPS
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), 15000);
      });
      
      // Race between location and timeout
      const loc = await Promise.race([locationPromise, timeoutPromise]) as any;
      setLocation(loc);
      return loc;
    } catch (error: any) {
      console.error('Location error:', error);
      
      // Provide helpful error message
      if (error.message === 'Location timeout') {
        Alert.alert(
          'Location Timeout', 
          'Could not get your location. Please ensure GPS is enabled and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Error', 
          'Failed to get location. Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
      }
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

  const fetchSiteData = async () => {
    if (!user?.site_id) return;
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites/${user.site_id}`);
      const data = await response.json();
      setSiteData(data);
    } catch (error) {
      console.error('Failed to fetch site data:', error);
    }
  };

  const handleClockIn = async () => {
    if (!user?.site_id) {
      Alert.alert(
        'No Site Assigned', 
        'You are not assigned to a work site yet. Please contact your supervisor or admin to assign you to a site before clocking in.',
        [{ text: 'OK' }]
      );
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
      
      // Fetch site data to show address
      await fetchSiteData();
      
      // Show geo-fence warning if out of bounds
      if (response.geo_fence_warning) {
        Alert.alert(
          '⚠️ Geo-fence Warning',
          `You are ${response.distance_meters}m from the site (allowed: ${response.allowed_radius}m). This clock-in has been flagged for supervisor review.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Clocked in successfully!');
      }
      
      await fetchCurrentTimesheet();
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

      {/* Work Location Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationCardHeader}>
          <Ionicons name="business" size={24} color={colors.primary} />
          <Text style={styles.locationCardTitle}>Work Location</Text>
        </View>
        
        {siteData ? (
          <View style={styles.siteDetailsBox}>
            <View style={styles.siteDetailRow}>
              <Ionicons name="pin" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.siteName}>{siteData.name}</Text>
                <Text style={styles.siteAddressLarge}>{siteData.address}</Text>
              </View>
            </View>
            
            {location && (
              <View style={styles.gpsBox}>
                <Ionicons name="locate" size={16} color={colors.success} />
                <Text style={styles.gpsText}>
                  Your GPS: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading location...</Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Your location is verified when clocking in/out to ensure you&apos;re within 100m of the assigned site.
        </Text>
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
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
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
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.success + '20',
    borderRadius: 6,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  siteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  locationCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  locationCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  siteDetailsBox: {
    gap: 12,
  },
  siteDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  siteAddressLarge: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  gpsText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
