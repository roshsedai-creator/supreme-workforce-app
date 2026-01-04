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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Smart time formatter - handles various input formats
// Examples: "9" -> "09:00", "11" -> "11:00", "930" -> "09:30", "1120" -> "11:20", "11:20" -> "11:20"
const formatTimeInput = (value: string): string => {
  // Remove everything except numbers and colon
  const cleaned = value.replace(/[^0-9:]/g, '');
  
  // If already has colon, just clean it up
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const hours = parts[0].substring(0, 2);
    const mins = parts[1] ? parts[1].substring(0, 2) : '';
    if (mins) {
      return `${hours.padStart(2, '0')}:${mins.padStart(2, '0')}`;
    }
    return `${hours}:${mins}`;
  }
  
  // Handle pure numbers
  const digits = cleaned.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits; // User is still typing
  if (digits.length === 2) {
    // Could be hours only: "09", "11", "23"
    const num = parseInt(digits);
    if (num <= 23) return digits; // Still typing, could add more
    return `0${digits[0]}:${digits[1]}0`; // Invalid hour, treat as H:M0
  }
  if (digits.length === 3) {
    // "930" -> "09:30", "123" -> "12:30" or "01:23"
    const firstTwo = parseInt(digits.substring(0, 2));
    if (firstTwo <= 23) {
      // First two are valid hours
      return `${digits.substring(0, 2)}:${digits[2]}`;
    } else {
      // First digit is hour, rest is minutes
      return `0${digits[0]}:${digits.substring(1, 3)}`;
    }
  }
  if (digits.length >= 4) {
    // "1120" -> "11:20", "0930" -> "09:30"
    const hours = digits.substring(0, 2);
    const mins = digits.substring(2, 4);
    const hoursNum = parseInt(hours);
    const minsNum = parseInt(mins);
    
    // Validate hours (0-23) and minutes (0-59)
    if (hoursNum > 23) {
      return `0${digits[0]}:${digits.substring(1, 3)}`;
    }
    if (minsNum > 59) {
      return `${hours}:59`;
    }
    return `${hours}:${mins}`;
  }
  
  return cleaned;
};

