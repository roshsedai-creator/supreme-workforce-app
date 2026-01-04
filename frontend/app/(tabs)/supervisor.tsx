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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

interface Employee { id: string; first_name: string; last_name: string; }
interface Timesheet {
  id: string;
  employee_id: string;
  employee_name?: string;
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
  
  // Fortnight dates
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

  // Generate fortnight entries when data changes
  useEffect(() => {
    generateFortnightView();
  }, [timesheets, fortnightEnd]);

  const generateFortnightView = () => {
    const entries = [];
    const endDate = new Date(fortnightEnd);
    
    // Create map of existing timesheets by date
    const tsMap = new Map();
    timesheets.forEach(ts => {
      const d = new Date(ts.clock_in);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      tsMap.set(key, ts);
    });

    // Generate 14 days ending on fortnightEnd
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
          dayName: getDayName(date),
          dayDate: `${date.getDate()} ${getMonthShort(date)}`,
          startTime: formatTime(clockIn),
          endTime: formatTime(clockOut),
          totalHours: existing.total_hours,
          breakMins: existing.break_minutes || 0,
          status: existing.approval_status,
          timesheetId: existing.id,
          hasData: true,
        });
      } else {
        entries.push({
          date: dateKey,
          dayName: getDayName(date),
          dayDate: `${date.getDate()} ${getMonthShort(date)}`,
          startTime: '',
          endTime: '',
          totalHours: 0,
          breakMins: 0,
          status: '',
          timesheetId: null,
          hasData: false,
        });
      }
    }
    setFortnightEntries(entries);
  };

  const getDayName = (d: Date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  const getMonthShort = (d: Date) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  const changeWeek = (direction: number) => {
    const newDate = new Date(fortnightEnd);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setFortnightEnd(newDate);
  };

  const onRefresh = () => { setRefreshing(true); fetchTimesheets(); };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const totalHours = fortnightEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
  const entryCount = fortnightEntries.filter(e => e.hasData).length;

  // Edit entry
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
        // Update existing
        await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingEntry.timesheetId}`, {
          date: editingEntry.date,
          clock_in_time: editStart,
          clock_out_time: editEnd,
          break_minutes: parseInt(editBreak) || 0,
        });
      } else {
        // Create new
        await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/manual`, {
          employee_id: selectedEmployeeId,
          date: editingEntry.date,
          clock_in_time: editStart,
          clock_out_time: editEnd,
          break_minutes: parseInt(editBreak) || 0,
        });
      }
      Alert.alert('Success', 'Saved');
      setEditingEntry(null);
      fetchTimesheets();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  // Delete entry
  const deleteEntry = async (entry: any) => {
    if (!entry.timesheetId) return;
    
    Alert.alert('Delete', `Delete timesheet for ${entry.dayName} ${entry.dayDate}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${entry.timesheetId}`);
          Alert.alert('Deleted', 'Timesheet removed');
          fetchTimesheets();
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.detail || 'Failed to delete');
        }
      }}
    ]);
  };

  // Approve entry
  const approveEntry = async (entry: any) => {
    if (!entry.timesheetId) return;
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${entry.timesheetId}/approve`, { action: 'approved' });
      fetchTimesheets();
    } catch (e) { Alert.alert('Error', 'Failed to approve'); }
  };

  if (loading && !refreshing) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Timesheet Manager</Text>
      </LinearGradient>

      {/* Employee Selector */}
      <View style={styles.selectorRow}>
        <TouchableOpacity onPress={() => {
          const idx = employees.findIndex(e => e.id === selectedEmployeeId);
          if (idx > 0) setSelectedEmployeeId(employees[idx - 1].id);
        }}>
          <Ionicons name="chevron-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedEmployeeId} onValueChange={setSelectedEmployeeId} style={styles.picker}>
            {employees.map(e => <Picker.Item key={e.id} label={`${e.first_name} ${e.last_name}`} value={e.id} />)}
          </Picker>
        </View>
        <TouchableOpacity onPress={() => {
          const idx = employees.findIndex(e => e.id === selectedEmployeeId);
          if (idx < employees.length - 1) setSelectedEmployeeId(employees[idx + 1].id);
        }}>
          <Ionicons name="chevron-forward" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Week Navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.weekBtn}>
          <Ionicons name="chevron-back" size={20} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          Fortnight ending {fortnightEnd.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeWeek(1)} style={styles.weekBtn}>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{entryCount}</Text>
          <Text style={styles.summaryLabel}>timesheets</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>total</Text>
        </View>
      </View>

      {/* Timesheet Table */}
      <ScrollView 
        style={styles.tableContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}
      >
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thDate]}>Date</Text>
          <Text style={[styles.th, styles.thTime]}>Start</Text>
          <Text style={[styles.th, styles.thTime]}>End</Text>
          <Text style={[styles.th, styles.thHours]}>Hours</Text>
          <Text style={[styles.th, styles.thActions]}>Actions</Text>
        </View>

        {/* Table Rows */}
        {fortnightEntries.map((entry, idx) => (
          <View key={entry.date} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
            <View style={styles.tdDate}>
              <Text style={styles.dayName}>{entry.dayName}</Text>
              <Text style={styles.dayDate}>{entry.dayDate}</Text>
            </View>
            <Text style={styles.tdTime}>{entry.startTime || '-'}</Text>
            <Text style={styles.tdTime}>{entry.endTime || '-'}</Text>
            <View style={styles.tdHours}>
              {entry.hasData ? (
                <Text style={styles.hoursText}>{entry.totalHours?.toFixed(1)}h</Text>
              ) : (
                <Text style={styles.noData}>-</Text>
              )}
            </View>
            <View style={styles.tdActions}>
              {entry.hasData && entry.status === 'pending' && (
                <TouchableOpacity style={styles.approveBtn} onPress={() => approveEntry(entry)}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              )}
              {entry.hasData && entry.status === 'approved' && (
                <View style={styles.approvedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                </View>
              )}
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(entry)}>
                <Ionicons name="create-outline" size={16} color="#6366f1" />
              </TouchableOpacity>
              {entry.hasData && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEntry(entry)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editingEntry} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEntry?.hasData ? 'Edit' : 'Add'} - {editingEntry?.dayName} {editingEntry?.dayDate}
            </Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={editStart}
                  onChangeText={setEditStart}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={editEnd}
                  onChangeText={setEditEnd}
                  placeholder="17:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            
            <Text style={styles.inputLabel}>Break (mins)</Text>
            <TextInput
              style={styles.input}
              value={editBreak}
              onChangeText={setEditBreak}
              placeholder="30"
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingEntry(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  
  selectorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  pickerWrap: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, marginHorizontal: 8 },
  picker: { height: 44, color: '#1e293b' },
  
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  weekBtn: { padding: 4 },
  weekText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  
  summaryRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  summaryBox: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#6366f1' },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  
  tableContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  thDate: { width: 80 },
  thTime: { width: 55, textAlign: 'center' },
  thHours: { width: 50, textAlign: 'center' },
  thActions: { flex: 1, textAlign: 'right' },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  
  tdDate: { width: 80 },
  dayName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  dayDate: { fontSize: 11, color: '#64748b' },
  
  tdTime: { width: 55, fontSize: 13, color: '#475569', textAlign: 'center', fontWeight: '500' },
  
  tdHours: { width: 50, alignItems: 'center' },
  hoursText: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  noData: { fontSize: 13, color: '#cbd5e1' },
  
  tdActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  approveBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  approvedBadge: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
  
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputCol: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16, color: '#1e293b', textAlign: 'center' },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#6366f1', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
