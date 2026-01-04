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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
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
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const openEditModal = (ts: Timesheet) => {
    setEditingTimesheet(ts);
    const clockIn = new Date(ts.clock_in);
    const clockOut = new Date(ts.clock_out);
    setEditDate(`${clockIn.getFullYear()}-${String(clockIn.getMonth() + 1).padStart(2, '0')}-${String(clockIn.getDate()).padStart(2, '0')}`);
    setEditStartTime(`${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`);
    setEditEndTime(`${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`);
    setEditBreak(String(ts.break_minutes || 0));
    setEditNotes(ts.notes || '');
    setEditImage(ts.image || null);
    setShowEditModal(true);
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
      pickImageWeb((base64) => setEditImage(base64));
      return;
    }
    
    // Mobile
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return;
    
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7, base64: true });
    
    if (!result.canceled && result.assets[0].base64) {
      setEditImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const saveEdit = async () => {
    if (!editingTimesheet) return;
    setSaving(true);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingTimesheet.id}`, {
        date: editDate, clock_in_time: editStartTime, clock_out_time: editEndTime,
        break_minutes: parseInt(editBreak) || 0, notes: editNotes, image: editImage,
      });
      Alert.alert('Success', 'Updated');
      setShowEditModal(false);
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    }
    setSaving(false);
  };

  const deleteTimesheet = (ts: Timesheet) => {
    Alert.alert('Delete', 'Delete this timesheet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${ts.id}`);
          fetchTimesheets();
        } catch (e: any) { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const filteredTimesheets = filterStatus === 'all' ? timesheets : timesheets.filter(t => t.approval_status === filterStatus);
  const totalHours = filteredTimesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
  const pendingCount = timesheets.filter(t => t.approval_status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.approval_status === 'approved').length;

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredTimesheets.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalHours.toFixed(0)}h</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4ade80' }]}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timesheets List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTimesheets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No timesheets found</Text>
            <Text style={styles.emptySubtext}>Submit from Home tab</Text>
          </View>
        ) : (
          filteredTimesheets.map((ts) => (
            <View key={ts.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.dateText}>{formatDate(ts.clock_in)}</Text>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(ts.clock_in)}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#9ca3af" style={{ marginHorizontal: 6 }} />
                    <Text style={styles.timeText}>{formatTime(ts.clock_out)}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.hoursBox}>
                    <Text style={styles.hoursValue}>{(ts.total_hours || 0).toFixed(1)}</Text>
                    <Text style={styles.hoursLabel}>hrs</Text>
                  </View>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: ts.approval_status === 'approved' ? '#10b981' : ts.approval_status === 'rejected' ? '#ef4444' : '#f59e0b' }
                  ]} />
                </View>
              </View>
              
              {ts.notes && <Text style={styles.notesText} numberOfLines={1}>{ts.notes}</Text>}
              
              <View style={styles.cardActions}>
                {ts.image && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setViewingImage(ts.image!); setShowImageModal(true); }}>
                    <Ionicons name="image-outline" size={18} color="#6366f1" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(ts)}>
                  <Ionicons name="create-outline" size={18} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteTimesheet(ts)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: ts.approval_status === 'approved' ? '#dcfce7' : ts.approval_status === 'rejected' ? '#fee2e2' : '#fef3c7' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: ts.approval_status === 'approved' ? '#15803d' : ts.approval_status === 'rejected' ? '#dc2626' : '#d97706' }
                  ]}>
                    {ts.approval_status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit</Text>
            <TouchableOpacity onPress={saveEdit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Start</Text>
                <TextInput style={styles.input} value={editStartTime} onChangeText={setEditStartTime} placeholder="09:00" />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>End</Text>
                <TextInput style={styles.input} value={editEndTime} onChangeText={setEditEndTime} placeholder="17:00" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Break (min)</Text>
              <TextInput style={styles.input} value={editBreak} onChangeText={setEditBreak} keyboardType="numeric" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, { height: 70 }]} value={editNotes} onChangeText={setEditNotes} multiline />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photo</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={18} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="images" size={18} color="#6366f1" />
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
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.imageModalBg}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setShowImageModal(false)}>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  
  header: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16 },
  statsGrid: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  filterRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#f1f5f9' },
  filterTabActive: { backgroundColor: '#6366f1' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTabTextActive: { color: '#fff' },
  
  list: { flex: 1, padding: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursBox: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  hoursValue: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  hoursLabel: { fontSize: 10, color: '#6366f1', marginTop: -2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  notesText: { fontSize: 13, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' },
  
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cancelText: { fontSize: 16, color: '#64748b' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  modalContent: { flex: 1, padding: 16 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b' },
  inputRow: { flexDirection: 'row' },
  
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImg: { width: '100%', height: 150, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  
  imageModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width: '100%', height: '80%' },
});