// Auto-complete time on blur (when user finishes typing)
const completeTime = (value: string): string => {
  if (!value) return '';
  
  const cleaned = value.replace(/[^0-9:]/g, '');
  
  // Already formatted
  if (cleaned.includes(':') && cleaned.length === 5) {
    return cleaned;
  }
  
  const digits = cleaned.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length === 1) return `0${digits}:00`; // "9" -> "09:00"
  if (digits.length === 2) return `${digits.padStart(2, '0')}:00`; // "11" -> "11:00"
  if (digits.length === 3) {
    const firstTwo = parseInt(digits.substring(0, 2));
    if (firstTwo <= 23) {
      return `${digits.substring(0, 2)}:${digits[2]}0`; // "113" -> "11:30"
    }
    return `0${digits[0]}:${digits.substring(1, 3)}`; // "930" -> "09:30"
  }
  if (digits.length >= 4) {
    return `${digits.substring(0, 2)}:${digits.substring(2, 4)}`;
  }
  
  return value;
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [entryMode, setEntryMode] = useState<'daily' | 'fortnight'>('daily');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Daily entry
  const [dailyDate, setDailyDate] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('09:00');
  const [dailyEndTime, setDailyEndTime] = useState('17:00');
  const [dailyBreak, setDailyBreak] = useState('30');
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'daily' | 'fortnight'>('daily');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // Fortnight
  const [fortnightStartDate, setFortnightStartDate] = useState('');
  const [fortnightEntries, setFortnightEntries] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const fetchExistingTimesheets = async () => {
    if (!user?.id) return [];
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`,
        { params: { employee_id: user.id } }
      );
      return response.data || [];
    } catch (error) {
      return [];
    }
  };

  const generateFortnightDates = async (startDate: string) => {
    setLoadingExisting(true);
    const entries = [];
    const start = new Date(startDate);
    const existingTimesheets = await fetchExistingTimesheets();
    
    const existingMap = new Map();
    existingTimesheets.forEach((ts: any) => {
      const tsDate = new Date(ts.clock_in);
      const dateKey = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}-${String(tsDate.getDate()).padStart(2, '0')}`;
      if (!existingMap.has(dateKey)) existingMap.set(dateKey, ts);
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

  const openDatePicker = (mode: 'daily' | 'fortnight') => {
    setDatePickerMode(mode);
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth());
    setShowDatePicker(true);
  };

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

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

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

  // Web file picker helper
  const pickImageWeb = (callback: (base64: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          callback(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickImage = async (useCamera: boolean) => {
    // Web browser file picker
    if (Platform.OS === 'web') {
      pickImageWeb((base64) => setDailyImage(base64));
      return;
    }
    
    // Mobile image picker
    try {
      const permission = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera/gallery access');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true });

      if (!result.canceled && result.assets[0].base64) {
        setDailyImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const submitDailyTimesheet = async () => {
    if (!dailyDate || !dailyStartTime || !dailyEndTime) {
      Alert.alert('Missing Fields', 'Please fill in date and times');
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
        Alert.alert('Success', 'Timesheet submitted');
        setShowEntryModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const submitFortnightTimesheet = async () => {
    const newEntries = fortnightEntries.filter(e => e.startTime && e.endTime && !e.existingId);
    
    if (newEntries.length === 0) {
      Alert.alert('Info', 'No new entries to submit');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      for (const entry of newEntries) {
        try {
          await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`, {
            employee_id: user?.id,
            date: entry.date,
            clock_in_time: entry.startTime,
            clock_out_time: entry.endTime,
            break_minutes: parseInt(entry.break) || 0,
            notes: 'Fortnight entry',
          });
          successCount++;
        } catch (err) {}
      }
      Alert.alert('Success', `${successCount} timesheet(s) submitted`);
      setShowEntryModal(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit timesheets');
    } finally {
      setLoading(false);
    }
  };

  const updateFortnightEntry = (index: number, field: string, value: string) => {
    if (fortnightEntries[index].existingId) {
      Alert.alert('Cannot Edit', 'Edit from Timesheets tab');
      return;
    }
    const updated = [...fortnightEntries];
    updated[index][field] = value;
    setFortnightEntries(updated);
  };

  const getDayName = (dateStr: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(dateStr).getDay()];
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</Text>
              <Text style={styles.userName}>{user?.first_name}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="briefcase" size={12} color="#6366f1" />
                <Text style={styles.roleText}>{user?.job_title || user?.role || 'Employee'}</Text>
              </View>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="time" size={20} color="#6366f1" />
            </View>
            <Text style={styles.statValue}>This Week</Text>
            <Text style={styles.statLabel}>Submit Hours</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>Pending</Text>
            <Text style={styles.statLabel}>Approvals</Text>
          </View>
        </View>

        {/* Action Cards */}
        <Text style={styles.sectionTitle}>Submit Timesheet</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('daily')} activeOpacity={0.7}>
          <LinearGradient colors={['#eef2ff', '#e0e7ff']} style={styles.actionIconBg}>
            <Ionicons name="today" size={26} color="#6366f1" />
          </LinearGradient>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Single Day Entry</Text>
            <Text style={styles.actionSubtitle}>Submit hours for one day</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('fortnight')} activeOpacity={0.7}>
          <LinearGradient colors={['#dcfce7', '#bbf7d0']} style={styles.actionIconBg}>
            <Ionicons name="calendar" size={26} color="#10b981" />
          </LinearGradient>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Fortnight Entry</Text>
            <Text style={styles.actionSubtitle}>Submit 2 weeks at once</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.tipText}>Tip: Use fortnight entry to save time by submitting multiple days at once.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Entry Modal */}
      <Modal visible={showEntryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEntryModal(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{entryMode === 'daily' ? 'Daily Entry' : 'Fortnight Entry'}</Text>
            <TouchableOpacity onPress={entryMode === 'daily' ? submitDailyTimesheet : submitFortnightTimesheet} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {entryMode === 'daily' ? (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('daily')}>
                    <Ionicons name="calendar" size={18} color="#6366f1" />
                    <Text style={styles.dateButtonText}>{dailyDate || 'Select date'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeGroup}>
                    <Text style={styles.label}>Start</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={dailyStartTime}
                      onChangeText={(val) => setDailyStartTime(formatTimeInput(val))}
                      onBlur={() => setDailyStartTime(completeTime(dailyStartTime))}
                      placeholder="0900"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                      maxLength={5}
                    />
                  </View>
                  <View style={styles.timeGroup}>
                    <Text style={styles.label}>End</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={dailyEndTime}
                      onChangeText={(val) => setDailyEndTime(formatTimeInput(val))}
                      onBlur={() => setDailyEndTime(completeTime(dailyEndTime))}
                      placeholder="1700"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                      maxLength={5}
                    />
                  </View>
                  <View style={styles.breakGroup}>
                    <Text style={styles.label}>Break</Text>
                    <TextInput
                      style={styles.breakInput}
                      value={dailyBreak}
                      onChangeText={setDailyBreak}
                      placeholder="30"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={dailyNotes}
                    onChangeText={setDailyNotes}
                    placeholder="Add notes..."
                    multiline
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Photo (optional)</Text>
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera" size={18} color="#6366f1" />
                      <Text style={styles.photoBtnText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images" size={18} color="#6366f1" />
                      <Text style={styles.photoBtnText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  {dailyImage && (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: dailyImage }} style={styles.previewImg} />
                      <TouchableOpacity style={styles.removeImg} onPress={() => setDailyImage(null)}>
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Fortnight Start Date</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fortnight')}>
                    <Ionicons name="calendar" size={18} color="#6366f1" />
                    <Text style={styles.dateButtonText}>{fortnightStartDate || 'Select start date'}</Text>
                  </TouchableOpacity>
                </View>

                {loadingExisting ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.fortnightHeader}>
                      <Text style={styles.fhDay}>Day</Text>
                      <Text style={styles.fhTime}>Start</Text>
                      <Text style={styles.fhTime}>End</Text>
                      <Text style={styles.fhBreak}>Break</Text>
                    </View>

                    {fortnightEntries.map((entry, index) => (
                      <View key={entry.date} style={[styles.fortnightRow, entry.existingId && styles.fortnightRowExisting]}>
                        <View style={styles.dayInfo}>
                          <Text style={styles.dayName}>{getDayName(entry.date)}</Text>
                          <Text style={styles.dayDate}>{formatDisplayDate(entry.date)}</Text>
                        </View>
                        
                        {entry.existingId ? (
                          <View style={styles.existingInfo}>
                            <Text style={styles.existingTime}>{entry.startTime} - {entry.endTime}</Text>
                            <View style={[styles.existingBadge, { backgroundColor: getStatusColor(entry.existingStatus) + '20' }]}>
                              <Text style={[styles.existingBadgeText, { color: getStatusColor(entry.existingStatus) }]}>
                                {entry.existingHours?.toFixed(1)}h
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.entryInputs}>
                            <TextInput
                              style={styles.entryInput}
                              value={entry.startTime}
                              onChangeText={(val) => updateFortnightEntry(index, 'startTime', val)}
                              placeholder="09:00"
                              placeholderTextColor="#9ca3af"
                            />
                            <TextInput
                              style={styles.entryInput}
                              value={entry.endTime}
                              onChangeText={(val) => updateFortnightEntry(index, 'endTime', val)}
                              placeholder="17:00"
                              placeholderTextColor="#9ca3af"
                            />
                            <TextInput
                              style={styles.entryBreak}
                              value={entry.break}
                              onChangeText={(val) => updateFortnightEntry(index, 'break', val)}
                              placeholder="30"
                              keyboardType="numeric"
                              placeholderTextColor="#9ca3af"
                            />
                          </View>
                        )}
                      </View>
                    ))}

                    <View style={styles.summaryBox}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Existing entries</Text>
                        <Text style={styles.summaryValue}>{fortnightEntries.filter(e => e.existingId).length} days</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>New to submit</Text>
                        <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
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
      <Modal visible={showDatePicker} animationType="fade" transparent onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerNav}>
              <TouchableOpacity onPress={() => {
                if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
                else setSelectedMonth(selectedMonth - 1);
              }}>
                <Ionicons name="chevron-back" size={24} color="#6366f1" />
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{monthNames[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity onPress={() => {
                if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
                else setSelectedMonth(selectedMonth + 1);
              }}>
                <Ionicons name="chevron-forward" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>

            <View style={styles.dayHeaders}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <Text key={d} style={styles.dayHeader}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {Array(getFirstDayOfMonth(selectedYear, selectedMonth)).fill(null).map((_, i) => (
                <View key={`e-${i}`} style={styles.calCell} />
              ))}
              {Array(getDaysInMonth(selectedYear, selectedMonth)).fill(null).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
                return (
                  <TouchableOpacity key={day} style={[styles.calCell, isToday && styles.todayCell]} onPress={() => selectDate(day)}>
                    <Text style={[styles.calDay, isToday && styles.todayText]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeSection: { flex: 1 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10, gap: 6 },
  roleText: { fontSize: 12, color: '#6366f1', fontWeight: '600', textTransform: 'capitalize' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: -20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginHorizontal: 20, marginTop: 28, marginBottom: 14 },
  actionCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionIconBg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionContent: { flex: 1, marginLeft: 14 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  actionSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  actionArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginTop: 16, padding: 14, backgroundColor: '#fef3c7', borderRadius: 12, gap: 10 },
  tipIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { fontSize: 16, color: '#6b7280' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  modalContent: { flex: 1 },
  form: { padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 10 },
  dateButtonText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  timeGroup: { flex: 1 },
  breakGroup: { width: 70 },
  timeInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, textAlign: 'center', fontWeight: '500', color: '#111827' },
  breakInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, textAlign: 'center', fontWeight: '500', color: '#111827' },
  notesInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', minHeight: 80, textAlignVertical: 'top' },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#eef2ff', borderRadius: 10 },
  photoBtnText: { fontSize: 14, fontWeight: '500', color: '#6366f1' },
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImg: { width: '100%', height: 180, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 12 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  fortnightHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 8 },
  fhDay: { width: 50, fontSize: 12, fontWeight: '600', color: '#6b7280' },
  fhTime: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  fhBreak: { width: 50, fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  fortnightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#fff', padding: 10, borderRadius: 10 },
  fortnightRowExisting: { backgroundColor: '#f3f4f6' },
  dayInfo: { width: 45 },
  dayName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  dayDate: { fontSize: 11, color: '#6b7280' },
  existingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 10 },
  existingTime: { fontSize: 14, color: '#374151', fontWeight: '500' },
  existingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  existingBadgeText: { fontSize: 12, fontWeight: '600' },
  entryInputs: { flex: 1, flexDirection: 'row', gap: 8, marginLeft: 10 },
  entryInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'center' },
  entryBreak: { width: 50, backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'center' },
  summaryBox: { marginTop: 16, padding: 16, backgroundColor: '#eef2ff', borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pickerContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340 },
  pickerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#6b7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  todayCell: { backgroundColor: '#6366f1', borderRadius: 20 },
  calDay: { fontSize: 15, color: '#111827' },
  todayText: { color: '#fff', fontWeight: '600' },
  pickerCancel: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  pickerCancelText: { fontSize: 16, color: '#6b7280' },
});
