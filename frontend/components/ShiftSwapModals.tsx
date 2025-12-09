import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../constants/colors';

interface ShiftSwapRequestModalProps {
  visible: boolean;
  onClose: () => void;
  selectedShift: any;
  employees: any[];
  swapToEmployee: string;
  setSwapToEmployee: (id: string) => void;
  swapReason: string;
  setSwapReason: (reason: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ShiftSwapRequestModal({
  visible,
  onClose,
  selectedShift,
  employees,
  swapToEmployee,
  setSwapToEmployee,
  swapReason,
  setSwapReason,
  onSubmit,
  loading,
}: ShiftSwapRequestModalProps) {
  if (!selectedShift) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Shift Swap</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.shiftInfo}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={styles.shiftDetails}>
                <Text style={styles.shiftText}>
                  {new Date(selectedShift.start_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.shiftSubtext}>
                  {selectedShift.site_name} • {selectedShift.role}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Swap With *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={swapToEmployee}
                  onValueChange={setSwapToEmployee}
                  style={styles.picker}
                >
                  <Picker.Item label="Select an employee..." value="" />
                  {employees.map((emp: any) => (
                    <Picker.Item
                      key={emp.id}
                      label={`${emp.first_name} ${emp.last_name} - ${emp.job_title}`}
                      value={emp.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={swapReason}
                onChangeText={setSwapReason}
                placeholder="Why do you want to swap this shift?"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Your swap request will be sent to the supervisor for approval
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, (!swapToEmployee || loading) && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={!swapToEmployee || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={20} color={colors.white} />
                  <Text style={styles.submitButtonText}>Request Swap</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface SwapRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  swapRequests: any[];
  isSupervisor: boolean;
  onApprove: (swapId: string) => void;
  onReject: (swapId: string) => void;
  loading: boolean;
}

export function SwapRequestsModal({
  visible,
  onClose,
  swapRequests,
  isSupervisor,
  onApprove,
  onReject,
  loading,
}: SwapRequestsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isSupervisor ? 'Pending Swap Requests' : 'My Swap Requests'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {swapRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="swap-horizontal-outline" size={64} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No pending swap requests</Text>
              </View>
            ) : (
              swapRequests.map((swap: any) => (
                <View key={swap.id} style={styles.swapCard}>
                  <View style={styles.swapHeader}>
                    <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                    <Text style={styles.swapTitle}>Shift Swap Request</Text>
                  </View>

                  <View style={styles.swapDetails}>
                    <Text style={styles.swapLabel}>From:</Text>
                    <Text style={styles.swapValue}>{swap.from_employee_name}</Text>
                  </View>

                  <View style={styles.swapDetails}>
                    <Text style={styles.swapLabel}>To:</Text>
                    <Text style={styles.swapValue}>{swap.to_employee_name}</Text>
                  </View>

                  {swap.shift_details && (
                    <View style={styles.swapDetails}>
                      <Text style={styles.swapLabel}>Shift:</Text>
                      <Text style={styles.swapValue}>
                        {new Date(swap.shift_details.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}

                  {swap.reason && (
                    <View style={styles.swapDetails}>
                      <Text style={styles.swapLabel}>Reason:</Text>
                      <Text style={styles.swapValue}>{swap.reason}</Text>
                    </View>
                  )}

                  {isSupervisor && (
                    <View style={styles.swapActions}>
                      <TouchableOpacity
                        style={[styles.swapButton, styles.rejectButton]}
                        onPress={() => onReject(swap.id)}
                        disabled={loading}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.white} />
                        <Text style={styles.swapButtonText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.swapButton, styles.approveButton]}
                        onPress={() => onApprove(swap.id)}
                        disabled={loading}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                        <Text style={styles.swapButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 24,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  shiftSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
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
  textArea: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: 16,
    fontSize: 15,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  swapCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  swapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  swapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  swapDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  swapLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 80,
  },
  swapValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  swapActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  swapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  swapButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
