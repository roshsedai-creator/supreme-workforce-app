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
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

interface Employee { id: string; first_name: string; last_name: string; job_title?: string; }
interface Timesheet {
  id: string;
  employee_id: string;
  employee_name?: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  break_minutes: number;
  notes: string;
  image?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export default function SupervisorScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreak, setEditBreak] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`);
      setEmployees(res.data || []);
    } catch (e) {}
  }, []);

  const fetchTimesheets = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedEmployeeId !== 'all') params.employee_id = selectedEmployeeId;
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
      let data = res.data || [];
      const empMap = new Map(employees.map(e => [e.id, `${e.first_name} ${e.last_name}`]));
      data = data.map((ts: Timesheet) => ({ ...ts, employee_name: empMap.get(ts.employee_id) || 'Unknown' }));
      data.sort((a: any, b: any) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
      setTimesheets(data);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [selectedEmployeeId, employees]);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { if (employees.length) fetchTimesheets(); }, [employees, selectedEmployeeId, fetchTimesheets]);

  const onRefresh = () => { setRefreshing(true); fetchTimesheets(); };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusConfig = (s: string) => {
    if (s === 'approved') return { color: '#10b981', bg: '#dcfce7', icon: 'checkmark-circle' };
    if (s === 'rejected') return { color: '#ef4444', bg: '#fee2e2', icon: 'close-circle' };
    return { color: '#f59e0b', bg: '#fef3c7', icon: 'time' };
  };

  const approveTimesheet = async (id: string) => {
    setActionLoading(id);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${id}/approve`, { action: 'approved' });
      Alert.alert('Success', 'Approved');
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    }
    setActionLoading(null);
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectingId) return;
    setShowRejectModal(false);
    setActionLoading(rejectingId);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${rejectingId}/approve`, { action: 'rejected', notes: rejectReason });
      Alert.alert('Success', 'Rejected');
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    }
    setActionLoading(null);
  };

  // Edit timesheet
  const openEditModal = (ts: Timesheet) => {
    setEditingTimesheet(ts);
    const clockIn = new Date(ts.clock_in);
    const clockOut = new Date(ts.clock_out);
    setEditDate(`${clockIn.getFullYear()}-${String(clockIn.getMonth() + 1).padStart(2, '0')}-${String(clockIn.getDate()).padStart(2, '0')}`);
    setEditStartTime(`${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`);
    setEditEndTime(`${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`);
    setEditBreak(String(ts.break_minutes || 0));
    setEditNotes(ts.notes || '');
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingTimesheet) return;
    setSaving(true);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingTimesheet.id}`, {
        date: editDate,
        clock_in_time: editStartTime,
        clock_out_time: editEndTime,
        break_minutes: parseInt(editBreak) || 0,
        notes: editNotes,
      });
      Alert.alert('Success', 'Updated');
      setShowEditModal(false);
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    }
    setSaving(false);
  };

  // Delete timesheet
  const deleteTimesheet = (ts: Timesheet) => {
    Alert.alert('Delete', `Delete ${ts.employee_name}'s timesheet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${ts.id}`);
            Alert.alert('Success', 'Deleted');
            fetchTimesheets();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed');
          }
        },
      },
    ]);
  };

  const filteredTimesheets = filterStatus === 'all' ? timesheets : timesheets.filter(t => t.approval_status === filterStatus);
  const pendingCount = timesheets.filter(t => t.approval_status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.approval_status === 'approved').length;
  const totalHours = filteredTimesheets.reduce((s, t) => s + (t.total_hours || 0), 0);

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Manage Timesheets</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>{pendingCount}</Text><Text style={styles.statLbl}>Pending</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}><Text style={styles.statNum}>{approvedCount}</Text><Text style={styles.statLbl}>Approved</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}><Text style={styles.statNum}>{totalHours.toFixed(0)}h</Text><Text style={styles.statLbl}>Total</Text></View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Employee:</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedEmployeeId} onValueChange={setSelectedEmployeeId} style={styles.picker}>
              <Picker.Item label="All" value="all" />
              {employees.map(e => <Picker.Item key={e.id} label={`${e.first_name} ${e.last_name}`} value={e.id} />)}
            </Picker>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['pending', 'all', 'approved', 'rejected'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.filterPill, filterStatus === s && styles.filterPillActive]} onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}>
        {filteredTimesheets.length === 0 ? (
          <View style={styles.empty}><Ionicons name="checkmark-done-circle" size={40} color="#9ca3af" /><Text style={styles.emptyText}>No timesheets</Text></View>
        ) : (
          filteredTimesheets.map(ts => {
            const cfg = getStatusConfig(ts.approval_status);
            return (
              <View key={ts.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.empName}>{ts.employee_name}</Text>
                    <Text style={styles.cardDate}>{formatDate(ts.clock_in)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{ts.approval_status}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(ts.clock_in)} - {formatTime(ts.clock_out)}</Text>
                    <View style={styles.hoursBox}><Text style={styles.hoursVal}>{(ts.total_hours || 0).toFixed(1)}h</Text></View>
                  </View>
                  {ts.notes && <Text style={styles.notesText} numberOfLines={1}>{ts.notes}</Text>}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  {ts.image && (
                    <TouchableOpacity style={styles.iconBtn} onPress={() => { setViewingImage(ts.image!); setShowImageModal(true); }}>
                      <Ionicons name="image" size={16} color="#6366f1" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(ts)}>
                    <Ionicons name="create-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => deleteTimesheet(ts)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                  
                  {ts.approval_status === 'pending' && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => approveTimesheet(ts.id)} disabled={actionLoading === ts.id}>
                        {actionLoading === ts.id ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={styles.btnText}>Approve</Text></>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => openRejectModal(ts.id)}>
                        <Ionicons name="close" size={14} color="#ef4444" /><Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
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
            <TouchableOpacity onPress={() => setShowEditModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Timesheet</Text>
            <TouchableOpacity onPress={saveEdit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.form}>
              <Text style={styles.label}>Employee</Text>
              <Text style={styles.readOnly}>{editingTimesheet?.employee_name}</Text>
              
              <Text style={styles.label}>Date</Text>
              <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" />
              
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Start</Text>
                  <TextInput style={styles.input} value={editStartTime} onChangeText={setEditStartTime} placeholder="09:00" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>End</Text>
                  <TextInput style={styles.input} value={editEndTime} onChangeText={setEditEndTime} placeholder="17:00" />
                </View>
              </View>
              
              <Text style={styles.label}>Break (min)</Text>
              <TextInput style={styles.input} value={editBreak} onChangeText={setEditBreak} keyboardType="numeric" />
              
              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={editNotes} onChangeText={setEditNotes} multiline />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="fade" transparent onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectTitle}>Rejection Reason</Text>
            <TextInput style={styles.rejectInput} value={rejectReason} onChangeText={setRejectReason} placeholder="Optional" multiline />
            <View style={styles.rejectActions}>
              <TouchableOpacity style={styles.rejectCancelBtn} onPress={() => setShowRejectModal(false)}><Text style={styles.rejectCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.rejectConfirmBtn} onPress={submitRejection}><Text style={styles.rejectConfirmText}>Reject</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.imageClose} onPress={() => setShowImageModal(false)}><Ionicons name="close-circle" size={36} color="#fff" /></TouchableOpacity>
          {viewingImage && <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  filtersSection: { backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginRight: 8 },
  pickerBox: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, height: 36, justifyContent: 'center' },
  picker: { height: 36, color: '#111827', fontSize: 13 },
  filterScroll: { paddingHorizontal: 12 },
  filterPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f3f4f6', marginRight: 6 },
  filterPillActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, padding: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  empName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardDate: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  cardBody: { paddingHorizontal: 12, paddingVertical: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  hoursBox: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  hoursVal: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  notesText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  cardActions: { flexDirection: 'row', padding: 8, gap: 6, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center' },
  iconBtn: { padding: 6, backgroundColor: '#f3f4f6', borderRadius: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
  approveBtn: { backgroundColor: '#10b981', marginLeft: 'auto' },
  btnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#fee2e2' },
  rejectBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  rejectModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  rejectTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  rejectInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, minHeight: 60, fontSize: 14, textAlignVertical: 'top' },
  rejectActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  rejectCancelBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#f3f4f6' },
  rejectCancelText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  rejectConfirmBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#ef4444' },
  rejectConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { fontSize: 15, color: '#6b7280' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  saveText: { fontSize: 15, fontWeight: '600', color: '#6366f1' },
  modalContent: { flex: 1 },
  form: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  readOnly: { fontSize: 14, color: '#6b7280', backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
});
