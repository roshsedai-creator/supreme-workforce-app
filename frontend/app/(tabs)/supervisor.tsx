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
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import axios from 'axios';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  job_title?: string;
}

interface Timesheet {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  break_minutes: number;
  notes: string;
  image?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export default function SupervisorScreen() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter by status
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // Employee picker modal
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  
  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Rejection modal (replaces Alert.prompt which doesn't work on Android)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingTimesheetId, setRejectingTimesheetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users`);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  // Fetch timesheets based on selected employee
  const fetchTimesheets = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedEmployee) {
        params.employee_id = selectedEmployee.id;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`,
        { params }
      );
      
      let data = response.data || [];
      
      // Add employee names
      const employeeMap = new Map(employees.map(e => [e.id, `${e.first_name} ${e.last_name}`]));
      data = data.map((ts: Timesheet) => ({
        ...ts,
        employee_name: employeeMap.get(ts.employee_id) || 'Unknown'
      }));
      
      // Sort by date descending
      data.sort((a: any, b: any) => new Date(b.clock_in || b.date).getTime() - new Date(a.clock_in || a.date).getTime());
      
      setTimesheets(data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEmployee, employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchTimesheets();
    }
  }, [employees, selectedEmployee, fetchTimesheets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimesheets();
  };

  // Approve timesheet
  const approveTimesheet = async (timesheetId: string) => {
    setActionLoading(timesheetId);
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${timesheetId}/approve`,
        { status: 'approved', approved_by: user?.id }
      );
      Alert.alert('Success', 'Timesheet approved');
      fetchTimesheets();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  // Open rejection modal
  const openRejectModal = (timesheetId: string) => {
    setRejectingTimesheetId(timesheetId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Submit rejection
  const submitRejection = async () => {
    if (!rejectingTimesheetId) return;
    
    setActionLoading(rejectingTimesheetId);
    setShowRejectModal(false);
    
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${rejectingTimesheetId}/approve`,
        { status: 'rejected', approved_by: user?.id, rejection_reason: rejectionReason }
      );
      Alert.alert('Success', 'Timesheet rejected');
      fetchTimesheets();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject timesheet');
    } finally {
      setActionLoading(null);
      setRejectingTimesheetId(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.warning;
    }
  };

  // Filtered employees by search
  const filteredEmployees = employees.filter(e => 
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  // Filtered timesheets
  const filteredTimesheets = filterStatus === 'all' 
    ? timesheets 
    : timesheets.filter(t => t.approval_status === filterStatus);

  // Calculate pay (simplified - $25/hr base rate)
  const calculatePay = (hours: number) => {
    return (hours * 25).toFixed(2);
  };

  // Stats
  const totalHours = filteredTimesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
  const totalPay = parseFloat(calculatePay(totalHours));
  const pendingCount = timesheets.filter(t => t.approval_status === 'pending').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Employee Dropdown */}
      <TouchableOpacity 
        style={styles.employeeDropdown}
        onPress={() => setShowEmployeePicker(true)}
      >
        <View style={styles.dropdownLeft}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>Employee</Text>
            <Text style={styles.dropdownValue}>
              {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'All Employees'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={22} color={colors.gray[400]} />
      </TouchableOpacity>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredTimesheets.length}</Text>
          <Text style={styles.statLabel}>Timesheets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>${totalPay}</Text>
          <Text style={styles.statLabel}>Est. Pay</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterTabs}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timesheets List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTimesheets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyText}>
              {selectedEmployee 
                ? `No ${filterStatus === 'all' ? '' : filterStatus} timesheets for ${selectedEmployee.first_name}`
                : `No ${filterStatus === 'all' ? '' : filterStatus} timesheets found`}
            </Text>
          </View>
        ) : (
          filteredTimesheets.map((timesheet) => (
            <View key={timesheet.id} style={styles.timesheetCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.employeeName}>{timesheet.employee_name}</Text>
                  <Text style={styles.dateText}>{formatDate(timesheet.clock_in)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(timesheet.approval_status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(timesheet.approval_status) }]}>
                    {timesheet.approval_status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.timeInfo}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <Text style={styles.timeValue}>{formatTime(timesheet.clock_in)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.gray[400]} />
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>End</Text>
                    <Text style={styles.timeValue}>{formatTime(timesheet.clock_out)}</Text>
                  </View>
                  <View style={styles.hoursBlock}>
                    <Text style={styles.hoursValue}>{(timesheet.total_hours || 0).toFixed(1)}h</Text>
                    <Text style={styles.payValue}>${calculatePay(timesheet.total_hours || 0)}</Text>
                  </View>
                </View>

                {timesheet.notes && (
                  <View style={styles.notesRow}>
                    <Ionicons name="document-text" size={14} color={colors.text.secondary} />
                    <Text style={styles.notesText} numberOfLines={2}>{timesheet.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {timesheet.image && (
                    <TouchableOpacity 
                      style={styles.viewImageBtn}
                      onPress={() => {
                        setViewingImage(timesheet.image!);
                        setShowImageModal(true);
                      }}
                    >
                      <Ionicons name="image" size={18} color={colors.primary} />
                      <Text style={styles.viewImageText}>View Image</Text>
                    </TouchableOpacity>
                  )}
                  
                  {timesheet.approval_status === 'pending' && (
                    <View style={styles.approvalButtons}>
                      <TouchableOpacity 
                        style={[styles.approveBtn, actionLoading === timesheet.id && styles.btnDisabled]}
                        onPress={() => approveTimesheet(timesheet.id)}
                        disabled={actionLoading === timesheet.id}
                      >
                        {actionLoading === timesheet.id ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color={colors.white} />
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.rejectBtn, actionLoading === timesheet.id && styles.btnDisabled]}
                        onPress={() => openRejectModal(timesheet.id)}
                        disabled={actionLoading === timesheet.id}
                      >
                        <Ionicons name="close" size={18} color={colors.error} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Employee Picker Modal */}
      <Modal
        visible={showEmployeePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmployeePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmployeePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              value={employeeSearch}
              onChangeText={setEmployeeSearch}
              placeholder="Search by name..."
              placeholderTextColor={colors.gray[400]}
            />
            {employeeSearch.length > 0 && (
              <TouchableOpacity onPress={() => setEmployeeSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.employeeList}>
            <TouchableOpacity 
              style={[styles.employeeItem, !selectedEmployee && styles.employeeItemSelected]}
              onPress={() => {
                setSelectedEmployee(null);
                setShowEmployeePicker(false);
                setEmployeeSearch('');
              }}
            >
              <View style={styles.employeeAvatar}>
                <Ionicons name="people" size={20} color={colors.primary} />
              </View>
              <Text style={styles.employeeItemName}>All Employees</Text>
              {!selectedEmployee && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>

            {filteredEmployees.map(employee => (
              <TouchableOpacity 
                key={employee.id}
                style={[styles.employeeItem, selectedEmployee?.id === employee.id && styles.employeeItemSelected]}
                onPress={() => {
                  setSelectedEmployee(employee);
                  setShowEmployeePicker(false);
                  setEmployeeSearch('');
                }}
              >
                <View style={styles.employeeAvatar}>
                  <Text style={styles.avatarText}>
                    {employee.first_name[0]}{employee.last_name[0]}
                  </Text>
                </View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeItemName}>
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <Text style={styles.employeeItemRole}>{employee.job_title || 'Employee'}</Text>
                </View>
                {selectedEmployee?.id === employee.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Reject Timesheet</Text>
            <Text style={styles.rejectModalSubtitle}>Please provide a reason for rejection:</Text>
            
            <TextInput
              style={styles.rejectReasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.rejectModalButtons}>
              <TouchableOpacity 
                style={styles.rejectModalCancelBtn}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.rejectModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectModalSubmitBtn}
                onPress={submitRejection}
              >
                <Text style={styles.rejectModalSubmitText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image View Modal */}
      <Modal
        visible={showImageModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <Ionicons name="close-circle" size={36} color={colors.white} />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownTextContainer: {
    gap: 2,
  },
  dropdownLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  timesheetCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: 14,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hoursBlock: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  payValue: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  viewImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
  viewImageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  approvalButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.success,
    borderRadius: 8,
  },
  approveBtnText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
  },
  rejectBtnText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  employeeList: {
    flex: 1,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  employeeItemSelected: {
    backgroundColor: colors.primary + '08',
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  employeeItemRole: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 1,
  },
  // Rejection modal
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rejectModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  rejectModalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  rejectReasonInput: {
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectModalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  rejectModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.gray[200],
  },
  rejectModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rejectModalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.error,
  },
  rejectModalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  // Image modal
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
