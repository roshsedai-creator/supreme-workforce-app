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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../store/authStore';
import { getTimesheets, updateTimesheet } from '../../utils/api';
import { colors } from '../../constants/colors';
import { format, parseISO } from 'date-fns';

export default function TimesheetsScreen() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [editClockIn, setEditClockIn] = useState<Date>(new Date());
  const [editClockOut, setEditClockOut] = useState<Date>(new Date());
  const [editBreakMinutes, setEditBreakMinutes] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);
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
    setEditClockIn(timesheet.clock_in ? parseISO(timesheet.clock_in) : new Date());
    setEditClockOut(timesheet.clock_out ? parseISO(timesheet.clock_out) : new Date());
    setEditBreakMinutes(timesheet.break_minutes?.toString() || '0');
    setEmployeeNotes(timesheet.employee_notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTimesheet) return;

    try {
      setUpdating(true);
      
      await updateTimesheet(selectedTimesheet.id, {
        manual_clock_in: editClockIn.toISOString(),
        manual_clock_out: editClockOut.toISOString(),
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
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to attach photos');
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

    return (
      <View style={styles.timesheetCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{format(clockIn, 'MMM dd, yyyy')}</Text>
            <Text style={styles.dayText}>{format(clockIn, 'EEEE')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approval_status) + '20' }]}>
            <Ionicons name={getStatusIcon(item.approval_status)} size={16} color={getStatusColor(item.approval_status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.approval_status) }]}>
              {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Clock In</Text>
            <Text style={styles.timeValue}>{format(clockIn, 'h:mm a')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.gray[300]} />
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Clock Out</Text>
            <Text style={styles.timeValue}>
              {clockOut ? format(clockOut, 'h:mm a') : 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.total_hours.toFixed(2)} hrs</Text>
          </View>
          {item.break_minutes > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="cafe-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.statText}>{item.break_minutes} min break</Text>
            </View>
          )}
          {item.manually_edited && (
            <View style={styles.statItem}>
              <Ionicons name="pencil" size={18} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.warning }]}>Edited</Text>
            </View>
          )}
          {item.photo_base64 && (
            <View style={styles.statItem}>
              <Ionicons name="image" size={18} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.primary }]}>Photo</Text>
            </View>
          )}
        </View>

        {item.employee_notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text" size={16} color={colors.text.secondary} />
            <Text style={styles.notesText}>{item.employee_notes}</Text>
          </View>
        )}

        {/* Action buttons - only for pending timesheets */}
        {item.approval_status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditTimesheet(item)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Edit Times</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handlePickImage(item)}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Attach Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show total pay if approved AND user has permission */}
        {item.approval_status === 'approved' && item.total_pay && user?.permissions?.view_own_pay && (
          <View style={styles.payContainer}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
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
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{timesheets.length}</Text>
          <Text style={styles.summaryLabel}>Total Shifts</Text>
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
          <Text style={styles.summaryLabel}>Total Hours</Text>
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
            <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No timesheets yet</Text>
            <Text style={styles.emptySubtext}>Your timesheets will appear here after clocking in</Text>
          </View>
        }
      />

      {/* Edit Timesheet Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Timesheet</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Clock In */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clock In Time</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowClockInPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {format(editClockIn, 'MMM dd, yyyy h:mm a')}
                  </Text>
                </TouchableOpacity>
                {showClockInPicker && (
                  <DateTimePicker
                    value={editClockIn}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowClockInPicker(Platform.OS === 'ios');
                      if (date) setEditClockIn(date);
                    }}
                  />
                )}
              </View>

              {/* Clock Out */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clock Out Time</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowClockOutPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {format(editClockOut, 'MMM dd, yyyy h:mm a')}
                  </Text>
                </TouchableOpacity>
                {showClockOutPicker && (
                  <DateTimePicker
                    value={editClockOut}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowClockOutPicker(Platform.OS === 'ios');
                      if (date) setEditClockOut(date);
                    }}
                  />
                )}
              </View>

              {/* Break Minutes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Break Minutes</Text>
                <TextInput
                  style={styles.input}
                  value={editBreakMinutes}
                  onChangeText={setEditBreakMinutes}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>

              {/* Employee Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={employeeNotes}
                  onChangeText={setEmployeeNotes}
                  placeholder="Add any notes about this timesheet..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Use this to correct forgotten clock-ins or clock-outs. Your supervisor will review the changes.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Photo Upload Modal */}
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
                <Ionicons name="close" size={24} color={colors.text.primary} />
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
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPhotoModalVisible(false);
                  setSelectedPhoto(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Upload Photo</Text>
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
    fontSize: 28,
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
    paddingTop: 0,
  },
  timesheetCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dayText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  notesContainer: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
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
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  payContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    gap: 8,
  },
  payText: {
    fontSize: 16,
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
    textAlign: 'center',
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
    maxHeight: '85%',
  },
  photoModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    margin: 20,
    maxHeight: '80%',
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
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
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
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  previewImage: {
    width: '100%',
    height: 300,
    marginVertical: 20,
  },
});
