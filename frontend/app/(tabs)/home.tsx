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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [entryMode, setEntryMode] = useState<'daily' | 'fortnight'>('daily');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Daily entry
  const [dailyDate, setDailyDate] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('');
  const [dailyEndTime, setDailyEndTime] = useState('');
  const [dailyBreak, setDailyBreak] = useState('30');
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  
  // Fortnight
  const [fortnightStartDate, setFortnightStartDate] = useState('');
  const [fortnightEntries, setFortnightEntries] = useState<any[]>([]);
  const [fortnightImage, setFortnightImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Auto-format time input (e.g., "800" -> "08:00", "1430" -> "14:30")
  const formatTimeInput = (value: string): string => {
    // Remove any non-numeric characters except colon
    let cleaned = value.replace(/[^0-9:]/g, '');
    
    // If already has colon and is valid, return as is
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      if (parts.length === 2 && parts[0].length <= 2 && parts[1].length <= 2) {
        return cleaned;
      }
    }
    
    // Remove colon for processing
    cleaned = cleaned.replace(':', '');
    
    if (cleaned.length === 0) return '';
    
    // Handle different input lengths
    if (cleaned.length <= 2) {
      // Just hours: "8" -> "08:00", "12" -> "12:00"
      const hour = cleaned.padStart(2, '0');
      return `${hour}:00`;
    } else if (cleaned.length === 3) {
      // "800" -> "08:00", "930" -> "09:30"
      const hour = cleaned.slice(0, 1).padStart(2, '0');
      const min = cleaned.slice(1).padStart(2, '0');
      return `${hour}:${min}`;
    } else if (cleaned.length >= 4) {
      // "0800" -> "08:00", "1430" -> "14:30"
      const hour = cleaned.slice(0, 2);
      const min = cleaned.slice(2, 4);
      return `${hour}:${min}`;
    }
    
    return value;
  };

  const generateFortnightDates = (startDate: string) => {
    const entries = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      entries.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        startTime: '',
        endTime: '',
        breakMins: '30',
      });
    }
    
    setFortnightEntries(entries);
  };

  const openEntryModal = (mode: 'daily' | 'fortnight') => {
    setEntryMode(mode);
    if (mode === 'daily') {
      setDailyDate(getTodayDate());
      setDailyStartTime('');
      setDailyEndTime('');
      setDailyBreak('30');
      setDailyNotes('');
      setDailyImage(null);
    } else {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      const startDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      setFortnightStartDate(startDate);
      generateFortnightDates(startDate);
      setFortnightImage(null);
    }
    setShowEntryModal(true);
  };

  // Web file picker
  const pickImageWeb = (callback: (base64: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickImage = async (target: 'daily' | 'fortnight') => {
    const setImage = target === 'daily' ? setDailyImage : setFortnightImage;
    
    if (Platform.OS === 'web') {
      pickImageWeb((base64) => setImage(base64));
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0].base64) {
        setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const submitDailyTimesheet = async () => {
    console.log('Submitting daily timesheet...');
    console.log('Date:', dailyDate, 'Start:', dailyStartTime, 'End:', dailyEndTime);
    
    if (!dailyDate || !dailyStartTime || !dailyEndTime) {
      const msg = 'Please fill in date, start time and end time';
      console.log('Validation failed:', msg);
      Alert.alert('Missing Fields', msg);
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      console.log('Backend URL:', backendUrl);
      console.log('User ID:', user?.id);
      
      const payload = {
        employee_id: user?.id,
        date: dailyDate,
        clock_in_time: dailyStartTime,
        clock_out_time: dailyEndTime,
        break_minutes: parseInt(dailyBreak) || 0,
        notes: dailyNotes,
        image: dailyImage,
      };
      console.log('Payload:', JSON.stringify(payload));
      
      const response = await axios.post(
        `${backendUrl}/api/timesheets/manual`,
        payload
      );

      console.log('Response:', response.data);
      
      if (response.data) {
        Alert.alert('Success', 'Timesheet submitted successfully!');
        setShowEntryModal(false);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      const msg = error.response?.data?.detail || error.message || 'Failed to submit';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const submitFortnightTimesheet = async () => {
    const validEntries = fortnightEntries.filter(e => e.startTime && e.endTime);
    
    if (validEntries.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in at least one day with start and end time');
      } else {
        Alert.alert('No Entries', 'Please fill in at least one day with start and end time');
      }
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorMsg = '';
    
    for (const entry of validEntries) {
      try {
        await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`, {
          employee_id: user?.id,
          date: entry.date,
          clock_in_time: entry.startTime,
          clock_out_time: entry.endTime,
          break_minutes: parseInt(entry.breakMins) || 0,
          notes: 'Fortnight entry',
          image: fortnightImage,
        });
        successCount++;
      } catch (err: any) {
        errorMsg = err.response?.data?.detail || 'Error';
        console.error('Failed to submit entry:', entry.date, err);
      }
    }
    
    setLoading(false);
    
    if (successCount > 0) {
      if (Platform.OS === 'web') {
        window.alert(`${successCount} timesheet(s) submitted successfully!`);
      } else {
        Alert.alert('Success', `${successCount} timesheet(s) submitted`);
      }
      setShowEntryModal(false);
    } else {
      if (Platform.OS === 'web') {
        window.alert('Failed to submit: ' + errorMsg);
      } else {
        Alert.alert('Error', 'Failed to submit: ' + errorMsg);
      }
    }
  };

  const updateFortnightEntry = (index: number, field: string, value: string) => {
    const updated = [...fortnightEntries];
    updated[index][field] = value;
    setFortnightEntries(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Cards */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Submit Timesheet</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('daily')}>
            <View style={[styles.cardIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="today" size={28} color="#6366f1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Single Day Entry</Text>
              <Text style={styles.cardDesc}>Submit hours for one day</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('fortnight')}>
            <View style={[styles.cardIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="calendar" size={28} color="#10b981" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Fortnight Entry</Text>
              <Text style={styles.cardDesc}>Submit 2 weeks at once</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Entry Modal */}
      <Modal visible={showEntryModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{entryMode === 'daily' ? 'Daily Entry' : 'Fortnight Entry'}</Text>
            <TouchableOpacity onPress={entryMode === 'daily' ? submitDailyTimesheet : submitFortnightTimesheet} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.submitBtn}>Submit</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {entryMode === 'daily' ? (
              /* DAILY ENTRY FORM */
              <View style={styles.form}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={dailyDate}
                  onChangeText={setDailyDate}
                  placeholder="YYYY-MM-DD (e.g. 2025-01-15)"
                  placeholderTextColor="#9ca3af"
                />

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Start Time</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyStartTime}
                      onChangeText={setDailyStartTime}
                      placeholder="HH:MM (e.g. 09:00)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>End Time</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyEndTime}
                      onChangeText={setDailyEndTime}
                      placeholder="HH:MM (e.g. 17:00)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Break (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={dailyBreak}
                  onChangeText={setDailyBreak}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={dailyNotes}
                  onChangeText={setDailyNotes}
                  placeholder="Add notes..."
                  multiline
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Photo Evidence (optional)</Text>
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('daily')}>
                  <Ionicons name="camera" size={20} color="#6366f1" />
                  <Text style={styles.photoBtnText}>Upload Photo</Text>
                </TouchableOpacity>
                {dailyImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: dailyImage }} style={styles.previewImg} />
                    <TouchableOpacity style={styles.removeImg} onPress={() => setDailyImage(null)}>
                      <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* FORTNIGHT ENTRY FORM */
              <View style={styles.form}>
                <Text style={styles.label}>Fortnight Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={fortnightStartDate}
                  onChangeText={(val) => {
                    setFortnightStartDate(val);
                    if (val.length === 10) generateFortnightDates(val);
                  }}
                  placeholder="YYYY-MM-DD (e.g. 2025-01-13)"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Enter Times (leave blank for days off)</Text>
                
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.thDay}>Day</Text>
                  <Text style={styles.thTime}>Start</Text>
                  <Text style={styles.thTime}>End</Text>
                  <Text style={styles.thBreak}>Break</Text>
                </View>

                {/* Table Rows */}
                {fortnightEntries.map((entry, index) => (
                  <View key={entry.date} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                    <View style={styles.tdDay}>
                      <Text style={styles.dayName}>{entry.dayName}</Text>
                      <Text style={styles.dayNum}>{entry.dayNum}</Text>
                    </View>
                    <TextInput
                      style={styles.tdInput}
                      value={entry.startTime}
                      onChangeText={(val) => updateFortnightEntry(index, 'startTime', val)}
                      placeholder="09:00"
                      placeholderTextColor="#cbd5e1"
                    />
                    <TextInput
                      style={styles.tdInput}
                      value={entry.endTime}
                      onChangeText={(val) => updateFortnightEntry(index, 'endTime', val)}
                      placeholder="17:00"
                      placeholderTextColor="#cbd5e1"
                    />
                    <TextInput
                      style={styles.tdBreak}
                      value={entry.breakMins}
                      onChangeText={(val) => updateFortnightEntry(index, 'breakMins', val)}
                      placeholder="30"
                      keyboardType="numeric"
                      placeholderTextColor="#cbd5e1"
                    />
                  </View>
                ))}

                {/* Photo Section */}
                <View style={styles.photoSection}>
                  <Text style={styles.photoTitle}>📷 Attach Timesheet Photo</Text>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('fortnight')}>
                    <Ionicons name="camera" size={20} color="#6366f1" />
                    <Text style={styles.photoBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                  {fortnightImage && (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: fortnightImage }} style={styles.previewImg} />
                      <TouchableOpacity style={styles.removeImg} onPress={() => setFortnightImage(null)}>
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image View Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.imageModalBg}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewingImage && <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollView: { flex: 1 },
  
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  
  cardsSection: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  cardDesc: { fontSize: 14, color: '#64748b', marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cancelBtn: { fontSize: 16, color: '#64748b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  submitBtn: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  
  modalBody: { flex: 1 },
  form: { padding: 20 },
  
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#1e293b' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed' },
  photoBtnText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImg: { width: '100%', height: 200, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#6366f1', padding: 12, borderRadius: 8, marginTop: 12 },
  thDay: { width: 60, fontSize: 12, fontWeight: '700', color: '#fff' },
  thTime: { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  thBreak: { width: 50, fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  
  tdDay: { width: 60 },
  dayName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  dayNum: { fontSize: 12, color: '#64748b' },
  
  tdInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, marginHorizontal: 4, fontSize: 14, color: '#1e293b', textAlign: 'center' },
  tdBreak: { width: 50, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, fontSize: 14, color: '#1e293b', textAlign: 'center' },
  
  photoSection: { marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#6366f1' },
  photoTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  
  imageModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
});
