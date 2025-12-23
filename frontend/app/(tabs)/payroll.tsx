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
  Modal,
  SafeAreaView,
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
  const [periodType, setPeriodType] = useState<'week' | 'fortnight' | 'month' | 'all'>('week');
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0 = current, -1 = previous, etc.
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  
  // Employee Weekly View Modal
  const [showEmployeeWeekly, setShowEmployeeWeekly] = useState(false);
  const [weeklyEmployeeId, setWeeklyEmployeeId] = useState<string>('');
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

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

  // Fetch Employee Weekly Timesheet (Employment Hero style)
  const fetchEmployeeWeekly = async (employeeId: string) => {
    const { periodStart } = getPeriodDates();
    // Get Monday of the selected week
    const weekStart = startOfWeek(periodStart, { weekStartsOn: 1 });
    
    setLoadingWeekly(true);
    setWeeklyEmployeeId(employeeId);
    setShowEmployeeWeekly(true);
    
    try {
      const response = await axios.get(
        `${API_URL}/api/payroll/employee-weekly/${employeeId}?week_start=${weekStart.toISOString()}`
      );
      setWeeklyData(response.data);
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
      Alert.alert('Error', 'Failed to load weekly timesheet');
      setShowEmployeeWeekly(false);
    } finally {
      setLoadingWeekly(false);
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
          <Text style={styles.periodLabel}>
            {periodType === 'week' ? 'Week' : 
             periodType === 'fortnight' ? 'Fortnight' : 
             periodType === 'month' ? 'Month' : 'All Time'}
          </Text>
          <Text style={styles.periodDates}>
            {periodType === 'all' ? 'All Approved Timesheets' : 
              `${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd, yyyy')}`}
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
          {selectedEmployee !== 'all' && (
            <TouchableOpacity 
              style={styles.viewWeeklyButton}
              onPress={() => fetchEmployeeWeekly(selectedEmployee)}
            >
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.viewWeeklyText}>View Weekly</Text>
            </TouchableOpacity>
          )}
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

      {/* Employee Weekly Timesheet Modal */}
      <Modal
        visible={showEmployeeWeekly}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEmployeeWeekly(false)}
      >
        <SafeAreaView style={styles.weeklyModalContainer}>
          {/* Header */}
          <View style={styles.weeklyHeader}>
            <TouchableOpacity onPress={() => setShowEmployeeWeekly(false)}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.weeklyTitle}>Weekly Timesheet</Text>
            <View style={{ width: 28 }} />
          </View>

          {loadingWeekly ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : weeklyData ? (
            <ScrollView style={styles.weeklyContent}>
              {/* Employee Info */}
              <View style={styles.employeeInfoCard}>
                <View style={styles.employeeAvatar}>
                  <Ionicons name="person" size={32} color={colors.white} />
                </View>
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeNameLarge}>{weeklyData.employee.name}</Text>
                  <Text style={styles.employeeJob}>{weeklyData.employee.job_title || 'Employee'}</Text>
                </View>
              </View>

              {/* Week Period */}
              <View style={styles.weekPeriodCard}>
                <Text style={styles.weekPeriodLabel}>{weeklyData.week.label}</Text>
                <View style={styles.ratesRow}>
                  <Text style={styles.rateText}>Weekday: ${weeklyData.rates.weekday}/hr</Text>
                  <Text style={styles.rateText}>Sat: ${weeklyData.rates.saturday}/hr</Text>
                  <Text style={styles.rateText}>Sun: ${weeklyData.rates.sunday}/hr</Text>
                </View>
              </View>

              {/* Weekly Breakdown - Day by Day */}
              <View style={styles.daysContainer}>
                {weeklyData.breakdown.map((day: any) => (
                  <View 
                    key={day.day} 
                    style={[
                      styles.dayCard, 
                      !day.has_entries && styles.dayCardEmpty,
                      (day.day === 'Saturday' || day.day === 'Sunday') && styles.dayCardWeekend
                    ]}
                  >
                    <View style={styles.dayHeader}>
                      <View>
                        <Text style={styles.dayName}>{day.day}</Text>
                        <Text style={styles.dayDate}>{day.date_formatted}</Text>
                      </View>
                      <View style={styles.dayTotals}>
                        <Text style={styles.dayHours}>{day.total_hours}h</Text>
                        <Text style={styles.dayPay}>${day.total_pay.toFixed(2)}</Text>
                      </View>
                    </View>

                    {day.entries.length > 0 ? (
                      day.entries.map((entry: any, idx: number) => (
                        <View key={idx} style={styles.entryRow}>
                          <View style={styles.entryTime}>
                            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                            <Text style={styles.entryTimeText}>
                              {entry.clock_in} - {entry.clock_out}
                            </Text>
                          </View>
                          <View style={styles.entrySite}>
                            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                            <Text style={styles.entrySiteText}>{entry.site}</Text>
                          </View>
                          <View style={styles.entryDetails}>
                            <Text style={styles.entryHours}>{entry.hours}h @ ${entry.rate}/hr</Text>
                            {entry.is_manual && (
                              <View style={styles.manualBadge}>
                                <Text style={styles.manualBadgeText}>Manual</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noEntryText}>No work recorded</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.weeklySummaryCard}>
                <Text style={styles.summaryTitle}>Weekly Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelLarge}>Days Worked</Text>
                  <Text style={styles.summaryValueLarge}>{weeklyData.summary.days_worked}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelLarge}>Total Hours</Text>
                  <Text style={styles.summaryValueLarge}>{weeklyData.summary.total_hours}h</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                  <Text style={styles.summaryLabelTotal}>Total Pay</Text>
                  <Text style={styles.summaryValueTotal}>${weeklyData.summary.total_pay.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
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
  viewWeeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  viewWeeklyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // Weekly Modal Styles
  weeklyModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  weeklyContent: {
    flex: 1,
    padding: 16,
  },
  employeeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  employeeJob: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  weekPeriodCard: {
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  weekPeriodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  ratesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
  },
  rateText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dayCardEmpty: {
    borderLeftColor: colors.gray[300],
    opacity: 0.7,
  },
  dayCardWeekend: {
    borderLeftColor: colors.warning,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dayDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  dayTotals: {
    alignItems: 'flex-end',
  },
  dayHours: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  dayPay: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  entryRow: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  entryTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  entrySite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  entrySiteText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  entryHours: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  manualBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
  noEntryText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  weeklySummaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  summaryLabelLarge: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  summaryValueLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
});
