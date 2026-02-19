import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ReportsCenterProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'productivity' | 'payroll' | 'timesheets' | 'rooms';

export default function ReportsCenter({ visible, onClose }: ReportsCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('productivity');
  const [sites, setSites] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const reportTypes = [
    { id: 'productivity', name: 'Productivity', icon: 'trending-up', color: '#10b981', gradient: ['#10b981', '#059669'] },
    { id: 'payroll', name: 'Payroll', icon: 'wallet', color: '#6366f1', gradient: ['#6366f1', '#4f46e5'] },
    { id: 'timesheets', name: 'Timesheets', icon: 'time', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
    { id: 'rooms', name: 'Room Credits', icon: 'bed', color: '#ec4899', gradient: ['#ec4899', '#db2777'] },
  ];

  const periods = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'fortnight', name: 'Fortnight' },
    { id: 'month', name: 'This Month' },
  ];

  useEffect(() => {
    if (visible) {
      loadData();
      setReportData(null);
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [sitesRes, employeesRes] = await Promise.all([
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`),
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`)
      ]);
      setSites(sitesRes.data);
      setEmployees(employeesRes.data.filter((u: any) => u.role !== 'admin'));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'fortnight':
        start.setDate(now.getDate() - 14);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
    }
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    };
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    
    try {
      const dateRange = getDateRange();
      const params: any = { ...dateRange };
      
      if (selectedSite !== 'all') params.site_id = selectedSite;
      if (selectedEmployee !== 'all') params.employee_id = selectedEmployee;

      let data: any = { type: selectedReport };

      switch (selectedReport) {
        case 'productivity':
          data = await generateProductivityReport(params);
          break;
        case 'payroll':
          data = await generatePayrollReport(params);
          break;
        case 'timesheets':
          data = await generateTimesheetReport(params);
          break;
        case 'rooms':
          data = await generateRoomReport(params);
          break;
      }
      
      setReportData(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateProductivityReport = async (params: any) => {
    // Get timesheets
    const timesheetsRes = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
    const timesheets = timesheetsRes.data;
    
    // Get room cleaning entries
    const roomsRes = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/room-cleaning`, { params });
    const rooms = roomsRes.data;
    
    // Calculate totals
    const totalTimesheetHours = timesheets.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
    const totalRoomMinutes = rooms.reduce((sum: number, r: any) => sum + (r.total_minutes || 0), 0);
    const totalRoomHours = totalRoomMinutes / 60;
    const variance = totalTimesheetHours - totalRoomHours;
    const efficiency = totalTimesheetHours > 0 ? (totalRoomHours / totalTimesheetHours) * 100 : 0;
    
    // Group by employee
    const employeeMap: any = {};
    
    timesheets.forEach((ts: any) => {
      if (!employeeMap[ts.employee_id]) {
        employeeMap[ts.employee_id] = {
          employee_id: ts.employee_id,
          employee_name: ts.employee_name || 'Unknown',
          timesheet_hours: 0,
          room_hours: 0,
          room_count: 0,
        };
      }
      employeeMap[ts.employee_id].timesheet_hours += ts.total_hours || 0;
    });
    
    rooms.forEach((r: any) => {
      if (!employeeMap[r.employee_id]) {
        employeeMap[r.employee_id] = {
          employee_id: r.employee_id,
          employee_name: 'Unknown',
          timesheet_hours: 0,
          room_hours: 0,
          room_count: 0,
        };
      }
      employeeMap[r.employee_id].room_hours += (r.total_minutes || 0) / 60;
      employeeMap[r.employee_id].room_count += r.count || 0;
    });
    
    const employeeData = Object.values(employeeMap).map((emp: any) => ({
      ...emp,
      variance: emp.timesheet_hours - emp.room_hours,
      efficiency: emp.timesheet_hours > 0 ? Math.round((emp.room_hours / emp.timesheet_hours) * 100) : 0,
    }));

    return {
      type: 'productivity',
      summary: {
        totalTimesheetHours: totalTimesheetHours.toFixed(1),
        totalRoomHours: totalRoomHours.toFixed(1),
        variance: variance.toFixed(1),
        efficiency: Math.round(efficiency),
        totalRooms: rooms.reduce((sum: number, r: any) => sum + (r.count || 0), 0),
        employeeCount: Object.keys(employeeMap).length,
      },
      employees: employeeData.sort((a: any, b: any) => b.efficiency - a.efficiency),
    };
  };

  const generatePayrollReport = async (params: any) => {
    const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
    const timesheets = res.data.filter((t: any) => t.approval_status === 'approved');
    
    const totalHours = timesheets.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
    const totalPay = timesheets.reduce((sum: number, t: any) => sum + (t.total_pay || 0), 0);
    
    // Group by employee
    const employeeMap: any = {};
    timesheets.forEach((ts: any) => {
      if (!employeeMap[ts.employee_id]) {
        employeeMap[ts.employee_id] = {
          name: ts.employee_name || 'Unknown',
          hours: 0,
          pay: 0,
          shifts: 0,
        };
      }
      employeeMap[ts.employee_id].hours += ts.total_hours || 0;
      employeeMap[ts.employee_id].pay += ts.total_pay || 0;
      employeeMap[ts.employee_id].shifts += 1;
    });

    return {
      type: 'payroll',
      summary: {
        totalHours: totalHours.toFixed(1),
        totalPay: totalPay.toFixed(2),
        avgHourlyRate: totalHours > 0 ? (totalPay / totalHours).toFixed(2) : '0.00',
        employeeCount: Object.keys(employeeMap).length,
        totalShifts: timesheets.length,
      },
      employees: Object.entries(employeeMap).map(([id, data]: any) => ({
        id,
        ...data,
        avgRate: data.hours > 0 ? (data.pay / data.hours).toFixed(2) : '0.00',
      })).sort((a: any, b: any) => b.pay - a.pay),
    };
  };

  const generateTimesheetReport = async (params: any) => {
    const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
    const timesheets = res.data;
    
    const pending = timesheets.filter((t: any) => t.approval_status === 'pending').length;
    const approved = timesheets.filter((t: any) => t.approval_status === 'approved').length;
    const rejected = timesheets.filter((t: any) => t.approval_status === 'rejected').length;
    
    return {
      type: 'timesheets',
      summary: {
        total: timesheets.length,
        pending,
        approved,
        rejected,
        approvalRate: timesheets.length > 0 ? Math.round((approved / timesheets.length) * 100) : 0,
      },
      entries: timesheets.slice(0, 20),
    };
  };

  const generateRoomReport = async (params: any) => {
    const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/room-cleaning`, { params });
    const rooms = res.data;
    
    const totalRooms = rooms.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
    const totalMinutes = rooms.reduce((sum: number, r: any) => sum + (r.total_minutes || 0), 0);
    
    // Group by room type
    const roomTypeMap: any = {};
    rooms.forEach((r: any) => {
      const key = `${r.room_type_name}-${r.status}`;
      if (!roomTypeMap[key]) {
        roomTypeMap[key] = {
          roomType: r.room_type_name,
          status: r.status,
          count: 0,
          minutes: 0,
        };
      }
      roomTypeMap[key].count += r.count || 0;
      roomTypeMap[key].minutes += r.total_minutes || 0;
    });

    return {
      type: 'rooms',
      summary: {
        totalRooms,
        totalHours: (totalMinutes / 60).toFixed(1),
        avgMinutesPerRoom: totalRooms > 0 ? Math.round(totalMinutes / totalRooms) : 0,
        uniqueTypes: Object.keys(roomTypeMap).length,
      },
      breakdown: Object.values(roomTypeMap).sort((a: any, b: any) => b.count - a.count),
    };
  };

  const renderProductivityReport = () => {
    if (!reportData || reportData.type !== 'productivity') return null;
    
    const { summary, employees } = reportData;
    
    return (
      <View style={styles.reportContent}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="time" size={24} color="#6366f1" />
            <Text style={styles.summaryValue}>{summary.totalTimesheetHours}h</Text>
            <Text style={styles.summaryLabel}>Timesheet Hours</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="bed" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>{summary.totalRoomHours}h</Text>
            <Text style={styles.summaryLabel}>Room Credit Hours</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: parseFloat(summary.variance) >= 0 ? '#dcfce7' : '#fef2f2' }]}>
            <Ionicons name={parseFloat(summary.variance) >= 0 ? 'trending-up' : 'trending-down'} size={24} color={parseFloat(summary.variance) >= 0 ? '#10b981' : '#ef4444'} />
            <Text style={[styles.summaryValue, { color: parseFloat(summary.variance) >= 0 ? '#10b981' : '#ef4444' }]}>
              {parseFloat(summary.variance) >= 0 ? '+' : ''}{summary.variance}h
            </Text>
            <Text style={styles.summaryLabel}>Variance</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="speedometer" size={24} color="#f59e0b" />
            <Text style={styles.summaryValue}>{summary.efficiency}%</Text>
            <Text style={styles.summaryLabel}>Efficiency</Text>
          </View>
        </View>

        {/* Employee Breakdown */}
        <Text style={styles.reportSectionTitle}>Employee Performance</Text>
        {employees.map((emp: any, index: number) => (
          <View key={emp.employee_id || index} style={styles.employeeRow}>
            <View style={styles.employeeRank}>
              <Text style={styles.employeeRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{emp.employee_name}</Text>
              <View style={styles.employeeStats}>
                <Text style={styles.employeeStat}>⏱️ {emp.timesheet_hours.toFixed(1)}h</Text>
                <Text style={styles.employeeStat}>🛏️ {emp.room_hours.toFixed(1)}h</Text>
                <Text style={styles.employeeStat}>🚪 {emp.room_count} rooms</Text>
              </View>
            </View>
            <View style={[styles.efficiencyBadge, { backgroundColor: emp.efficiency >= 80 ? '#dcfce7' : emp.efficiency >= 60 ? '#fef3c7' : '#fef2f2' }]}>
              <Text style={[styles.efficiencyText, { color: emp.efficiency >= 80 ? '#10b981' : emp.efficiency >= 60 ? '#f59e0b' : '#ef4444' }]}>
                {emp.efficiency}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPayrollReport = () => {
    if (!reportData || reportData.type !== 'payroll') return null;
    
    const { summary, employees } = reportData;
    
    return (
      <View style={styles.reportContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="cash" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>${summary.totalPay}</Text>
            <Text style={styles.summaryLabel}>Total Pay</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="time" size={24} color="#6366f1" />
            <Text style={styles.summaryValue}>{summary.totalHours}h</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="calculator" size={24} color="#f59e0b" />
            <Text style={styles.summaryValue}>${summary.avgHourlyRate}/h</Text>
            <Text style={styles.summaryLabel}>Avg Rate</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fce7f3' }]}>
            <Ionicons name="people" size={24} color="#ec4899" />
            <Text style={styles.summaryValue}>{summary.employeeCount}</Text>
            <Text style={styles.summaryLabel}>Employees</Text>
          </View>
        </View>

        <Text style={styles.reportSectionTitle}>Employee Earnings</Text>
        {employees.map((emp: any, index: number) => (
          <View key={emp.id || index} style={styles.employeeRow}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{emp.name}</Text>
              <View style={styles.employeeStats}>
                <Text style={styles.employeeStat}>{emp.hours.toFixed(1)}h • {emp.shifts} shifts</Text>
              </View>
            </View>
            <Text style={styles.payAmount}>${emp.pay.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTimesheetReport = () => {
    if (!reportData || reportData.type !== 'timesheets') return null;
    
    const { summary } = reportData;
    
    return (
      <View style={styles.reportContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="documents" size={24} color="#6366f1" />
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total Entries</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="hourglass" size={24} color="#f59e0b" />
            <Text style={styles.summaryValue}>{summary.pending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>{summary.approved}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
            <Text style={styles.summaryValue}>{summary.rejected}</Text>
            <Text style={styles.summaryLabel}>Rejected</Text>
          </View>
        </View>

        <View style={styles.approvalRateCard}>
          <Text style={styles.approvalRateLabel}>Approval Rate</Text>
          <Text style={styles.approvalRateValue}>{summary.approvalRate}%</Text>
          <View style={styles.approvalBar}>
            <View style={[styles.approvalBarFill, { width: `${summary.approvalRate}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderRoomReport = () => {
    if (!reportData || reportData.type !== 'rooms') return null;
    
    const { summary, breakdown } = reportData;
    
    return (
      <View style={styles.reportContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#fce7f3' }]}>
            <Ionicons name="bed" size={24} color="#ec4899" />
            <Text style={styles.summaryValue}>{summary.totalRooms}</Text>
            <Text style={styles.summaryLabel}>Total Rooms</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="time" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>{summary.totalHours}h</Text>
            <Text style={styles.summaryLabel}>Total Credits</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="speedometer" size={24} color="#6366f1" />
            <Text style={styles.summaryValue}>{summary.avgMinutesPerRoom}m</Text>
            <Text style={styles.summaryLabel}>Avg/Room</Text>
          </View>
        </View>

        <Text style={styles.reportSectionTitle}>Breakdown by Type</Text>
        {breakdown.map((item: any, index: number) => (
          <View key={index} style={styles.roomBreakdownRow}>
            <View style={styles.roomBreakdownInfo}>
              <Text style={styles.roomBreakdownType}>{item.roomType}</Text>
              <Text style={styles.roomBreakdownStatus}>
                {item.status === 'departure' ? '🚪 Departure' : 
                 item.status === 'linen_change' ? '🛏️ Linen' : '🧹 Stayover'}
              </Text>
            </View>
            <View style={styles.roomBreakdownStats}>
              <Text style={styles.roomBreakdownCount}>×{item.count}</Text>
              <Text style={styles.roomBreakdownMinutes}>{item.minutes}m</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Premium Header */}
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Reports Center</Text>
              <Text style={styles.headerSubtitle}>Analytics & Insights</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Type Selection */}
          <Text style={styles.sectionLabel}>Select Report</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportTypeScroll}>
            {reportTypes.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportTypeCard, selectedReport === report.id && styles.reportTypeCardActive]}
                onPress={() => setSelectedReport(report.id as ReportType)}
              >
                <LinearGradient
                  colors={selectedReport === report.id ? report.gradient : ['#f8fafc', '#f1f5f9']}
                  style={styles.reportTypeGradient}
                >
                  <Ionicons
                    name={report.icon as any}
                    size={28}
                    color={selectedReport === report.id ? '#fff' : report.color}
                  />
                  <Text style={[styles.reportTypeName, selectedReport === report.id && styles.reportTypeNameActive]}>
                    {report.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filters */}
          <Text style={styles.sectionLabel}>Filters</Text>
          <View style={styles.filtersCard}>
            {/* Period */}
            <View style={styles.filterRow}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
              <Text style={styles.filterLabel}>Period</Text>
              <View style={styles.periodChips}>
                {periods.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.periodChip, selectedPeriod === p.id && styles.periodChipActive]}
                    onPress={() => setSelectedPeriod(p.id)}
                  >
                    <Text style={[styles.periodChipText, selectedPeriod === p.id && styles.periodChipTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Employee */}
            <View style={styles.filterRow}>
              <Ionicons name="person" size={20} color="#6366f1" />
              <Text style={styles.filterLabel}>Employee</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  style={styles.picker}
                >
                  <Picker.Item label="All Employees" value="all" />
                  {employees.map((emp) => (
                    <Picker.Item key={emp.id} label={`${emp.first_name} ${emp.last_name}`} value={emp.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Site */}
            <View style={styles.filterRow}>
              <Ionicons name="business" size={20} color="#6366f1" />
              <Text style={styles.filterLabel}>Site</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedSite}
                  onValueChange={setSelectedSite}
                  style={styles.picker}
                >
                  <Picker.Item label="All Sites" value="all" />
                  {sites.map((site) => (
                    <Picker.Item key={site.id} label={site.name} value={site.id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity style={styles.generateBtn} onPress={generateReport} disabled={loading}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.generateBtnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Report Results */}
          {reportData && (
            <View style={styles.reportResults}>
              <Text style={styles.reportResultsTitle}>
                {selectedReport === 'productivity' && '📊 Productivity Report'}
                {selectedReport === 'payroll' && '💰 Payroll Report'}
                {selectedReport === 'timesheets' && '⏱️ Timesheet Report'}
                {selectedReport === 'rooms' && '🛏️ Room Credits Report'}
              </Text>
              
              {renderProductivityReport()}
              {renderPayrollReport()}
              {renderTimesheetReport()}
              {renderRoomReport()}
            </View>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportTypeScroll: {
    marginBottom: 16,
  },
  reportTypeCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reportTypeCardActive: {
    transform: [{ scale: 1.02 }],
  },
  reportTypeGradient: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  reportTypeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  reportTypeNameActive: {
    color: '#fff',
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 8,
  },
  periodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  periodChipActive: {
    backgroundColor: '#6366f1',
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  periodChipTextActive: {
    color: '#fff',
  },
  pickerWrapper: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  generateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  reportResults: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  reportResultsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
  },
  reportContent: {},
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: (width - 84) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  employeeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  employeeStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  employeeStat: {
    fontSize: 12,
    color: '#64748b',
  },
  efficiencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  efficiencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  payAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  approvalRateCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  approvalRateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  approvalRateValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10b981',
    marginVertical: 8,
  },
  approvalBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  approvalBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  roomBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomBreakdownInfo: {},
  roomBreakdownType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  roomBreakdownStatus: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roomBreakdownStats: {
    alignItems: 'flex-end',
  },
  roomBreakdownCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
  },
  roomBreakdownMinutes: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
