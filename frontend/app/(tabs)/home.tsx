import React, { useState, useCallback } from 'react';
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
  
  // Fortnight entry form
  const [fortnightStartDate, setFortnightStartDate] = useState('');
  const [fortnightEntries, setFortnightEntries] = useState<{
    date: string;
    hours: string;
    break: string;
  }[]>([]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Generate fortnight dates from start date
  const generateFortnightDates = (startDate: string) => {
    const entries = [];
    const start = new Date(startDate);
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      entries.push({ date: dateStr, hours: '', break: '30' });
    }
    setFortnightEntries(entries);
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
      const monday = new Date(now.setDate(diff));
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
    const validEntries = fortnightEntries.filter(e => e.hours && parseFloat(e.hours) > 0);
    
    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please enter hours for at least one day');
      return;
    }

    setLoading(true);
    try {
      // Submit each day as separate timesheet
      for (const entry of validEntries) {
        const hours = parseFloat(entry.hours);
        const breakMins = parseInt(entry.break) || 0;
        
        // Calculate start and end times based on hours
        const startTime = '09:00';
        const totalMinutes = hours * 60 + breakMins;
        const endHour = Math.floor((9 * 60 + totalMinutes) / 60);
        const endMin = Math.floor((9 * 60 + totalMinutes) % 60);
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        await axios.post(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`,
          {
            employee_id: user?.id,
            date: entry.date,
            clock_in_time: startTime,
            clock_out_time: endTime,
            break_minutes: breakMins,
            notes: `Fortnight entry - ${hours}h`,
          }
        );
      }

      Alert.alert('Success', `${validEntries.length} timesheet entries submitted for approval`);
      setShowEntryModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit timesheets');
    } finally {
      setLoading(false);
    }
  };

  // Update fortnight entry
  const updateFortnightEntry = (index: number, field: 'hours' | 'break', value: string) => {
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
                  <TextInput
                    style={styles.input}
                    value={dailyDate}
                    onChangeText={setDailyDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.gray[400]}
                  />
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
                  <TextInput
                    style={styles.input}
                    value={fortnightStartDate}
                    onChangeText={(text) => {
                      setFortnightStartDate(text);
                      if (text.length === 10) {
                        generateFortnightDates(text);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>

                <Text style={styles.fortnightInfo}>
                  Enter hours worked for each day. Leave blank for days not worked.
                </Text>

                {fortnightEntries.map((entry, index) => (
                  <View key={entry.date} style={styles.fortnightRow}>
                    <View style={styles.fortnightDate}>
                      <Text style={styles.dayName}>{getDayName(entry.date)}</Text>
                      <Text style={styles.dateText}>{formatDisplayDate(entry.date)}</Text>
                    </View>
                    <View style={styles.fortnightInputs}>
                      <TextInput
                        style={styles.hoursInput}
                        value={entry.hours}
                        onChangeText={(val) => updateFortnightEntry(index, 'hours', val)}
                        placeholder="Hours"
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.gray[400]}
                      />
                      <TextInput
                        style={styles.breakInput}
                        value={entry.break}
                        onChangeText={(val) => updateFortnightEntry(index, 'break', val)}
                        placeholder="Break"
                        keyboardType="numeric"
                        placeholderTextColor={colors.gray[400]}
                      />
                    </View>
                  </View>
                ))}

                {/* Fortnight Summary */}
                <View style={styles.fortnightSummary}>
                  <Text style={styles.summaryLabel}>Total Hours:</Text>
                  <Text style={styles.summaryValue}>
                    {fortnightEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0).toFixed(1)}h
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  fortnightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
  },
  fortnightDate: {
    width: 60,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  fortnightInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },
  hoursInput: {
    flex: 2,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  breakInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  fortnightSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
});
