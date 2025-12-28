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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { colors } from '../constants/colors';

interface ReportsCenterProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'payroll' | 'timesheets' | 'abn';

export default function ReportsCenter({ visible, onClose }: ReportsCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('timesheets');
  const [sites, setSites] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  
  // Set default dates: last 30 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const reportTypes = [
    { id: 'timesheets', name: 'Timesheets', icon: 'time-outline', description: 'Hours & status' },
    { id: 'payroll', name: 'Payroll', icon: 'wallet-outline', description: 'Earnings' },
    { id: 'abn', name: 'Contractors', icon: 'briefcase-outline', description: 'ABN details' },
  ];

  useEffect(() => {
    if (visible) {
      loadData();
      setStartDate(getDefaultStartDate());
      setEndDate(new Date());
      setReportData(null);
      setSelectedEmployee('all');
      setSelectedSite('all');
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

  const generateReport = async () => {
    try {
      setLoading(true);
      setReportData(null);

      const params: any = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };

      if (selectedSite !== 'all') params.site_id = selectedSite;
      if (selectedEmployee !== 'all') params.employee_id = selectedEmployee;

      let response;
      let reportTitle = '';
      let summary = {};

      switch (selectedReport) {
        case 'payroll':
          reportTitle = 'Payroll Report';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/approved`, { params });
            summary = calculatePayrollSummary(response.data);
            setReportData({ title: reportTitle, data: response.data, summary });
          } catch (error) {
            setReportData({
              title: reportTitle,
              data: [],
              summary: { total_timesheets: 0, total_hours: '0.00', total_pay: '$0.00', employees: 0 },
            });
          }
          break;

        case 'timesheets':
          reportTitle = 'Timesheet Summary';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
            summary = calculateTimesheetSummary(response.data);
            setReportData({ title: reportTitle, data: response.data, summary });
          } catch (error) {
            setReportData({
              title: reportTitle,
              data: [],
              summary: { total_entries: 0, pending: 0, approved: 0, rejected: 0 },
            });
          }
          break;

        case 'abn':
          reportTitle = 'ABN Contractor Report';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`);
            const contractors = response.data.filter((u: any) => u.is_contractor && u.abn);
            const filteredContractors = selectedSite !== 'all'
              ? contractors.filter((c: any) => c.site_id === selectedSite)
              : contractors;
            setReportData({
              title: reportTitle,
              data: filteredContractors,
              summary: { total_contractors: filteredContractors.length, active: filteredContractors.length },
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to load contractor data');
          }
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollSummary = (data: any[]) => ({
    total_timesheets: data.length,
    total_hours: data.reduce((sum, t) => sum + (t.total_hours || 0), 0).toFixed(1),
    total_pay: '$' + data.reduce((sum, t) => sum + (t.total_pay || 0), 0).toFixed(2),
    employees: [...new Set(data.map((t) => t.employee_id))].length,
  });

  const calculateTimesheetSummary = (data: any[]) => ({
    total_entries: data.length,
    pending: data.filter((t) => t.approval_status === 'pending').length,
    approved: data.filter((t) => t.approval_status === 'approved').length,
    rejected: data.filter((t) => t.approval_status === 'rejected').length,
  });

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Reports Center</Text>
              <Text style={styles.headerSubtitle}>Generate detailed reports</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Report Type Selection */}
            <Text style={styles.sectionLabel}>Report Type</Text>
            <View style={styles.reportTypeRow}>
              {reportTypes.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportTypeCard,
                    selectedReport === report.id && styles.reportTypeCardActive,
                  ]}
                  onPress={() => setSelectedReport(report.id as ReportType)}
                >
                  <View style={[
                    styles.reportIconCircle,
                    selectedReport === report.id && styles.reportIconCircleActive
                  ]}>
                    <Ionicons
                      name={report.icon as any}
                      size={20}
                      color={selectedReport === report.id ? '#fff' : '#6366f1'}
                    />
                  </View>
                  <Text style={[
                    styles.reportTypeName,
                    selectedReport === report.id && styles.reportTypeNameActive
                  ]}>
                    {report.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filters Section */}
            <Text style={styles.sectionLabel}>Filters</Text>
            <View style={styles.filtersCard}>
              {/* Employee Filter */}
              <View style={styles.filterRow}>
                <View style={styles.filterIconBox}>
                  <Ionicons name="person-outline" size={18} color="#6366f1" />
                </View>
                <View style={styles.filterContent}>
                  <Text style={styles.filterLabel}>Employee</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                      style={styles.picker}
                      dropdownIconColor="#6b7280"
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
              </View>

              {/* Site Filter */}
              <View style={styles.filterRow}>
                <View style={styles.filterIconBox}>
                  <Ionicons name="location-outline" size={18} color="#6366f1" />
                </View>
                <View style={styles.filterContent}>
                  <Text style={styles.filterLabel}>Site</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedSite}
                      onValueChange={setSelectedSite}
                      style={styles.picker}
                      dropdownIconColor="#6b7280"
                    >
                      <Picker.Item label="All Sites" value="all" />
                      {sites.map((site) => (
                        <Picker.Item key={site.id} label={site.name} value={site.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              {/* Date Range */}
              <View style={styles.dateRangeRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>From</Text>
                  {Platform.OS === 'web' ? (
                    <View style={styles.dateInput}>
                      <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                      <input
                        type="date"
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) setStartDate(newDate);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: '15px',
                          color: '#1f2937',
                          outline: 'none',
                          flex: 1,
                          fontWeight: '500',
                        }}
                      />
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                        <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                      </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display="default"
                          onChange={handleStartDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </>
                  )}
                </View>

                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>To</Text>
                  {Platform.OS === 'web' ? (
                    <View style={styles.dateInput}>
                      <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                      <input
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) setEndDate(newDate);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: '15px',
                          color: '#1f2937',
                          outline: 'none',
                          flex: 1,
                          fontWeight: '500',
                        }}
                      />
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                        <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={endDate}
                          mode="date"
                          display="default"
                          onChange={handleEndDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
              onPress={generateReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Results Section */}
            {reportData && (
              <View style={styles.resultsCard}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>{reportData.title}</Text>
                  <View style={styles.recordsBadge}>
                    <Text style={styles.recordsBadgeText}>{reportData.data.length} records</Text>
                  </View>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsGrid}>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <View key={key} style={styles.statCard}>
                      <Text style={styles.statValue}>{String(value)}</Text>
                      <Text style={styles.statLabel}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Period Info */}
                <View style={styles.periodInfo}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.periodText}>
                    {formatDate(startDate)} — {formatDate(endDate)}
                  </Text>
                </View>

                {/* View Details */}
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => setShowDetailedView(!showDetailedView)}
                >
                  <Text style={styles.detailsBtnText}>
                    {showDetailedView ? 'Hide Details' : 'View Details'}
                  </Text>
                  <Ionicons 
                    name={showDetailedView ? 'chevron-up' : 'chevron-down'} 
                    size={18} 
                    color="#6366f1" 
                  />
                </TouchableOpacity>

                {/* Detailed Records */}
                {showDetailedView && (
                  <View style={styles.detailsList}>
                    {reportData.data.slice(0, 20).map((record: any, index: number) => (
                      <View key={index} style={styles.recordRow}>
                        {selectedReport === 'payroll' && (
                          <>
                            <View style={styles.recordMain}>
                              <Text style={styles.recordName}>
                                {record.employee_name || `${record.first_name} ${record.last_name}`}
                              </Text>
                              <Text style={styles.recordSub}>
                                {new Date(record.clock_in || record.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={styles.recordStats}>
                              <Text style={styles.recordHours}>{record.total_hours || 0}h</Text>
                              <Text style={styles.recordPay}>${record.total_pay || 0}</Text>
                            </View>
                          </>
                        )}
                        {selectedReport === 'timesheets' && (
                          <>
                            <View style={styles.recordMain}>
                              <Text style={styles.recordName}>{record.employee_name || 'Employee'}</Text>
                              <Text style={styles.recordSub}>
                                {new Date(record.clock_in).toLocaleDateString()} • {record.total_hours || 0}h
                              </Text>
                            </View>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: 
                                record.approval_status === 'approved' ? '#dcfce7' : 
                                record.approval_status === 'rejected' ? '#fee2e2' : '#fef3c7' 
                              }
                            ]}>
                              <Text style={[
                                styles.statusText,
                                { color: 
                                  record.approval_status === 'approved' ? '#15803d' : 
                                  record.approval_status === 'rejected' ? '#dc2626' : '#d97706' 
                                }
                              ]}>
                                {record.approval_status}
                              </Text>
                            </View>
                          </>
                        )}
                        {selectedReport === 'abn' && (
                          <>
                            <View style={styles.recordMain}>
                              <Text style={styles.recordName}>{record.first_name} {record.last_name}</Text>
                              <Text style={styles.recordSub}>ABN: {record.abn}</Text>
                            </View>
                            <Text style={styles.recordJob}>{record.job_title}</Text>
                          </>
                        )}
                      </View>
                    ))}
                    {reportData.data.length > 20 && (
                      <Text style={styles.moreText}>
                        Showing 20 of {reportData.data.length} records
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  reportTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  reportTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  reportTypeCardActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  reportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  reportIconCircleActive: {
    backgroundColor: '#6366f1',
  },
  reportTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  reportTypeNameActive: {
    color: '#4f46e5',
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterContent: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: '#1f2937',
    fontSize: 15,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  recordsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recordsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  periodText: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    gap: 6,
  },
  detailsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  detailsList: {
    marginTop: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recordMain: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recordSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  recordStats: {
    alignItems: 'flex-end',
  },
  recordHours: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recordPay: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  recordJob: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  moreText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});
