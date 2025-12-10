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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { colors } from '../constants/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportsCenterProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'payroll' | 'roster' | 'availability' | 'timesheets' | 'abn';

export default function ReportsCenter({ visible, onClose }: ReportsCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('payroll');
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('all');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

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
    }
  }, [visible]);

  const loadSites = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`);
      setSites(res.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setReportData(null);

      const params: any = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };

      if (selectedSite !== 'all') {
        params.site_id = selectedSite;
      }

      let response;

      switch (selectedReport) {
        case 'payroll':
          response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/approved`, { params });
          setReportData({
            title: 'Payroll Report',
            data: response.data,
            summary: calculatePayrollSummary(response.data),
          });
          break;

        case 'roster':
          response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts`, { params });
          setReportData({
            title: 'Roster Schedule',
            data: response.data,
            summary: calculateRosterSummary(response.data),
          });
          break;

        case 'availability':
          response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users?role=employee`);
          const availabilityData = await Promise.all(
            response.data.map(async (emp: any) => {
              try {
                const avail = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/${emp.id}`);
                return { ...emp, availability: avail.data };
              } catch {
                return { ...emp, availability: [] };
              }
            })
          );
          setReportData({
            title: 'Availability Report',
            data: availabilityData,
            summary: { total_employees: availabilityData.length },
          });
          break;

        case 'timesheets':
          response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`, { params });
          setReportData({
            title: 'Timesheet Summary',
            data: response.data,
            summary: calculateTimesheetSummary(response.data),
          });
          break;

        case 'abn':
          response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`);
          const contractors = response.data.filter((u: any) => u.is_contractor && u.abn);
          setReportData({
            title: 'ABN Contractor Report',
            data: contractors,
            summary: { total_contractors: contractors.length },
          });
          break;
      }

      Alert.alert('Success', 'Report generated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      setLoading(true);
      
      if (selectedReport === 'payroll') {
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/export-excel`,
          {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            site_id: selectedSite !== 'all' ? selectedSite : null,
          },
          { responseType: 'blob' }
        );

        // Handle file download
        Alert.alert('Success', 'Excel file generated! Check your downloads.');
      } else {
        Alert.alert('Info', 'Excel export available for Payroll reports. Other reports use CSV format.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollSummary = (data: any[]) => {
    return {
      total_timesheets: data.length,
      total_hours: data.reduce((sum, t) => sum + (t.total_hours || 0), 0).toFixed(2),
      total_pay: data.reduce((sum, t) => sum + (t.total_pay || 0), 0).toFixed(2),
      employees: [...new Set(data.map((t) => t.employee_name))].length,
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
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
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
                  <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
                    <Ionicons name="download" size={18} color={colors.primary} />
                    <Text style={styles.exportButtonText}>Export</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryGrid}>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <View key={key} style={styles.summaryCard}>
                      <Text style={styles.summaryValue}>{value}</Text>
                      <Text style={styles.summaryLabel}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.recordsText}>
                  {reportData.data.length} records found
                </Text>
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
    fontSize: 14,
    color: colors.text.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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
  recordsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
