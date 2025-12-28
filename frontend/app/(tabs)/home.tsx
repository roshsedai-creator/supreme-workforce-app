import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

interface ExistingEntry {
  id: string;
  date: string;
  hours: number;
  status: string;
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  
  // Entry mode: 'daily' or 'fortnight'
  const [entryMode, setEntryMode] = useState<'daily' | 'fortnight'>('daily');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Daily entry form
  const [dailyDate, setDailyDate] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('09:00');
  const [dailyEndTime, setDailyEndTime] = useState('17:00');
  const [dailyBreak, setDailyBreak] = useState('30');
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  
  // Date picker modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'daily' | 'fortnight'>('daily');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // Fortnight entry form
  const [fortnightStartDate, setFortnightStartDate] = useState('');
  const [fortnightEntries, setFortnightEntries] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    break: string;
    existingId?: string;
    existingStatus?: string;
    existingHours?: number;
  }[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Fetch existing timesheets for date range
  const fetchExistingTimesheets = async (startDate: string, endDate: string) => {
    if (!user?.id) return [];
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`,
        { params: { employee_id: user.id } }
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
      return [];
    }
  };

  // Generate fortnight dates from start date and load existing entries
  const generateFortnightDates = async (startDate: string) => {
    setLoadingExisting(true);
    const entries = [];
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + 13);
    
    // Fetch existing timesheets
    const existingTimesheets = await fetchExistingTimesheets(
      startDate,
      `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    );
    
    // Create a map of existing entries by date
    const existingMap = new Map();
    existingTimesheets.forEach((ts: any) => {
      const tsDate = new Date(ts.clock_in);
      const dateKey = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}-${String(tsDate.getDate()).padStart(2, '0')}`;
      if (!existingMap.has(dateKey)) {
        existingMap.set(dateKey, ts);
      }
    });
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const existing = existingMap.get(dateStr);
      if (existing) {
        const clockIn = new Date(existing.clock_in);
        const clockOut = new Date(existing.clock_out);
        entries.push({
          date: dateStr,
          startTime: `${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`,
          endTime: `${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`,
          break: String(existing.break_minutes || 0),
          existingId: existing.id,
          existingStatus: existing.approval_status,
          existingHours: existing.total_hours,
        });
      } else {
        entries.push({ date: dateStr, startTime: '', endTime: '', break: '30' });
      }
    }
    
    setFortnightEntries(entries);
    setLoadingExisting(false);
  };

  // Open date picker
  const openDatePicker = (mode: 'daily' | 'fortnight') => {
    setDatePickerMode(mode);
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth());
    setShowDatePicker(true);
  };

  // Select date from picker
  const selectDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (datePickerMode === 'daily') {
      setDailyDate(dateStr);
    } else {
      setFortnightStartDate(dateStr);
      generateFortnightDates(dateStr);
    }
    setShowDatePicker(false);
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Open modal for entry
  const openEntryModal = (mode: 'daily' | 'fortnight') => {
    setEntryMode(mode);
    if (mode === 'daily') {
      setDailyDate(getTodayDate());
      setDailyStartTime('09:00');
      setDailyEndTime('17:00');
      setDailyBreak('30');
      setDailyNotes('');
      setDailyImage(null);
    } else {
      // Start of current fortnight (Monday)
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      const startDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      setFortnightStartDate(startDate);
      generateFortnightDates(startDate);
    }
    setShowEntryModal(true);
  };

  // Pick image from gallery or camera
  const pickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera/gallery access');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets[0].base64) {
        setDailyImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Submit daily timesheet
  const submitDailyTimesheet = async () => {
    if (!dailyDate || !dailyStartTime || !dailyEndTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`,
        {
          employee_id: user?.id,
          date: dailyDate,
          clock_in_time: dailyStartTime,
          clock_out_time: dailyEndTime,
          break_minutes: parseInt(dailyBreak) || 0,
          notes: dailyNotes,
          image: dailyImage,
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Timesheet submitted for approval');
        setShowEntryModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit timesheet');
    } finally {
      setLoading(false);
    }
  };

  // Submit fortnight timesheet
  const submitFortnightTimesheet = async () => {
    const newEntries = fortnightEntries.filter(e => 
      e.startTime && e.endTime && !e.existingId
    );
    
    if (newEntries.length === 0) {
      Alert.alert('Info', 'No new entries to submit. All days with times already have timesheets.');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      
      for (const entry of newEntries) {
        try {
          await axios.post(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`,
            {
              employee_id: user?.id,
              date: entry.date,
              clock_in_time: entry.startTime,
              clock_out_time: entry.endTime,
              break_minutes: parseInt(entry.break) || 0,
              notes: `Fortnight entry`,
            }
          );
          successCount++;
        } catch (err) {
          console.error(`Failed to submit entry for ${entry.date}:`, err);
        }
      }

      Alert.alert('Success', `${successCount} new timesheet(s) submitted for approval`);
      setShowEntryModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit timesheets');
    } finally {
      setLoading(false);
    }
  };

  // Update fortnight entry
  const updateFortnightEntry = (index: number, field: 'startTime' | 'endTime' | 'break', value: string) => {
    // Don't allow editing existing entries
    if (fortnightEntries[index].existingId) {
      Alert.alert('Cannot Edit', 'This entry already exists. Edit it from the Timesheets tab.');
      return;
    }
    
    const updated = [...fortnightEntries];
    updated[index][field] = value;
    setFortnightEntries(updated);
  };

  // Get day name from date
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.warning;
    }
  };

  // Month names
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.job_title || user?.role || 'Employee'}</Text>
            </View>
          </View>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color={colors.primary} />
          </View>
        </View>

        {/* Quick Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color={colors.primary} />
          <Text style={styles.infoText}>
            Submit your timesheets for supervisor approval. You can enter daily or fortnight hours.
          </Text>
        </View>

        {/* Entry Options */}
        <Text style={styles.sectionTitle}>Submit Timesheet</Text>
        
        <TouchableOpacity 
          style={styles.entryCard}
          onPress={() => openEntryModal('daily')}
          activeOpacity={0.7}
        >
          <View style={[styles.entryIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="today" size={28} color={colors.primary} />
          </View>
          <View style={styles.entryContent}>
            <Text style={styles.entryTitle}>Daily Entry</Text>
            <Text style={styles.entrySubtitle}>Enter hours for a single day</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.entryCard}
          onPress={() => openEntryModal('fortnight')}
          activeOpacity={0.7}
        >
          <View style={[styles.entryIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="calendar" size={28} color={colors.success} />
          </View>
          <View style={styles.entryContent}>
            <Text style={styles.entryTitle}>Fortnight Entry</Text>
            <Text style={styles.entrySubtitle}>Enter hours for 2 weeks at once</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
        </TouchableOpacity>

        {/* View Timesheets Link */}
        <TouchableOpacity style={styles.viewTimesheetsButton}>
          <Text style={styles.viewTimesheetsText}>View all timesheets in the Timesheets tab</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Entry Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {entryMode === 'daily' ? 'Daily Entry' : 'Fortnight Entry'}
            </Text>
            <TouchableOpacity 
              onPress={entryMode === 'daily' ? submitDailyTimesheet : submitFortnightTimesheet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {entryMode === 'daily' ? (
              /* Daily Entry Form */
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => openDatePicker('daily')}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.datePickerText}>
                      {dailyDate || 'Select date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Start Time *</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyStartTime}
                      onChangeText={setDailyStartTime}
                      placeholder="09:00"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>End Time *</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyEndTime}
                      onChangeText={setDailyEndTime}
                      placeholder="17:00"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Break (minutes)</Text>
                  <TextInput
                    style={styles.input}
                    value={dailyBreak}
                    onChangeText={setDailyBreak}
                    placeholder="30"
                    keyboardType="numeric"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={dailyNotes}
                    onChangeText={setDailyNotes}
                    placeholder="Add any notes..."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>

                {/* Image Upload */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Timesheet Photo (optional)</Text>
                  <View style={styles.imageButtons}>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={() => pickImage(true)}
                    >
                      <Ionicons name="camera" size={20} color={colors.primary} />
                      <Text style={styles.imageButtonText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={() => pickImage(false)}
                    >
                      <Ionicons name="images" size={20} color={colors.primary} />
                      <Text style={styles.imageButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  {dailyImage && (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: dailyImage }} style={styles.previewImage} />
                      <TouchableOpacity 
                        style={styles.removeImage}
                        onPress={() => setDailyImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              /* Fortnight Entry Form */
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Fortnight Start Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => openDatePicker('fortnight')}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.datePickerText}>
                      {fortnightStartDate || 'Select start date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fortnightInfo}>
                  Enter start and end times for each day. Existing entries are shown and cannot be edited here.
                </Text>

                {loadingExisting ? (
                  <View style={styles.loadingExisting}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading existing entries...</Text>
                  </View>
                ) : (
                  <>
                    {/* Column Headers */}
                    <View style={styles.fortnightHeader}>
                      <Text style={styles.headerDay}>Day</Text>
                      <Text style={styles.headerTime}>Start</Text>
                      <Text style={styles.headerTime}>End</Text>
                      <Text style={styles.headerBreak}>Break</Text>
                    </View>

                    {fortnightEntries.map((entry, index) => (
                      <View 
                        key={entry.date} 
                        style={[
                          styles.fortnightRow,
                          entry.existingId && styles.fortnightRowExisting
                        ]}
                      >
                        <View style={styles.fortnightDate}>
                          <Text style={styles.dayName}>{getDayName(entry.date)}</Text>
                          <Text style={styles.dateText}>{formatDisplayDate(entry.date)}</Text>
                        </View>
                        
                        {entry.existingId ? (
                          // Show existing entry info
                          <View style={styles.existingEntryInfo}>
                            <Text style={styles.existingTime}>
                              {entry.startTime} - {entry.endTime}
                            </Text>
                            <View style={[styles.existingStatus, { backgroundColor: getStatusColor(entry.existingStatus || 'pending') + '20' }]}>
                              <Text style={[styles.existingStatusText, { color: getStatusColor(entry.existingStatus || 'pending') }]}>
                                {entry.existingHours?.toFixed(1)}h • {entry.existingStatus}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          // Show input fields for new entry
                          <View style={styles.fortnightInputs}>
                            <TextInput
                              style={styles.timeInput}
                              value={entry.startTime}
                              onChangeText={(val) => updateFortnightEntry(index, 'startTime', val)}
                              placeholder="09:00"
                              placeholderTextColor={colors.gray[400]}
                            />
                            <TextInput
                              style={styles.timeInput}
                              value={entry.endTime}
                              onChangeText={(val) => updateFortnightEntry(index, 'endTime', val)}
                              placeholder="17:00"
                              placeholderTextColor={colors.gray[400]}
                            />
                            <TextInput
                              style={styles.breakInput}
                              value={entry.break}
                              onChangeText={(val) => updateFortnightEntry(index, 'break', val)}
                              placeholder="30"
                              keyboardType="numeric"
                              placeholderTextColor={colors.gray[400]}
                            />
                          </View>
                        )}
                      </View>
                    ))}

                    {/* Fortnight Summary */}
                    <View style={styles.fortnightSummary}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Existing entries:</Text>
                        <Text style={styles.summaryValue}>
                          {fortnightEntries.filter(e => e.existingId).length} days
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>New entries to submit:</Text>
                        <Text style={[styles.summaryValue, { color: colors.primary }]}>
                          {fortnightEntries.filter(e => e.startTime && e.endTime && !e.existingId).length} days
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContent}>
            {/* Month/Year Navigator */}
            <View style={styles.datePickerNav}>
              <TouchableOpacity onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                {monthNames[selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Empty cells for days before first of month */}
              {Array(getFirstDayOfMonth(selectedYear, selectedMonth)).fill(null).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarCell} />
              ))}
              
              {/* Days of month */}
              {Array(getDaysInMonth(selectedYear, selectedMonth)).fill(null).map((_, i) => {
                const day = i + 1;
                const isToday = 
                  day === new Date().getDate() && 
                  selectedMonth === new Date().getMonth() && 
                  selectedYear === new Date().getFullYear();
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calendarCell, isToday && styles.todayCell]}
                    onPress={() => selectDate(day)}
                  >
                    <Text style={[styles.calendarDay, isToday && styles.todayText]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={styles.datePickerCancel}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  avatarContainer: {
    marginLeft: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  entryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryContent: {
    flex: 1,
    marginLeft: 14,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  entrySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  viewTimesheetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    padding: 14,
    gap: 8,
  },
  viewTimesheetsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  cancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  // Fortnight styles
  fortnightInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingExisting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  fortnightHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: 8,
  },
  headerDay: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  headerTime: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  headerBreak: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fortnightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
  },
  fortnightRowExisting: {
    backgroundColor: colors.gray[100],
  },
  fortnightDate: {
    width: 50,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  fortnightInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  breakInput: {
    width: 50,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  existingEntryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  existingTime: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  existingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  existingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fortnightSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  // Date picker modal
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  datePickerContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  datePickerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  calendarDay: {
    fontSize: 15,
    color: colors.text.primary,
  },
  todayText: {
    color: colors.white,
    fontWeight: '600',
  },
  datePickerCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
