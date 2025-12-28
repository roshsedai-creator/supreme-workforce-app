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
      Alert.alert('Success', 'Timesheet approved');
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
      Alert.alert('Success', 'Timesheet rejected');
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    }
    setActionLoading(null);
  };

  const filteredTimesheets = filterStatus === 'all' ? timesheets : timesheets.filter(t => t.approval_status === filterStatus);
  const pendingCount = timesheets.filter(t => t.approval_status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.approval_status === 'approved').length;
  const totalHours = filteredTimesheets.reduce((s, t) => s + (t.total_hours || 0), 0);

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Approvals Dashboard</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{pendingCount}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{approvedCount}</Text>
            <Text style={styles.statLbl}>Approved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalHours.toFixed(0)}h</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.employeeFilter}>
          <Text style={styles.filterLabel}>Employee</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedEmployeeId} onValueChange={setSelectedEmployeeId} style={styles.picker}>
              <Picker.Item label="All Employees" value="all" />
              {employees.map(e => <Picker.Item key={e.id} label={`${e.first_name} ${e.last_name}`} value={e.id} />)}
            </Picker>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['pending', 'all', 'approved', 'rejected'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.filterPill, filterStatus === s && styles.filterPillActive]} onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)} {s === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />} showsVerticalScrollIndicator={false}>
        {filteredTimesheets.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="checkmark-done-circle" size={48} color="#9ca3af" /></View>
            <Text style={styles.emptyText}>No {filterStatus !== 'all' ? filterStatus : ''} timesheets</Text>
          </View>
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
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{ts.approval_status}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.timeInfo}>
                    <View style={styles.timeCol}>
                      <Text style={styles.timeLbl}>Start</Text>
                      <Text style={styles.timeVal}>{formatTime(ts.clock_in)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#d1d5db" />
                    <View style={styles.timeCol}>
                      <Text style={styles.timeLbl}>End</Text>
                      <Text style={styles.timeVal}>{formatTime(ts.clock_out)}</Text>
                    </View>
                    <View style={styles.hoursBox}>
                      <Text style={styles.hoursVal}>{(ts.total_hours || 0).toFixed(1)}h</Text>
                    </View>
                  </View>

                  {ts.notes && (
                    <View style={styles.notesRow}>
                      <Ionicons name="document-text" size={14} color="#9ca3af" />
                      <Text style={styles.notesText} numberOfLines={2}>{ts.notes}</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  {ts.image && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setViewingImage(ts.image!); setShowImageModal(true); }}>
                      <Ionicons name="image" size={18} color="#6366f1" />
                      <Text style={styles.actionText}>View Photo</Text>
                    </TouchableOpacity>
                  )}
                  
                  {ts.approval_status === 'pending' && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => approveTimesheet(ts.id)} disabled={actionLoading === ts.id}>
                        {actionLoading === ts.id ? <ActivityIndicator size="small" color="#fff" /> : (
                          <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => openRejectModal(ts.id)}>
                        <Ionicons name="close" size={18} color="#ef4444" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
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

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="fade" transparent onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectTitle}>Rejection Reason</Text>
            <TextInput style={styles.rejectInput} value={rejectReason} onChangeText={setRejectReason} placeholder="Enter reason (optional)" multiline placeholderTextColor="#9ca3af" />
            <View style={styles.rejectActions}>
              <TouchableOpacity style={styles.rejectCancelBtn} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectConfirmBtn} onPress={submitRejection}>
                <Text style={styles.rejectConfirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.imageClose} onPress={() => setShowImageModal(false)}>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  filtersSection: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  employeeFilter: { paddingHorizontal: 16, marginBottom: 12 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  pickerBox: { backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  picker: { height: 44, color: '#111827' },
  filterScroll: { paddingHorizontal: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  filterPillActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  empName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardDate: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBody: { padding: 14 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeCol: { alignItems: 'center' },
  timeLbl: { fontSize: 10, color: '#9ca3af' },
  timeVal: { fontSize: 16, fontWeight: '600', color: '#111827' },
  hoursBox: { marginLeft: 'auto', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  hoursVal: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 8 },
  notesText: { flex: 1, fontSize: 13, color: '#6b7280' },
  cardActions: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, color: '#6366f1', fontWeight: '500' },
  approveBtn: { backgroundColor: '#10b981', flex: 1, justifyContent: 'center' },
  approveBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#fee2e2', flex: 1, justifyContent: 'center' },
  rejectBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  rejectModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  rejectTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  rejectInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, minHeight: 80, fontSize: 15, textAlignVertical: 'top', color: '#111827' },
  rejectActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  rejectCancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#f3f4f6' },
  rejectCancelText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  rejectConfirmBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#ef4444' },
  rejectConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
});
