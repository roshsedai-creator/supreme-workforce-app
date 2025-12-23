import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, addWeeks, addMonths } from 'date-fns';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PayrollScreen() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [periodType, setPeriodType] = useState<'week' | 'fortnight' | 'month' | 'all'>('fortnight');
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0 = current, -1 = previous, etc.
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');

  // Check permissions - deny access if user doesn't have payroll permissions
  const permissions = user?.permissions || {};
  const canAccessPayroll = permissions.export_payroll === true || permissions.manage_users === true || permissions.manage_sites === true;

  useEffect(() => {
    if (canAccessPayroll) {
      fetchData();
    }
  }, [periodType, currentPeriod, canAccessPayroll]);

  useEffect(() => {
    applyFilters();
  }, [timesheets, selectedEmployee, selectedSite]);

  // If no payroll permissions, show access denied message (AFTER hooks)
  if (!canAccessPayroll) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have permission to access Payroll reports.
          </Text>
          <Text style={styles.accessDeniedText}>
            Please contact your administrator if you need access.
          </Text>
        </View>
      </View>
    );
  }

  const getPeriodDates = () => {
    const now = new Date();
    
    // For "all" period, return a wide date range
    if (periodType === 'all') {
      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-12-31');
      return { periodStart, periodEnd };
    }
    
    // For "month", return current month
    if (periodType === 'month') {
      const monthsToAdd = currentPeriod;
      const periodStart = startOfMonth(addMonths(now, monthsToAdd));
      const periodEnd = endOfMonth(addMonths(now, monthsToAdd));
      return { periodStart, periodEnd };
    }
    
    const weeksToAdd = periodType === 'fortnight' ? currentPeriod * 2 : currentPeriod;
    const periodStart = startOfWeek(addWeeks(now, weeksToAdd), { weekStartsOn: 1 });
    const periodEnd = endOfWeek(addWeeks(periodStart, periodType === 'fortnight' ? 1 : 0), { weekStartsOn: 1 });
    return { periodStart, periodEnd };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { periodStart, periodEnd } = getPeriodDates();
      
      const [timesheetsRes, employeesRes, sitesRes] = await Promise.all([
        axios.get(`${API_URL}/api/timesheets`),
        axios.get(`${API_URL}/api/users`),
        axios.get(`${API_URL}/api/sites`),
      ]);

      // Filter timesheets by period and approved status
      const filtered = timesheetsRes.data.filter((ts: any) => {
        const clockIn = new Date(ts.clock_in);
        return clockIn >= periodStart && clockIn <= periodEnd && ts.approval_status === 'approved';
      });

      setTimesheets(filtered);
      setEmployees(employeesRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      Alert.alert('Error', 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...timesheets];

    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(ts => ts.employee_id === selectedEmployee);
    }

    if (selectedSite !== 'all') {
      filtered = filtered.filter(ts => ts.site_id === selectedSite);
    }

    setFilteredTimesheets(filtered);
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown';
  };

  const calculateTotals = () => {
    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (ts.total_hours || 0), 0);
    const totalPay = filteredTimesheets.reduce((sum, ts) => sum + (ts.total_pay || 0), 0);
    return { totalHours, totalPay };
  };

  const handleExportCSV = async () => {
    try {
      const { periodStart, periodEnd } = getPeriodDates();
      const response = await axios.post(`${API_URL}/api/payroll/export`, {
        start_date: periodStart.toISOString(),
        end_date: periodEnd.toISOString(),
        site_id: selectedSite !== 'all' ? selectedSite : null,
        employee_id: selectedEmployee !== 'all' ? selectedEmployee : null,
      });

      Alert.alert(
        'Payroll Exported',
        `Records: ${response.data.record_count}\nTotal Hours: ${response.data.total_hours.toFixed(2)}\nTotal Pay: $${response.data.total_pay.toFixed(2)}\n\nCSV includes site location for each entry.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export payroll');
    } finally {
      setExporting(false);
    }
  };

  const exportIndividualReport = async (employeeId: string) => {
    const { periodStart, periodEnd } = getPeriodDates();
    const employee = employees.find(e => e.id === employeeId);
    
    setExporting(true);
    try {
      const response = await axios.post(`${API_URL}/api/payroll/employee-report/${employeeId}`, {
        start_date: periodStart.toISOString(),
        end_date: periodEnd.toISOString(),
      });

      const { employee: emp, summary, period } = response.data;
      
      Alert.alert(
        `📊 ${emp.name}'s Pay Report`,
        `Period: ${period.start} to ${period.end}\n\n` +
        `Total Shifts: ${summary.total_shifts}\n` +
        `Total Hours: ${summary.total_hours.toFixed(2)}\n` +
        `Total Pay: $${summary.total_pay.toFixed(2)}\n\n` +
        `Sites Worked: ${summary.sites_worked.join(', ')}\n\n` +
        `Base Rate: $${emp.base_rate}/hr`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate employee report');
    } finally {
      setExporting(false);
    }
  };

  const renderTimesheet = ({ item }: any) => {
    const clockIn = new Date(item.clock_in);
    const clockOut = item.clock_out ? new Date(item.clock_out) : null;

    return (
      <View style={styles.timesheetCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.employeeName}>{getEmployeeName(item.employee_id)}</Text>
            <Text style={styles.siteName}>{getSiteName(item.site_id)}</Text>
          </View>
          <View style={styles.payBadge}>
            <Text style={styles.payAmount}>${item.total_pay?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeDetail}>
            <Text style={styles.timeLabel}>Date</Text>
            <Text style={styles.timeValue}>{format(clockIn, 'MMM dd')}</Text>
          </View>
          <View style={styles.timeDetail}>
            <Text style={styles.timeLabel}>Hours</Text>
            <Text style={styles.timeValue}>{item.total_hours?.toFixed(2) || '0'}</Text>
          </View>
          <View style={styles.timeDetail}>
            <Text style={styles.timeLabel}>Break</Text>
            <Text style={styles.timeValue}>{item.break_minutes || 0}m</Text>
          </View>
        </View>

        {item.manually_edited && (
          <View style={styles.editBadge}>
            <Ionicons name="create" size={12} color={colors.warning} />
            <Text style={styles.editText}>Manually Edited</Text>
          </View>
        )}
      </View>
    );
  };

  const { periodStart, periodEnd } = getPeriodDates();
  const { totalHours, totalPay } = calculateTotals();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={styles.periodButton}
          onPress={() => setCurrentPeriod(currentPeriod - 1)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.periodInfo}>
          <Text style={styles.periodLabel}>{periodType === 'week' ? 'Week' : 'Fortnight'}</Text>
          <Text style={styles.periodDates}>
            {format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd, yyyy')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.periodButton}
          onPress={() => setCurrentPeriod(currentPeriod + 1)}
          disabled={currentPeriod >= 0}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentPeriod >= 0 ? colors.gray[300] : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Period Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, periodType === 'week' && styles.toggleButtonActive]}
          onPress={() => setPeriodType('week')}
        >
          <Text style={[styles.toggleText, periodType === 'week' && styles.toggleTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, periodType === 'fortnight' && styles.toggleButtonActive]}
          onPress={() => setPeriodType('fortnight')}
        >
          <Text style={[styles.toggleText, periodType === 'fortnight' && styles.toggleTextActive]}>
            Fortnightly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, periodType === 'month' && styles.toggleButtonActive]}
          onPress={() => setPeriodType('month')}
        >
          <Text style={[styles.toggleText, periodType === 'month' && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, periodType === 'all' && styles.toggleButtonActive]}
          onPress={() => setPeriodType('all')}
        >
          <Text style={[styles.toggleText, periodType === 'all' && styles.toggleTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Employee</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedEmployee}
              onValueChange={(value) => setSelectedEmployee(value)}
              style={styles.picker}
            >
              <Picker.Item label="All Employees" value="all" />
              {employees.map((emp) => (
                <Picker.Item 
                  key={emp.id} 
                  label={`${emp.first_name} ${emp.last_name}`} 
                  value={emp.id} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Site</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSite}
              onValueChange={(value) => setSelectedSite(value)}
              style={styles.picker}
            >
              <Picker.Item label="All Sites" value="all" />
              {sites.map((site) => (
                <Picker.Item 
                  key={site.id} 
                  label={site.name} 
                  value={site.id} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredTimesheets.length}</Text>
          <Text style={styles.summaryLabel}>Timesheets</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Hours</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${totalPay.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Pay</Text>
        </View>
      </View>

      {/* Export Buttons */}
      <View style={styles.exportContainer}>
        <TouchableOpacity 
          style={[styles.exportButton, exporting && styles.buttonDisabled]} 
          onPress={handleExportCSV}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="download" size={20} color={colors.white} />
              <Text style={styles.exportText}>Export All CSV</Text>
            </>
          )}
        </TouchableOpacity>
        
        {selectedEmployee !== 'all' && (
          <TouchableOpacity 
            style={[styles.individualReportButton, exporting && styles.buttonDisabled]} 
            onPress={() => exportIndividualReport(selectedEmployee)}
            disabled={exporting}
          >
            <Ionicons name="person" size={20} color={colors.white} />
            <Text style={styles.exportText}>Employee Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timesheets List */}
      <FlatList
        data={filteredTimesheets}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderTimesheet}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No approved timesheets</Text>
            <Text style={styles.emptySubtext}>For this period</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  periodButton: {
    padding: 8,
  },
  periodInfo: {
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  periodDates: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  filtersRow: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  exportContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  individualReportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  exportText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  timesheetCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  siteName: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  payBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
  timeDetail: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.warning + '20',
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  editText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  filtersContainer: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
});
