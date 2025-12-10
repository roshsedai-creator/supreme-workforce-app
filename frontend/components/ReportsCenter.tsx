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
  TextInput,
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

type ReportType = 'payroll' | 'roster' | 'availability' | 'timesheets' | 'abn';

export default function ReportsCenter({ visible, onClose }: ReportsCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('payroll');
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('all');
  
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
    { id: 'payroll', name: 'Payroll Report', icon: 'cash', description: 'Employee earnings and pay details' },
    { id: 'roster', name: 'Roster Schedule', icon: 'calendar', description: 'Upcoming shifts and assignments' },
    { id: 'availability', name: 'Availability Report', icon: 'people', description: 'Employee availability overview' },
    { id: 'timesheets', name: 'Timesheet Summary', icon: 'time', description: 'Clock-in/out records and hours' },
    { id: 'abn', name: 'ABN Contractor Report', icon: 'document-text', description: 'Contractor details and invoices' },
  ];

  useEffect(() => {
    if (visible) {
      loadSites();
      // Reset dates when modal opens
      setStartDate(getDefaultStartDate());
      setEndDate(new Date());
      setReportData(null);
    }
  }, [visible]);

  const loadSites = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`);
      setSites(res.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setReportData(null);

      console.log('Generating report:', selectedReport);
      console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      console.log('Site:', selectedSite);

      const params: any = {
        start_date: startDate.toISOString().split('T')[0], // Just date part
        end_date: endDate.toISOString().split('T')[0],
      };

      if (selectedSite !== 'all') {
        params.site_id = selectedSite;
      }

      let response;
      let reportTitle = '';
      let summary = {};

      switch (selectedReport) {
        case 'payroll':
          reportTitle = 'Payroll Report';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/approved`, { params });
            summary = calculatePayrollSummary(response.data);
            setReportData({
              title: reportTitle,
              data: response.data,
              summary: summary,
            });
          } catch (error) {
            console.error('Payroll API error:', error);
            Alert.alert('Note', 'No approved timesheets found for this period');
            setReportData({
              title: reportTitle,
              data: [],
              summary: { total_timesheets: 0, total_hours: '0.00', total_pay: '0.00', employees: 0 },
            });
          }
          break;

        case 'roster':
          reportTitle = 'Roster Schedule';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts`, { 
              params: {
                ...params,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
              }
            });
            summary = calculateRosterSummary(response.data);
            setReportData({
              title: reportTitle,
              data: response.data,
              summary: summary,
            });
          } catch (error) {
            console.error('Roster API error:', error);
            Alert.alert('Note', 'No roster shifts found for this period');
            setReportData({
              title: reportTitle,
              data: [],
              summary: { total_shifts: 0, scheduled: 0, completed: 0, unique_employees: 0 },
            });
          }
          break;

        case 'availability':
          reportTitle = 'Availability Report';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users?role=employee`);
            const employees = response.data;
            
            // Filter by site if needed
            const filteredEmployees = selectedSite !== 'all' 
              ? employees.filter((e: any) => e.site_id === selectedSite)
              : employees;
            
            setReportData({
              title: reportTitle,
              data: filteredEmployees,
              summary: { 
                total_employees: filteredEmployees.length,
                with_availability: filteredEmployees.length,
                sites: [...new Set(filteredEmployees.map((e: any) => e.site_id))].length
              },
            });
          } catch (error) {
            console.error('Availability API error:', error);
            Alert.alert('Error', 'Failed to load availability data');
          }
          break;

        case 'timesheets':
          reportTitle = 'Timesheet Summary';
          try {
            response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { 
              params: {
                ...params,
                site_id: selectedSite !== 'all' ? selectedSite : undefined
              }
            });
            summary = calculateTimesheetSummary(response.data);
            setReportData({
              title: reportTitle,
              data: response.data,
              summary: summary,
            });
          } catch (error) {
            console.error('Timesheets API error:', error);
            Alert.alert('Note', 'No timesheets found for this period');
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
            
            // Filter by site if needed
            const filteredContractors = selectedSite !== 'all'
              ? contractors.filter((c: any) => c.site_id === selectedSite)
              : contractors;
            
            setReportData({
              title: reportTitle,
              data: filteredContractors,
              summary: { 
                total_contractors: filteredContractors.length,
                active: filteredContractors.length,
              },
            });
          } catch (error) {
            console.error('ABN API error:', error);
            Alert.alert('Error', 'Failed to load contractor data');
          }
          break;
      }

      if (reportData || response) {
        Alert.alert('Success', `Report generated successfully!\n\nFound ${reportData?.data?.length || response?.data?.length || 0} records`);
      }
    } catch (error: any) {
      console.error('Report generation error:', error);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      setLoading(true);
      
      if (selectedReport === 'payroll') {
        const params = {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          site_id: selectedSite !== 'all' ? selectedSite : null,
        };
        
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/export-excel`,
          params,
          { responseType: 'blob' }
        );

        Alert.alert('Success', 'Excel file will be downloaded!');
      } else {
        Alert.alert('Export', `Export feature coming soon for ${selectedReport} reports.\n\nCurrently available for Payroll only.`);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollSummary = (data: any[]) => {
    return {
      total_timesheets: data.length,
      total_hours: data.reduce((sum, t) => sum + (t.total_hours || 0), 0).toFixed(2),
      total_pay: '$' + data.reduce((sum, t) => sum + (t.total_pay || 0), 0).toFixed(2),
      employees: [...new Set(data.map((t) => t.employee_id))].length,
    };
  };

  const calculateRosterSummary = (data: any[]) => {
    return {
      total_shifts: data.length,
      scheduled: data.filter((s) => s.status === 'scheduled').length,
      completed: data.filter((s) => s.status === 'completed').length,
      unique_employees: [...new Set(data.map((s) => s.employee_id))].length,
    };
  };

  const calculateTimesheetSummary = (data: any[]) => {
    return {
      total_entries: data.length,
      pending: data.filter((t) => t.approval_status === 'pending').length,
      approved: data.filter((t) => t.approval_status === 'approved').length,
      rejected: data.filter((t) => t.approval_status === 'rejected').length,
    };
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'ios'); // Keep open on iOS
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios'); // Keep open on iOS
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    setEndDate(currentDate);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Reports Center</Text>
              <Text style={styles.modalSubtitle}>Generate comprehensive business reports</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Report Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Report Type</Text>
              <View style={styles.reportGrid}>
                {reportTypes.map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    style={[
                      styles.reportCard,
                      selectedReport === report.id && styles.reportCardSelected,
                    ]}
                    onPress={() => setSelectedReport(report.id as ReportType)}
                  >
                    <Ionicons
                      name={report.icon as any}
                      size={32}
                      color={selectedReport === report.id ? colors.primary : colors.gray[400]}
                    />
                    <Text
                      style={[
                        styles.reportCardTitle,
                        selectedReport === report.id && styles.reportCardTitleSelected,
                      ]}
                    >
                      {report.name}
                    </Text>
                    <Text style={styles.reportCardDesc}>{report.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Filters</Text>

              {/* Site Filter */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Site</Text>
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

              {/* Date Range */}
              <View style={styles.dateRow}>
                <View style={styles.dateGroup}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {startDate.toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
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
                </View>

                <View style={styles.dateGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {endDate.toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
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
                </View>
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateButton, loading && styles.buttonDisabled]}
              onPress={generateReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color={colors.white} />
                  <Text style={styles.generateButtonText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Report Summary */}
            {reportData && (
              <View style={styles.summarySection}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>{reportData.title}</Text>
                  {selectedReport === 'payroll' && (
                    <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
                      <Ionicons name="download" size={18} color={colors.primary} />
                      <Text style={styles.exportButtonText}>Export</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.summaryGrid}>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <View key={key} style={styles.summaryCard}>
                      <Text style={styles.summaryValue}>{String(value)}</Text>
                      <Text style={styles.summaryLabel}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recordsInfo}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.recordsText}>
                    {reportData.data.length} records found
                  </Text>
                </View>

                <View style={styles.dateRangeInfo}>
                  <Text style={styles.dateRangeText}>
                    Period: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                  </Text>
                  {selectedSite !== 'all' && (
                    <Text style={styles.dateRangeText}>
                      Site: {sites.find(s => s.id === selectedSite)?.name || 'Selected Site'}
                    </Text>
                  )}
                </View>

                {/* View Details Button */}
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => setShowDetailedView(!showDetailedView)}
                >
                  <Ionicons 
                    name={showDetailedView ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.viewDetailsText}>
                    {showDetailedView ? 'Hide Details' : 'View Detailed Records'}
                  </Text>
                </TouchableOpacity>

                {/* Detailed View */}
                {showDetailedView && (
                  <View style={styles.detailedView}>
                    <Text style={styles.detailedTitle}>Detailed Records</Text>
                    <ScrollView style={styles.detailedScroll} nestedScrollEnabled>
                      {reportData.data.slice(0, 50).map((record: any, index: number) => (
                        <View key={index} style={styles.recordCard}>
                          {selectedReport === 'payroll' && (
                            <>
                              <Text style={styles.recordTitle}>{record.employee_name || record.first_name + ' ' + record.last_name}</Text>
                              <Text style={styles.recordDetail}>Hours: {record.total_hours || 0}</Text>
                              <Text style={styles.recordDetail}>Pay: ${record.total_pay || 0}</Text>
                              <Text style={styles.recordDetail}>Date: {new Date(record.clock_in || record.created_at).toLocaleDateString()}</Text>
                            </>
                          )}
                          {selectedReport === 'roster' && (
                            <>
                              <Text style={styles.recordTitle}>{record.employee_name}</Text>
                              <Text style={styles.recordDetail}>Site: {record.site_name}</Text>
                              <Text style={styles.recordDetail}>Role: {record.role}</Text>
                              <Text style={styles.recordDetail}>
                                {new Date(record.start_time).toLocaleString()} - {new Date(record.end_time).toLocaleTimeString()}
                              </Text>
                              <Text style={[styles.recordDetail, { color: colors.success }]}>
                                Status: {record.status}
                              </Text>
                            </>
                          )}
                          {selectedReport === 'availability' && (
                            <>
                              <Text style={styles.recordTitle}>{record.first_name} {record.last_name}</Text>
                              <Text style={styles.recordDetail}>Job: {record.job_title}</Text>
                              <Text style={styles.recordDetail}>Phone: {record.phone}</Text>
                              <Text style={styles.recordDetail}>Email: {record.email || 'N/A'}</Text>
                            </>
                          )}
                          {selectedReport === 'timesheets' && (
                            <>
                              <Text style={styles.recordTitle}>{record.employee_name || 'Employee'}</Text>
                              <Text style={styles.recordDetail}>Clock In: {new Date(record.clock_in).toLocaleString()}</Text>
                              {record.clock_out && (
                                <Text style={styles.recordDetail}>Clock Out: {new Date(record.clock_out).toLocaleString()}</Text>
                              )}
                              <Text style={styles.recordDetail}>Hours: {record.total_hours || 0}</Text>
                              <Text style={[styles.recordDetail, { 
                                color: record.approval_status === 'approved' ? colors.success : 
                                       record.approval_status === 'rejected' ? colors.error : colors.warning 
                              }]}>
                                Status: {record.approval_status}
                              </Text>
                            </>
                          )}
                          {selectedReport === 'abn' && (
                            <>
                              <Text style={styles.recordTitle}>{record.first_name} {record.last_name}</Text>
                              <Text style={styles.recordDetail}>ABN: {record.abn}</Text>
                              <Text style={styles.recordDetail}>Job: {record.job_title}</Text>
                              <Text style={styles.recordDetail}>Phone: {record.phone}</Text>
                            </>
                          )}
                        </View>
                      ))}
                      {reportData.data.length > 50 && (
                        <Text style={styles.moreRecordsText}>
                          Showing first 50 of {reportData.data.length} records
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportCard: {
    width: '48%',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  reportCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  reportCardTitleSelected: {
    color: colors.primary,
  },
  reportCardDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateGroup: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 10,
  },
  dateButtonText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  summarySection: {
    backgroundColor: colors.gray[50],
    padding: 20,
    borderRadius: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  recordsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recordsText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  dateRangeInfo: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  dateRangeText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailedView: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailedScroll: {
    maxHeight: 350,
  },
  recordCard: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  recordDetail: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 3,
  },
  moreRecordsText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 8,
  },
});
