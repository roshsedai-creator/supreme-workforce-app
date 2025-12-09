import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface PermissionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  permissions: any;
  setPermissions: (permissions: any) => void;
  employee: any;
  loading: boolean;
}

export default function PermissionsModal({
  visible,
  onClose,
  onSave,
  permissions,
  setPermissions,
  employee,
  loading,
}: PermissionsModalProps) {
  const permissionLabels = {
    view_own_pay: {
      title: 'View Own Pay',
      description: 'See their own pay rates and total earnings',
      icon: 'cash-outline',
    },
    view_all_timesheets: {
      title: 'View All Timesheets',
      description: 'Access timesheets of all employees',
      icon: 'documents-outline',
    },
    edit_timesheets: {
      title: 'Edit Timesheets',
      description: 'Manually edit timesheet entries',
      icon: 'create-outline',
    },
    approve_timesheets: {
      title: 'Approve Timesheets',
      description: 'Approve or reject employee timesheets',
      icon: 'checkmark-circle-outline',
    },
    view_reports: {
      title: 'View Reports',
      description: 'Access payroll and earnings reports',
      icon: 'stats-chart-outline',
    },
    manage_users: {
      title: 'Manage Users',
      description: 'Create, edit, and delete employee accounts',
      icon: 'people-outline',
    },
    manage_sites: {
      title: 'Manage Sites',
      description: 'Create and edit work sites/locations',
      icon: 'business-outline',
    },
    export_payroll: {
      title: 'Export Payroll',
      description: 'Generate and export payroll reports',
      icon: 'download-outline',
    },
  };

  const togglePermission = (key: string) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Manage Permissions</Text>
              {employee && (
                <Text style={styles.modalSubtitle}>
                  {employee.first_name} {employee.last_name} - {employee.role}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Control what this employee can access and do in the system
              </Text>
            </View>

            {Object.entries(permissionLabels).map(([key, data]: [string, any]) => (
              <View key={key} style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <Ionicons name={data.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>{data.title}</Text>
                  <Text style={styles.permissionDescription}>{data.description}</Text>
                </View>
                <Switch
                  value={permissions[key]}
                  onValueChange={() => togglePermission(key)}
                  trackColor={{ false: colors.gray[300], true: colors.primary + '60' }}
                  thumbColor={permissions[key] ? colors.primary : colors.gray[400]}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color={colors.white} />
                  <Text style={styles.saveButtonText}>Save Permissions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  modalBody: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
