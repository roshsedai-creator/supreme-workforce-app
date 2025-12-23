import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { clockIn, clockOut, manageBreak, getTimesheets } from '../../utils/api';
import { colors } from '../../constants/colors';
import { format } from 'date-fns';
import axios from 'axios';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentTimesheet, setCurrentTimesheet] = useState<any>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [siteData, setSiteData] = useState<any>(null);
  
  // Smart Dashboard data
  const [smartData, setSmartData] = useState<any>(null);
  
  // Manual timesheet modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualClockIn, setManualClockIn] = useState('09:00');
  const [manualClockOut, setManualClockOut] = useState('17:00');
  const [manualBreak, setManualBreak] = useState('30');
  const [manualNotes, setManualNotes] = useState('');

  // Update date when modal opens - use local timezone (Australian)
  const openManualModal = () => {
    // Get current date in local timezone (AEST/AEDT)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    console.log('Opening manual modal with date:', localDate);
    setManualDate(localDate);
    setManualClockIn('09:00');
    setManualClockOut('17:00');
    setManualBreak('30');
    setManualNotes('');
    setShowManualModal(true);
  };

  // Fetch smart dashboard data
  const fetchSmartDashboard = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/employee/smart-dashboard/${user.id}`
      );
      setSmartData(response.data);
    } catch (error) {
      console.log('Smart dashboard not available');
    }
  };

  useEffect(() => {
    requestLocationPermission();
    fetchCurrentTimesheet();
    fetchSiteData();
    fetchSmartDashboard();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required to clock in/out.');
    }
  };

  const getLocation = async () => {
    try {
      // Try to get last known location first (instant)
      let loc = await Location.getLastKnownPositionAsync({});
      
      // If no last known location, get current with low accuracy (faster)
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Faster than Balanced
        });
      }
      
      if (loc) {
        setLocation(loc);
        return loc;
      }
      
      throw new Error('Could not get location');
    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error', 
        'Could not get your location. Please enable GPS and try again.',
        [{ text: 'OK' }]
      );
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

  const handleSubmitManualTimesheet = async () => {
    console.log('=== SUBMIT BUTTON PRESSED ===');
    console.log('Manual Date:', manualDate);
    console.log('Clock In:', manualClockIn);
    console.log('Clock Out:', manualClockOut);
    
    if (!manualDate || !manualClockIn || !manualClockOut) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id || !user?.site_id) {
      Alert.alert('Error', 'User data missing. Please logout and login again.');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(manualClockIn) || !timeRegex.test(manualClockOut)) {
      Alert.alert('Error', 'Please use HH:MM format for times (e.g., 09:00, 17:30)');
      return;
    }

    setLoading(true);
    try {
      // FIXED: Send the date and time as local time strings directly
      // The backend will interpret these as the user's local time
      // Format: YYYY-MM-DDTHH:MM:SS (no timezone - treated as local)
      const clockInStr = `${manualDate}T${manualClockIn}:00`;
      const clockOutStr = `${manualDate}T${manualClockOut}:00`;

      // Simple validation
      const [inHour, inMin] = manualClockIn.split(':').map(Number);
      const [outHour, outMin] = manualClockOut.split(':').map(Number);
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;

      if (outMinutes <= inMinutes) {
        Alert.alert('Error', 'Clock out time must be after clock in time');
        setLoading(false);
        return;
      }

      console.log('Submitting manual timesheet with LOCAL times:', {
        employee_id: user.id,
        site_id: user.site_id,
        clock_in: clockInStr,
        clock_out: clockOutStr,
        break_minutes: parseInt(manualBreak) || 0,
      });

      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`, {
        employee_id: user.id,
        site_id: user.site_id,
        clock_in: clockInStr,
        clock_out: clockOutStr,
        break_minutes: parseInt(manualBreak) || 0,
        notes: manualNotes || 'Manual entry - forgot to clock in/out',
      });

      console.log('Manual timesheet response:', response.data);
      
      // Close modal and reset
      setShowManualModal(false);
      setManualNotes('');
      
      // Show success with details
      Alert.alert(
        '✅ Success!', 
        `Manual timesheet submitted!\n\nDate: ${manualDate}\nTime: ${manualClockIn} - ${manualClockOut}\n\nAwaiting supervisor approval.`
      );
      
      fetchCurrentTimesheet();
    } catch (error: any) {
      console.error('Manual timesheet error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit timesheet');
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

      {/* Smart Dashboard Section */}
      {smartData && (
        <View style={styles.smartDashboard}>
          {/* Weekly Stats Card */}
          <View style={styles.weeklyStatsCard}>
            <View style={styles.weeklyStatsHeader}>
              <Ionicons name="analytics" size={22} color={colors.primary} />
              <Text style={styles.weeklyStatsTitle}>This Week</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{smartData.this_week.hours_worked}h</Text>
                <Text style={styles.statLabel}>Hours</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="cash" size={20} color={colors.success} />
                </View>
                <Text style={styles.statValue}>${smartData.this_week.earnings_estimate}</Text>
                <Text style={styles.statLabel}>Est. Pay</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.gold + '15' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                </View>
                <Text style={styles.statValue}>{smartData.this_week.shifts_completed}</Text>
                <Text style={styles.statLabel}>Shifts</Text>
              </View>
            </View>
            
            {/* Overtime Warning */}
            {smartData.this_week.approaching_overtime && (
              <View style={styles.overtimeWarning}>
                <Ionicons name="warning" size={18} color={colors.warning} />
                <Text style={styles.overtimeText}>
                  Approaching overtime ({smartData.this_week.hours_worked}/38h)
                </Text>
              </View>
            )}
          </View>

          {/* Next Shift Card */}
          {smartData.next_shift && (
            <View style={styles.nextShiftCard}>
              <View style={styles.nextShiftHeader}>
                <View style={styles.nextShiftBadge}>
                  <Ionicons name="calendar" size={16} color={colors.white} />
                  <Text style={styles.nextShiftBadgeText}>Next Shift</Text>
                </View>
              </View>
              <View style={styles.nextShiftContent}>
                <Text style={styles.nextShiftDate}>{smartData.next_shift.date}</Text>
                <Text style={styles.nextShiftTime}>{smartData.next_shift.time}</Text>
                <View style={styles.nextShiftLocation}>
                  <Ionicons name="location" size={14} color={colors.text.secondary} />
                  <Text style={styles.nextShiftSite}>{smartData.next_shift.site}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Performance Stats */}
          {smartData.performance && (
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Ionicons name="trophy" size={20} color={colors.gold} />
                <Text style={styles.performanceTitle}>Your Performance</Text>
              </View>
              <View style={styles.performanceStats}>
                <View style={styles.perfStatItem}>
                  <Text style={styles.perfStatValue}>{smartData.performance.current_streak}</Text>
                  <Text style={styles.perfStatLabel}>Day Streak</Text>
                </View>
                <View style={styles.perfDivider} />
                <View style={styles.perfStatItem}>
                  <Text style={styles.perfStatValue}>{smartData.performance.total_shifts_30d}</Text>
                  <Text style={styles.perfStatLabel}>Shifts (30d)</Text>
                </View>
                <View style={styles.perfDivider} />
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: colors.success }]}>
                    {smartData.performance.punctuality_score}%
                  </Text>
                  <Text style={styles.perfStatLabel}>Punctuality</Text>
                </View>
              </View>
            </View>
          )}

          {/* Alerts Section */}
          {smartData.alerts && smartData.alerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {smartData.alerts.map((alert: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.alertCard,
                    alert.type === 'warning' && styles.alertWarning,
                    alert.type === 'info' && styles.alertInfo,
                  ]}
                >
                  <Ionicons 
                    name={alert.icon as any || 'information-circle'} 
                    size={20} 
                    color={alert.type === 'warning' ? colors.warning : colors.primary} 
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Manual Timesheet Button */}
      <TouchableOpacity
        style={styles.manualButton}
        onPress={openManualModal}
      >
        <Ionicons name="create-outline" size={24} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.manualButtonTitle}>Add Manual Timesheet</Text>
          <Text style={styles.manualButtonSubtitle}>Forgot to clock in? Submit manually</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
      </TouchableOpacity>

      {/* Manual Timesheet Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Timesheet Entry</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={manualDate}
                onChangeText={setManualDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.inputLabel}>Clock In Time</Text>
              <TextInput
                style={styles.input}
                value={manualClockIn}
                onChangeText={setManualClockIn}
                placeholder="HH:MM (e.g., 09:00)"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.inputLabel}>Clock Out Time</Text>
              <TextInput
                style={styles.input}
                value={manualClockOut}
                onChangeText={setManualClockOut}
                placeholder="HH:MM (e.g., 17:00)"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.inputLabel}>Break (minutes)</Text>
              <TextInput
                style={styles.input}
                value={manualBreak}
                onChangeText={setManualBreak}
                placeholder="30"
                keyboardType="numeric"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.inputLabel}>Reason/Notes</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={manualNotes}
                onChangeText={setManualNotes}
                placeholder="Why are you submitting manually?"
                placeholderTextColor={colors.gray[400]}
                multiline
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.warning} />
                <Text style={styles.infoBoxText}>
                  Manual entries require supervisor approval before they count towards your hours.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmitManualTimesheet}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={colors.white} />
                    <Text style={styles.submitButtonText}>Submit for Approval</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Manual timesheet styles
  manualButton: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  manualButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manualButtonSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '15',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Smart Dashboard Styles
  smartDashboard: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  weeklyStatsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  weeklyStatsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  overtimeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  overtimeText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  nextShiftCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextShiftHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nextShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  nextShiftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  nextShiftContent: {
    padding: 16,
    paddingTop: 12,
  },
  nextShiftDate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  nextShiftTime: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  nextShiftLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  nextShiftSite: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  performanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  perfStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  perfStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  perfStatLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  perfDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[200],
  },
  alertsContainer: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray[300],
  },
  alertWarning: {
    borderLeftColor: colors.warning,
    backgroundColor: colors.warning + '08',
  },
  alertInfo: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
