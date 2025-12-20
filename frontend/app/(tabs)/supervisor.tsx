import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { getSupervisorDashboard, approveTimesheet, updateTimesheet, deleteTimesheet } from '../../utils/api';
import { colors } from '../../constants/colors';
import { format } from 'date-fns';
import SignaturePad, { SignaturePadRef } from '../../components/SignaturePad';

export default function SupervisorScreen() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureRef = useRef<SignaturePadRef>(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreakMinutes, setEditBreakMinutes] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');

  // Check permissions - deny access if user doesn't have supervisor permissions
  const permissions = user?.permissions || {};
  const canAccessSupervisor = permissions.view_all_timesheets === true || 
                               permissions.edit_timesheets === true || 
                               permissions.approve_timesheets === true || 
                               permissions.manage_roster === true;

  // If no supervisor permissions, show access denied message
  if (!canAccessSupervisor) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have permission to access the Supervisor panel.
          </Text>
          <Text style={styles.accessDeniedText}>
            Please contact your administrator if you need access.
          </Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getSupervisorDashboard(user?.site_id);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleApproval = async (status: 'approved' | 'rejected') => {
    if (!selectedTimesheet) return;

    // Require signature for approvals
    if (status === 'approved' && !signatureData) {
      Alert.alert('Signature Required', 'Please provide your signature to approve this timesheet.');
      setShowSignature(true);
      return;
    }

    setActionLoading(true);
    try {
      await approveTimesheet(
        selectedTimesheet.id, 
        user?.id || '', 
        status, 
        notes,
        status === 'approved' ? signatureData || undefined : undefined
      );
      Alert.alert('Success', `Timesheet ${status}!`);
      setShowModal(false);
      setNotes('');
      setSignatureData(null);
      setShowSignature(false);
      fetchDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || `Failed to ${status} timesheet`);
    } finally {
      setActionLoading(false);
    }
  };

  // Signature handlers
  const handleSignatureOK = (signature: string) => {
    setSignatureData(signature);
    setShowSignature(false);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSignatureEmpty = () => {
    Alert.alert('Error', 'Please provide a signature');
  };

  const handleEdit = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    
    try {
      const clockIn = new Date(timesheet.clock_in);
      const clockOut = timesheet.clock_out ? new Date(timesheet.clock_out) : new Date();
      
      setEditDate(format(clockIn, 'yyyy-MM-dd'));
      setEditStartTime(format(clockIn, 'HH:mm'));
      setEditEndTime(timesheet.clock_out ? format(clockOut, 'HH:mm') : '');
    } catch (error) {
      console.error('Error parsing dates:', error);
      const now = new Date();
      setEditDate(format(now, 'yyyy-MM-dd'));
      setEditStartTime('09:00');
      setEditEndTime('17:00');
    }
    
    setEditBreakMinutes(timesheet.break_minutes?.toString() || '0');
    setSupervisorNotes(timesheet.supervisor_notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTimesheet) return;

    if (!editDate || !editStartTime || !editEndTime) {
      Alert.alert('Error', 'Please fill in date, start time, and end time');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editStartTime) || !timeRegex.test(editEndTime)) {
      Alert.alert('Error', 'Please use HH:MM format (e.g., 09:00, 17:30)');
      return;
    }

    setActionLoading(true);
    try {
      const clockInISO = `${editDate}T${editStartTime}:00.000Z`;
      const clockOutISO = `${editDate}T${editEndTime}:00.000Z`;
      
      await updateTimesheet(selectedTimesheet.id, {
        manual_clock_in: clockInISO,
        manual_clock_out: clockOutISO,
        manual_break_minutes: parseInt(editBreakMinutes) || 0,
        employee_notes: supervisorNotes,
      });

      Alert.alert('Success', 'Timesheet updated by supervisor');
      setShowEditModal(false);
      fetchDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update timesheet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTimesheet = (timesheet: any) => {
    Alert.alert(
      'Delete Timesheet',
      'Are you sure you want to delete this timesheet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const result = await deleteTimesheet(timesheet.id);
              Alert.alert('Success', 'Timesheet deleted successfully');
              await fetchDashboard();
            } catch (error: any) {
              console.error('Delete timesheet error:', error);
              Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to delete timesheet');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderActiveEmployee = ({ item }: any) => {
    const clockIn = new Date(item.clock_in);
    const now = new Date();
    const hoursWorked = ((now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(1);

    return (
      <View style={styles.employeeCard}>
        <View style={styles.activeIndicator} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={styles.employeeId}>Employee ID: {item.employee_id.slice(-6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Clocked in at:</Text>
            <Text style={styles.infoValue}>{format(clockIn, 'h:mm a')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hours worked:</Text>
            <Text style={styles.infoValue}>{hoursWorked} hrs</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPendingTimesheet = ({ item }: any) => {
    const clockIn = new Date(item.clock_in);
    const clockOut = new Date(item.clock_out);

    return (
      <View style={styles.timesheetCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{format(clockIn, 'MMM dd, yyyy')}</Text>
            <Text style={styles.employeeName}>{item.employee_name || `ID: ${item.employee_id.slice(-6)}`}</Text>
            {item.is_manual_entry && (
              <View style={styles.manualBadge}>
                <Ionicons name="create-outline" size={12} color={colors.warning} />
                <Text style={styles.manualBadgeText}>Manual Entry</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>In</Text>
            <Text style={styles.timeValue}>{format(clockIn, 'h:mm a')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.gray[300]} />
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Out</Text>
            <Text style={styles.timeValue}>{format(clockOut, 'h:mm a')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={styles.statText}>{item.total_hours.toFixed(2)} hrs</Text>
          </View>
          {item.break_minutes > 0 && (
            <View style={styles.statBadge}>
              <Ionicons name="cafe" size={16} color={colors.warning} />
              <Text style={styles.statText}>{item.break_minutes} min</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteTimesheet(item)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.reviewBtn]}
            onPress={() => {
              setSelectedTimesheet(item);
              setShowModal(true);
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
            <Text style={styles.reviewBtnText}>Review & Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
      <View style={styles.statsHeader}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={32} color={colors.success} />
          <Text style={styles.statValue}>{dashboard?.active_employees || 0}</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="clipboard" size={32} color={colors.warning} />
          <Text style={styles.statValue}>{dashboard?.pending_approvals || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currently Clocked In</Text>
        {dashboard?.active_timesheets?.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {dashboard.active_timesheets.map((item: any) => (
              <View key={item.id}>
                {renderActiveEmployee({ item })}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="time-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No active employees</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Approvals ({dashboard?.pending_timesheets?.length || 0})</Text>
        {dashboard?.pending_timesheets && dashboard.pending_timesheets.length > 0 ? (
          dashboard.pending_timesheets.map((item: any) => (
            <View key={item.id}>
              {renderPendingTimesheet({ item })}
            </View>
          ))
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="checkmark-done-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        )}
      </View>
    </ScrollView>

    {/* Approval Modal */}
    <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowModal(false);
          setShowSignature(false);
          setSignatureData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showSignature ? 'Sign to Approve' : 'Review Timesheet'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                setShowSignature(false);
                setSignatureData(null);
              }}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {selectedTimesheet && !showSignature && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee ID:</Text>
                  <Text style={styles.detailValue}>{selectedTimesheet.employee_id.slice(-6)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(selectedTimesheet.clock_in), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hours:</Text>
                  <Text style={styles.detailValue}>{selectedTimesheet.total_hours.toFixed(2)} hrs</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Break:</Text>
                  <Text style={styles.detailValue}>{selectedTimesheet.break_minutes} min</Text>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes (optional)"
                  placeholderTextColor={colors.gray[400]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Signature Preview */}
                {signatureData && (
                  <View style={styles.signaturePreviewContainer}>
                    <Text style={styles.signatureLabel}>Your Signature:</Text>
                    <Image 
                      source={{ uri: signatureData }} 
                      style={styles.signaturePreview}
                      resizeMode="contain"
                    />
                    <TouchableOpacity 
                      style={styles.changeSignatureBtn}
                      onPress={() => {
                        setSignatureData(null);
                        setShowSignature(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                      <Text style={styles.changeSignatureText}>Change Signature</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton, actionLoading && styles.buttonDisabled]}
                    onPress={() => handleApproval('rejected')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton, actionLoading && styles.buttonDisabled]}
                    onPress={() => handleApproval('approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>
                          {signatureData ? 'Approve' : 'Sign & Approve'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Signature Capture Screen */}
            {showSignature && (
              <View style={styles.signatureContainer}>
                <Text style={styles.signatureInstructions}>
                  Please sign below to approve this timesheet
                </Text>
                
                <SignaturePad
                  ref={signatureRef}
                  onOK={handleSignatureOK}
                  onClear={() => {}}
                />
                
                {/* Custom buttons for signature */}
                <View style={styles.signatureButtons}>
                  <TouchableOpacity 
                    style={styles.clearSignatureBtn}
                    onPress={() => signatureRef.current?.clearSignature()}
                  >
                    <Ionicons name="refresh" size={20} color={colors.text.primary} />
                    <Text style={styles.clearSignatureText}>Clear</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmSignatureBtn}
                    onPress={() => signatureRef.current?.readSignature()}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={styles.confirmSignatureText}>Confirm Signature</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.backToReviewBtn}
                  onPress={() => setShowSignature(false)}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.primary} />
                  <Text style={styles.backToReviewText}>Back to Review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Timesheet</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD (e.g., 2024-12-09)"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.input}
                    value={editStartTime}
                    onChangeText={setEditStartTime}
                    placeholder="HH:MM"
                  />
                </View>

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    value={editEndTime}
                    onChangeText={setEditEndTime}
                    placeholder="HH:MM"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Break (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={editBreakMinutes}
                  onChangeText={setEditBreakMinutes}
                  keyboardType="number-pad"
                  placeholder="30"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supervisor Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={supervisorNotes}
                  onChangeText={setSupervisorNotes}
                  placeholder="Reason for edit..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.helpBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.helpText}>
                  Use 24-hour format. Example: 09:00, 17:30. This edit will be recorded.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statsHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  employeeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 220,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
  },
  cardContent: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  employeeId: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timesheetCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  notesInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  editBtn: {
    flex: 1,
    backgroundColor: colors.primary + '15',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteBtn: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: 12,
    minWidth: 48,
  },
  reviewBtn: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.gray[100],
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
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
  // Signature styles
  signatureContainer: {
    padding: 20,
  },
  signatureInstructions: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  signaturePadWrapper: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  signaturePreviewContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  signaturePreview: {
    width: '100%',
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  changeSignatureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    gap: 4,
  },
  changeSignatureText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  backToReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    gap: 8,
  },
  backToReviewText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  signatureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  clearSignatureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: colors.gray[200],
    borderRadius: 10,
    gap: 8,
  },
  clearSignatureText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  confirmSignatureBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: colors.success,
    borderRadius: 10,
    gap: 8,
  },
  confirmSignatureText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
