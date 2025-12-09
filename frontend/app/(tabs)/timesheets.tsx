import React, { useState, useEffect } from 'react';
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
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { getTimesheets, updateTimesheet } from '../../utils/api';
import { colors } from '../../constants/colors';
import { format } from 'date-fns';

export default function TimesheetsScreen() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  
  // Simple time inputs (HH:MM format)
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreakMinutes, setEditBreakMinutes] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Photo modal states
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const data = await getTimesheets(user?.id);
      setTimesheets(data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimesheets();
  };

  const handleEditTimesheet = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    
    // Parse dates to simple formats
    try {
      const clockIn = new Date(timesheet.clock_in);
      const clockOut = timesheet.clock_out ? new Date(timesheet.clock_out) : new Date();
      
      // Format as YYYY-MM-DD
      setEditDate(format(clockIn, 'yyyy-MM-dd'));
      
      // Format as HH:mm (24-hour)
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
    setEmployeeNotes(timesheet.employee_notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTimesheet) return;

    // Validate inputs
    if (!editDate || !editStartTime || !editEndTime) {
      Alert.alert('Error', 'Please fill in date, start time, and end time');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editStartTime) || !timeRegex.test(editEndTime)) {
      Alert.alert('Error', 'Please use HH:MM format (e.g., 09:00, 17:30)');
      return;
    }

    try {
      setUpdating(true);
      
      // Construct ISO datetime strings
      const clockInISO = `${editDate}T${editStartTime}:00.000Z`;
      const clockOutISO = `${editDate}T${editEndTime}:00.000Z`;
      
      await updateTimesheet(selectedTimesheet.id, {
        manual_clock_in: clockInISO,
        manual_clock_out: clockOutISO,
        manual_break_minutes: parseInt(editBreakMinutes) || 0,
        employee_notes: employeeNotes,
      });

      Alert.alert('Success', 'Timesheet updated successfully');
      setEditModalVisible(false);
      fetchTimesheets();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update timesheet');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    
    // Show options: Camera or Gallery
    Alert.alert(
      'Attach Photo',
      'Choose photo source',
      [
        {
          text: 'Take Photo',
          onPress: () => openCamera(timesheet),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => openGallery(timesheet),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async (timesheet: any) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setPhotoModalVisible(true);
    }
  };

  const openGallery = async (timesheet: any) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permissions to choose photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setPhotoModalVisible(true);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedTimesheet || !selectedPhoto) return;

    try {
      setUploadingPhoto(true);
      
      await updateTimesheet(selectedTimesheet.id, {
        photo_base64: selectedPhoto,
      });

      Alert.alert('Success', 'Photo attached successfully');
      setPhotoModalVisible(false);
      setSelectedPhoto(null);
      fetchTimesheets();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const renderTimesheet = ({ item }: any) => {
    const clockIn = new Date(item.clock_in);
    const clockOut = item.clock_out ? new Date(item.clock_out) : null;
    const canEdit = item.approval_status === 'pending';

    return (
      <View style={styles.timesheetCard}>
        {/* Header with date and status */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{format(clockIn, 'EEE, MMM dd, yyyy')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approval_status) + '20' }]}>
            <Ionicons name={getStatusIcon(item.approval_status)} size={16} color={getStatusColor(item.approval_status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.approval_status) }]}>
              {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Time details - Employment Hero style */}
        <View style={styles.timeGrid}>
          <View style={styles.timeCell}>
            <Text style={styles.timeCellLabel}>Start</Text>
            <Text style={styles.timeCellValue}>{format(clockIn, 'h:mm a')}</Text>
          </View>
          
          <View style={styles.timeCell}>
            <Text style={styles.timeCellLabel}>End</Text>
            <Text style={styles.timeCellValue}>
              {clockOut ? format(clockOut, 'h:mm a') : '-'}
            </Text>
          </View>
          
          <View style={styles.timeCell}>
            <Text style={styles.timeCellLabel}>Break</Text>
            <Text style={styles.timeCellValue}>{item.break_minutes} min</Text>
          </View>
          
          <View style={styles.timeCell}>
            <Text style={styles.timeCellLabel}>Total</Text>
            <Text style={[styles.timeCellValue, styles.totalHours]}>{item.total_hours.toFixed(2)} hrs</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          {item.manually_edited && (
            <View style={styles.badge}>
              <Ionicons name="pencil" size={12} color={colors.warning} />
              <Text style={styles.badgeText}>Edited</Text>
            </View>
          )}
          {item.photo_base64 && (
            <View style={styles.badge}>
              <Ionicons name="image" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Photo</Text>
            </View>
          )}
          {item.gps_in_out_of_bounds && (
            <View style={[styles.badge, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="alert-circle" size={12} color={colors.error} />
              <Text style={[styles.badgeText, { color: colors.error }]}>Out of Bounds</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {item.employee_notes && (
          <View style={styles.notesBox}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.notesText}>{item.employee_notes}</Text>
          </View>
        )}

        {/* Action buttons */}
        {canEdit && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleEditTimesheet(item)}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Edit Times</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handlePickImage(item)}
            >
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pay info (if approved and permission) */}
        {item.approval_status === 'approved' && item.total_pay && user?.permissions?.view_own_pay && (
          <View style={styles.payBox}>
            <Ionicons name="cash" size={20} color={colors.success} />
            <Text style={styles.payText}>Total Pay: ${item.total_pay.toFixed(2)}</Text>
          </View>
        )}
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
      {/* Summary header */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{timesheets.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {timesheets.filter(ts => ts.approval_status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {timesheets.reduce((sum, ts) => sum + ts.total_hours, 0).toFixed(1)}
          </Text>
          <Text style={styles.summaryLabel}>Hours</Text>
        </View>
      </View>

      <FlatList
        data={timesheets}
        keyExtractor={(item) => item.id}
        renderItem={renderTimesheet}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No timesheets yet</Text>
            <Text style={styles.emptySubtext}>Clock in to start tracking your hours</Text>
          </View>
        }
      />

      {/* Edit Modal - Simple text inputs */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Timesheet</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
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
                    placeholder="HH:MM (e.g., 09:00)"
                  />
                </View>

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    value={editEndTime}
                    onChangeText={setEditEndTime}
                    placeholder="HH:MM (e.g., 17:00)"
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
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={employeeNotes}
                  onChangeText={setEmployeeNotes}
                  placeholder="Reason for manual edit..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.helpBox}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <Text style={styles.helpText}>
                  Use 24-hour format. Example: 09:00 for 9am, 17:30 for 5:30pm
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveEdit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Modal */}
      <Modal
        visible={photoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setPhotoModalVisible(false);
          setSelectedPhoto(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach Photo</Text>
              <TouchableOpacity onPress={() => {
                setPhotoModalVisible(false);
                setSelectedPhoto(null);
              }}>
                <Ionicons name="close" size={28} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <Image 
                source={{ uri: selectedPhoto }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setPhotoModalVisible(false);
                  setSelectedPhoto(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Upload</Text>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  summaryCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  timesheetCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeGrid: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timeCell: {
    flex: 1,
    alignItems: 'center',
  },
  timeCellLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  timeCellValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalHours: {
    color: colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  payBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  payText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.success,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  photoModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    margin: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 20,
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
  previewImage: {
    width: '100%',
    height: 300,
    marginVertical: 20,
  },
});
