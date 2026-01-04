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
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Employee { id: string; first_name: string; last_name: string; }
interface Timesheet {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  break_minutes: number;
  notes: string;
  approval_status: string;
}

export default function SupervisorScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Employee selector modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  
  // Fortnight
  const [fortnightEnd, setFortnightEnd] = useState(new Date());
  const [fortnightEntries, setFortnightEntries] = useState<any[]>([]);
  
  // Edit modal
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editBreak, setEditBreak] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`);
      const emps = (res.data || []).filter((u: any) => u.role !== 'admin');
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(emps[0].id);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchTimesheets = useCallback(async () => {
    if (!selectedEmployeeId) return;
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { 
        params: { employee_id: selectedEmployeeId } 
      });
      setTimesheets(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
    setRefreshing(false);
  }, [selectedEmployeeId]);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { 
    if (selectedEmployeeId) {
      setLoading(true);
      fetchTimesheets(); 
    }
  }, [selectedEmployeeId, fetchTimesheets]);

  useEffect(() => { generateFortnightView(); }, [timesheets, fortnightEnd]);

  const generateFortnightView = () => {
    const entries = [];
    const endDate = new Date(fortnightEnd);
    const tsMap = new Map();
    
    timesheets.forEach(ts => {
      const d = new Date(ts.clock_in);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      tsMap.set(key, ts);
    });

    for (let i = 13; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const existing = tsMap.get(dateKey);
      
      if (existing) {
        const clockIn = new Date(existing.clock_in);
        const clockOut = new Date(existing.clock_out);
        entries.push({
          date: dateKey,
          dayName: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],
          dayNum: date.getDate(),
          month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()],
          startTime: `${String(clockIn.getHours()).padStart(2,'0')}:${String(clockIn.getMinutes()).padStart(2,'0')}`,
          endTime: `${String(clockOut.getHours()).padStart(2,'0')}:${String(clockOut.getMinutes()).padStart(2,'0')}`,
          totalHours: existing.total_hours,
          breakMins: existing.break_minutes || 0,
          status: existing.approval_status,
          timesheetId: existing.id,
          hasData: true,
        });
      } else {
        entries.push({
          date: dateKey,
          dayName: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],
          dayNum: date.getDate(),
          month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()],
          startTime: '', endTime: '', totalHours: 0, breakMins: 0, status: '', timesheetId: null, hasData: false,
        });
      }
    }
    setFortnightEntries(entries);
  };

  const changeWeek = (dir: number) => {
    const d = new Date(fortnightEnd);
    d.setDate(d.getDate() + (dir * 7));
    setFortnightEnd(d);
  };

  const onRefresh = () => { setRefreshing(true); fetchTimesheets(); };
  
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const totalHours = fortnightEntries.reduce((s, e) => s + (e.totalHours || 0), 0);
  const entryCount = fortnightEntries.filter(e => e.hasData).length;

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditStart(entry.startTime || '09:00');
    setEditEnd(entry.endTime || '17:00');
    setEditBreak(String(entry.breakMins || 30));
  };

  const saveEntry = async () => {
    if (!editingEntry || !selectedEmployeeId) return;
    setSaving(true);
    try {
      if (editingEntry.timesheetId) {
        await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingEntry.timesheetId}`, {
          date: editingEntry.date, clock_in_time: editStart, clock_out_time: editEnd, break_minutes: parseInt(editBreak) || 0,
        });
      } else {
        await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`, {
          employee_id: selectedEmployeeId, date: editingEntry.date, clock_in_time: editStart, clock_out_time: editEnd, break_minutes: parseInt(editBreak) || 0,
        });
      }
      Alert.alert('Success', 'Saved');
      setEditingEntry(null);
      fetchTimesheets();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.detail || 'Failed'); }
    setSaving(false);
  };

  const deleteEntry = (entry: any) => {
    if (!entry.timesheetId) return;
    Alert.alert('Delete', `Delete ${entry.dayName} ${entry.dayNum} ${entry.month}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${entry.timesheetId}`);
          fetchTimesheets();
        } catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const approveEntry = async (entry: any) => {
    if (!entry.timesheetId) return;
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${entry.timesheetId}/approve`, { action: 'approved' });
      fetchTimesheets();
    } catch (e) { Alert.alert('Error', 'Failed'); }
  };

  if (loading && !refreshing) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Timesheet Manager</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{entryCount}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Employee Selector - Premium Button */}
      <TouchableOpacity style={styles.employeeSelector} onPress={() => setShowEmployeeModal(true)}>
        <View style={styles.employeeIcon}>
          <Ionicons name="person" size={20} color="#6366f1" />
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeLabel}>Employee</Text>
          <Text style={styles.employeeName}>
            {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Select employee'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#6366f1" />
      </TouchableOpacity>

      {/* Week Navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>Fortnight ending</Text>
          <Text style={styles.weekDate}>{fortnightEnd.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
        </View>
        <TouchableOpacity onPress={() => changeWeek(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView 
        style={styles.tableWrap}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}
      >
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: 70 }]}>Date</Text>
          <Text style={[styles.th, { width: 50 }]}>Start</Text>
          <Text style={[styles.th, { width: 50 }]}>End</Text>
          <Text style={[styles.th, { width: 45 }]}>Hrs</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Actions</Text>
        </View>

        {fortnightEntries.map((entry, idx) => (
          <View key={entry.date} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
            <View style={{ width: 70 }}>
              <Text style={styles.rowDay}>{entry.dayName}</Text>
              <Text style={styles.rowDate}>{entry.dayNum} {entry.month}</Text>
            </View>
            <Text style={[styles.rowTime, { width: 50 }]}>{entry.startTime || '—'}</Text>
            <Text style={[styles.rowTime, { width: 50 }]}>{entry.endTime || '—'}</Text>
            <Text style={[styles.rowHours, { width: 45 }]}>{entry.hasData ? entry.totalHours?.toFixed(1) : '—'}</Text>
            <View style={styles.rowActions}>
              {entry.hasData && entry.status === 'pending' && (
                <TouchableOpacity style={styles.btnApprove} onPress={() => approveEntry(entry)}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              {entry.hasData && entry.status === 'approved' && (
                <View style={styles.badgeApproved}><Ionicons name="checkmark-circle" size={14} color="#10b981" /></View>
              )}
              <TouchableOpacity style={styles.btnEdit} onPress={() => openEdit(entry)}>
                <Ionicons name="create-outline" size={14} color="#6366f1" />
              </TouchableOpacity>
              {entry.hasData && (
                <TouchableOpacity style={styles.btnDelete} onPress={() => deleteEntry(entry)}>
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Employee Selection Modal */}
      <Modal visible={showEmployeeModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.employeeModalContent}>
            <View style={styles.employeeModalHeader}>
              <Text style={styles.employeeModalTitle}>Select Employee</Text>
              <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.employeeItem, item.id === selectedEmployeeId && styles.employeeItemActive]}
                  onPress={() => { setSelectedEmployeeId(item.id); setShowEmployeeModal(false); }}
                >
                  <View style={styles.employeeItemAvatar}>
                    <Text style={styles.employeeItemInitials}>
                      {item.first_name[0]}{item.last_name[0]}
                    </Text>
                  </View>
                  <Text style={styles.employeeItemName}>{item.first_name} {item.last_name}</Text>
                  {item.id === selectedEmployeeId && (
                    <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingEntry} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>
              {editingEntry?.hasData ? 'Edit' : 'Add'} Entry
            </Text>
            <Text style={styles.editModalDate}>{editingEntry?.dayName} {editingEntry?.dayNum} {editingEntry?.month}</Text>
            
            <View style={styles.editRow}>
              <View style={styles.editCol}>
                <Text style={styles.editLabel}>Start</Text>
                <TextInput style={styles.editInput} value={editStart} onChangeText={setEditStart} placeholder="09:00" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={styles.editCol}>
                <Text style={styles.editLabel}>End</Text>
                <TextInput style={styles.editInput} value={editEnd} onChangeText={setEditEnd} placeholder="17:00" keyboardType="numbers-and-punctuation" />
              </View>
            </View>
            
            <Text style={styles.editLabel}>Break (mins)</Text>
            <TextInput style={styles.editInput} value={editBreak} onChangeText={setEditBreak} placeholder="30" keyboardType="numeric" />
            
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.editCancel} onPress={() => setEditingEntry(null)}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSave} onPress={saveEntry} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.editSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  
  header: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  employeeSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  employeeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  employeeInfo: { flex: 1, marginLeft: 12 },
  employeeLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  employeeName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  
  weekNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  weekInfo: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  weekDate: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  
  tableWrap: { flex: 1, marginTop: 12 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#e2e8f0' },
  th: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowAlt: { backgroundColor: '#fafafa' },
  rowDay: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  rowDate: { fontSize: 11, color: '#64748b' },
  rowTime: { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },
  rowHours: { fontSize: 14, fontWeight: '800', color: '#6366f1', textAlign: 'center' },
  rowActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  
  btnApprove: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  badgeApproved: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  btnEdit: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  btnDelete: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  
  employeeModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  employeeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  employeeModalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  employeeItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  employeeItemActive: { backgroundColor: '#eef2ff' },
  employeeItemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  employeeItemInitials: { fontSize: 14, fontWeight: '700', color: '#fff' },
  employeeItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b', marginLeft: 12 },
  
  editModal: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 40, borderRadius: 20, padding: 24 },
  editModalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  editModalDate: { fontSize: 15, color: '#6366f1', fontWeight: '600', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  editRow: { flexDirection: 'row', gap: 12 },
  editCol: { flex: 1 },
  editLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 12 },
  editInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 17, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  editCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  editCancelText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  editSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center' },
  editSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
