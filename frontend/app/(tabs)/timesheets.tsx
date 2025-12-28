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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Helper function to format time input (1200 → 12:00, 900 → 09:00)
const formatTimeInput = (value: string): string => {
  const cleaned = value.replace(/[^0-9:]/g, '');
  if (cleaned.includes(':')) return cleaned.substring(0, 5);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length === 3) return `0${cleaned[0]}:${cleaned.substring(1)}`;
  if (cleaned.length >= 4) return `${cleaned.substring(0, 2)}:${cleaned.substring(2, 4)}`;
  return cleaned;
};

interface Timesheet {
  id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  break_minutes: number;
  notes: string;
  image?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  site_name?: string;
}

export default function TimesheetsScreen() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreak, setEditBreak] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Image view modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Fetch timesheets
  const fetchTimesheets = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets`,
        { params: { employee_id: user.id } }
      );
      const data = response.data || [];
      // Sort by date descending
      data.sort((a: any, b: any) => new Date(b.clock_in || b.date).getTime() - new Date(a.clock_in || a.date).getTime());
      setTimesheets(data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimesheets();
  };

  // Format date for display
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

  // Open edit modal
  const openEditModal = (timesheet: Timesheet) => {
    if (timesheet.approval_status === 'approved') {
      Alert.alert('Cannot Edit', 'Approved timesheets cannot be modified');
      return;
    }
    
    setEditingTimesheet(timesheet);
    const clockIn = new Date(timesheet.clock_in);
    const clockOut = new Date(timesheet.clock_out);
    
    setEditDate(`${clockIn.getFullYear()}-${String(clockIn.getMonth() + 1).padStart(2, '0')}-${String(clockIn.getDate()).padStart(2, '0')}`);
    setEditStartTime(`${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`);
    setEditEndTime(`${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`);
    setEditBreak(String(timesheet.break_minutes || 0));
    setEditNotes(timesheet.notes || '');
    setEditImage(timesheet.image || null);
    setShowEditModal(true);
  };

  // Pick image
  const pickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera/gallery access');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets[0].base64) {
        setEditImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingTimesheet) return;
    
    setSaving(true);
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${editingTimesheet.id}`,
        {
          date: editDate,
          clock_in_time: editStartTime,
          clock_out_time: editEndTime,
          break_minutes: parseInt(editBreak) || 0,
          notes: editNotes,
          image: editImage,
        }
      );
      
      if (response.data) {
        Alert.alert('Success', 'Timesheet updated');
        setShowEditModal(false);
        fetchTimesheets();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update timesheet');
    } finally {
      setSaving(false);
    }
  };

  // Delete timesheet
  const deleteTimesheet = (timesheet: Timesheet) => {
    if (timesheet.approval_status === 'approved') {
      Alert.alert('Cannot Delete', 'Approved timesheets cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Timesheet',
      'Are you sure you want to delete this timesheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/timesheets/${timesheet.id}`
              );
              Alert.alert('Success', 'Timesheet deleted');
              fetchTimesheets();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete timesheet');
            }
          },
        },
      ]
    );
  };

  // View image
  const viewImage = (imageUrl: string) => {
    setViewingImage(imageUrl);
    setShowImageModal(true);
  };

  // Filtered timesheets
  const filteredTimesheets = filterStatus === 'all' 
    ? timesheets 
    : timesheets.filter(t => t.approval_status === filterStatus);

  // Calculate totals
  const totalHours = filteredTimesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
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
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredTimesheets.length}</Text>
          <Text style={styles.summaryLabel}>Entries</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
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
            <Text style={styles.emptyText}>No timesheets found</Text>
          </View>
        ) : (
          filteredTimesheets.map((timesheet) => (
            <View key={timesheet.id} style={styles.timesheetCard}>
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{formatDate(timesheet.clock_in)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(timesheet.approval_status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(timesheet.approval_status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(timesheet.approval_status) }]}>
                      {timesheet.approval_status}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {timesheet.image && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => viewImage(timesheet.image!)}
                    >
                      <Ionicons name="image" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => openEditModal(timesheet)}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => deleteTimesheet(timesheet)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Ionicons name="log-in-outline" size={18} color={colors.success} />
                    <Text style={styles.timeLabel}>Start</Text>
                    <Text style={styles.timeValue}>{formatTime(timesheet.clock_in)}</Text>
                  </View>
                  <View style={styles.timeDivider}>
                    <Ionicons name="arrow-forward" size={16} color={colors.gray[400]} />
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text style={styles.timeLabel}>End</Text>
                    <Text style={styles.timeValue}>{formatTime(timesheet.clock_out)}</Text>
                  </View>
                  <View style={styles.hoursContainer}>
                    <Text style={styles.hoursValue}>{(timesheet.total_hours || 0).toFixed(1)}h</Text>
                    {timesheet.break_minutes > 0 && (
                      <Text style={styles.breakText}>{timesheet.break_minutes}m break</Text>
                    )}
                  </View>
                </View>
                
                {timesheet.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="document-text-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.notesText} numberOfLines={2}>{timesheet.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Timesheet</Text>
            <TouchableOpacity onPress={saveEdit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start Time</Text>
                  <TextInput
                    style={styles.input}
                    value={editStartTime}
                    onChangeText={setEditStartTime}
                    placeholder="09:00"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    value={editEndTime}
                    onChangeText={setEditEndTime}
                    placeholder="17:00"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Break (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={editBreak}
                  onChangeText={setEditBreak}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Timesheet Photo</Text>
                <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={20} color={colors.primary} />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(false)}>
                    <Ionicons name="images" size={20} color={colors.primary} />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                {editImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: editImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImage} onPress={() => setEditImage(null)}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray[300],
    marginVertical: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: colors.primary + '15',
  },
  filterTabText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
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
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  cardBody: {
    padding: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeDivider: {
    paddingHorizontal: 8,
  },
  hoursContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  hoursValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  breakText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  notesContainer: {
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
  cancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  // Full image modal
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
