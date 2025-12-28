import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Smart time formatter - handles various input formats
const formatTimeInput = (value: string): string => {
  const cleaned = value.replace(/[^0-9:]/g, '');
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const hours = parts[0].substring(0, 2);
    const mins = parts[1] ? parts[1].substring(0, 2) : '';
    if (mins) return `${hours.padStart(2, '0')}:${mins.padStart(2, '0')}`;
    return `${hours}:${mins}`;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length === 3) {
    const firstTwo = parseInt(digits.substring(0, 2));
    if (firstTwo <= 23) return `${digits.substring(0, 2)}:${digits[2]}`;
    return `0${digits[0]}:${digits.substring(1, 3)}`;
  }
  if (digits.length >= 4) {
    const hours = digits.substring(0, 2);
    const mins = digits.substring(2, 4);
    return `${hours}:${mins}`;
  }
  return cleaned;
};

interface Timesheet {
  id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  break_minutes: number;
  notes: string;
  image?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export default function TimesheetsScreen() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreak, setEditBreak] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchTimesheets = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`,
        { params: { employee_id: user.id } }
      );
      const data = response.data || [];
      data.sort((a: any, b: any) => new Date(b.clock_in || b.date).getTime() - new Date(a.clock_in || a.date).getTime());
      setTimesheets(data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const onRefresh = () => { setRefreshing(true); fetchTimesheets(); };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    } catch { return dateStr; }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch { return '--:--'; }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { color: '#10b981', bg: '#dcfce7', icon: 'checkmark-circle' };
      case 'rejected': return { color: '#ef4444', bg: '#fee2e2', icon: 'close-circle' };
      default: return { color: '#f59e0b', bg: '#fef3c7', icon: 'time' };
    }
  };

  const openEditModal = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    const clockIn = new Date(timesheet.clock_in);
    const clockOut = new Date(timesheet.clock_out);
    setEditDate(`${clockIn.getFullYear()}-${String(clockIn.getMonth() + 1).padStart(2, '0')}-${String(clockIn.getDate()).padStart(2, '0')}`);
    setEditStartTime(`${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`);
    setEditEndTime(`${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`);
    setEditBreak(String(timesheet.break_minutes || 0));
    setEditNotes(timesheet.notes || '');
    setEditImage(timesheet.image || null);
    setShowEditModal(true);
  };

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
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true });

      if (!result.canceled && result.assets[0].base64) {
        setEditImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const saveEdit = async () => {
    if (!editingTimesheet) return;
    setSaving(true);
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingTimesheet.id}`,
        {
          date: editDate,
          clock_in_time: editStartTime,
          clock_out_time: editEndTime,
          break_minutes: parseInt(editBreak) || 0,
          notes: editNotes,
          image: editImage,
        }
      );
      Alert.alert('Success', 'Timesheet updated');
      setShowEditModal(false);
      fetchTimesheets();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const deleteTimesheet = (timesheet: Timesheet) => {
    Alert.alert(
      'Delete Timesheet',
      timesheet.approval_status === 'approved'
        ? 'This is approved. Deleting may affect records. Continue?'
        : 'Delete this timesheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${timesheet.id}`);
              Alert.alert('Success', 'Deleted');
              fetchTimesheets();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const filteredTimesheets = filterStatus === 'all' ? timesheets : timesheets.filter(t => t.approval_status === filterStatus);
  const totalHours = filteredTimesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
  const pendingCount = timesheets.filter(t => t.approval_status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.approval_status === 'approved').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredTimesheets.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalHours.toFixed(0)}h</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timesheets List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTimesheets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={40} color="#9ca3af" />
            </View>
            <Text style={styles.emptyText}>No timesheets found</Text>
            <Text style={styles.emptySubtext}>Submit entries from the Home tab</Text>
          </View>
        ) : (
          filteredTimesheets.map((timesheet) => {
            const statusConfig = getStatusConfig(timesheet.approval_status);
            return (
              <View key={timesheet.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.dateSection}>
                    <Text style={styles.dateText}>{formatDate(timesheet.clock_in)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {timesheet.approval_status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    {timesheet.image && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { setViewingImage(timesheet.image!); setShowImageModal(true); }}>
                        <Ionicons name="image" size={18} color="#6366f1" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(timesheet)}>
                      <Ionicons name="create-outline" size={18} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => deleteTimesheet(timesheet)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.timeSection}>
                    <View style={styles.timeBlock}>
                      <View style={[styles.timeIcon, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="log-in" size={14} color="#10b981" />
                      </View>
                      <View>
                        <Text style={styles.timeLabel}>Start</Text>
                        <Text style={styles.timeValue}>{formatTime(timesheet.clock_in)}</Text>
                      </View>
                    </View>
                    <View style={styles.timeArrow}>
                      <Ionicons name="arrow-forward" size={16} color="#d1d5db" />
                    </View>
                    <View style={styles.timeBlock}>
                      <View style={[styles.timeIcon, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="log-out" size={14} color="#ef4444" />
                      </View>
                      <View>
                        <Text style={styles.timeLabel}>End</Text>
                        <Text style={styles.timeValue}>{formatTime(timesheet.clock_out)}</Text>
                      </View>
                    </View>
                    <View style={styles.hoursBox}>
                      <Text style={styles.hoursValue}>{(timesheet.total_hours || 0).toFixed(1)}</Text>
                      <Text style={styles.hoursLabel}>hours</Text>
                    </View>
                  </View>
                  
                  {timesheet.notes && (
                    <View style={styles.notesRow}>
                      <Ionicons name="document-text" size={14} color="#9ca3af" />
                      <Text style={styles.notesText} numberOfLines={2}>{timesheet.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Timesheet</Text>
            <TouchableOpacity onPress={saveEdit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start Time</Text>
                  <TextInput style={styles.input} value={editStartTime} onChangeText={setEditStartTime} placeholder="09:00" placeholderTextColor="#9ca3af" />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End Time</Text>
                  <TextInput style={styles.input} value={editEndTime} onChangeText={setEditEndTime} placeholder="17:00" placeholderTextColor="#9ca3af" />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Break (minutes)</Text>
                <TextInput style={styles.input} value={editBreak} onChangeText={setEditBreak} placeholder="30" keyboardType="numeric" placeholderTextColor="#9ca3af" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editNotes} onChangeText={setEditNotes} placeholder="Add notes..." multiline placeholderTextColor="#9ca3af" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Photo</Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={18} color="#6366f1" />
                    <Text style={styles.photoBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                    <Ionicons name="images" size={18} color="#6366f1" />
                    <Text style={styles.photoBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                {editImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: editImage }} style={styles.previewImg} />
                    <TouchableOpacity style={styles.removeImg} onPress={() => setEditImage(null)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModalContainer}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {viewingImage && <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsHeader: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  filterScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterPillActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dateSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 2 },
  actionBtn: { padding: 8 },
  cardBody: { padding: 14 },
  timeSection: { flexDirection: 'row', alignItems: 'center' },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { fontSize: 10, color: '#9ca3af' },
  timeValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  timeArrow: { paddingHorizontal: 12 },
  hoursBox: { marginLeft: 'auto', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  hoursValue: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
  hoursLabel: { fontSize: 10, color: '#6366f1' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 8 },
  notesText: { flex: 1, fontSize: 13, color: '#6b7280', lineHeight: 18 },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { fontSize: 16, color: '#6b7280' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  modalContent: { flex: 1 },
  form: { padding: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827' },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#eef2ff', borderRadius: 10 },
  photoBtnText: { fontSize: 14, fontWeight: '500', color: '#6366f1' },
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImg: { width: '100%', height: 180, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 12 },
  imageModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
});
