import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';

interface RosterShift {
  id: string;
  employee_id: string;
  employee_name: string;
  site_id: string;
  site_name: string;
  role: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
}

export default function RosterScreen() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<RosterShift[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // View state
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterSiteId, setFilterSiteId] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSwapRequestsModal, setShowSwapRequestsModal] = useState(false);
  
  // Shift swap state
  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<RosterShift | null>(null);
  const [swapToEmployee, setSwapToEmployee] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [swapRequests, setSwapRequests] = useState<any[]>([]);
  
  // Template state
  const [templateName, setTemplateName] = useState('');
  const [templateEmployee, setTemplateEmployee] = useState('');
  const [templateSite, setTemplateSite] = useState('');
  const [templateRole, setTemplateRole] = useState('');
  const [templateDay, setTemplateDay] = useState(0);
  const [templateStartTime, setTemplateStartTime] = useState('09:00');
  const [templateEndTime, setTemplateEndTime] = useState('17:00');
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Create shift form
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [shiftStart, setShiftStart] = useState(new Date());
  const [shiftEnd, setShiftEnd] = useState(new Date());
  const [shiftNotes, setShiftNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Availability state
  const [availability, setAvailability] = useState([
    { day: 0, name: 'Monday', available: true, start_time: '09:00', end_time: '17:00' },
    { day: 1, name: 'Tuesday', available: true, start_time: '09:00', end_time: '17:00' },
    { day: 2, name: 'Wednesday', available: true, start_time: '09:00', end_time: '17:00' },
    { day: 3, name: 'Thursday', available: true, start_time: '09:00', end_time: '17:00' },
    { day: 4, name: 'Friday', available: true, start_time: '09:00', end_time: '17:00' },
    { day: 5, name: 'Saturday', available: false, start_time: '09:00', end_time: '17:00' },
    { day: 6, name: 'Sunday', available: false, start_time: '09:00', end_time: '17:00' },
  ]);

  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  useEffect(() => {
    loadData();
    if (isSupervisor) {
      loadSwapRequests();
      loadTemplates();
    }
  }, [selectedDate, filterSiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load roster shifts
      const startDate = getWeekStart(selectedDate);
      const endDate = getWeekEnd(selectedDate);
      
      const shiftsRes = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts`,
        {
          params: {
            employee_id: !isSupervisor ? user?.id : undefined,
            site_id: filterSiteId !== 'all' ? filterSiteId : undefined,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          }
        }
      );
      setShifts(shiftsRes.data);
      
      // Load sites and employees if supervisor/admin
      if (isSupervisor) {
        const [sitesRes, employeesRes] = await Promise.all([
          axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`),
          axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users?role=employee`)
        ]);
        setSites(sitesRes.data);
        setEmployees(employeesRes.data);
      }
      
      // Load employee availability
      if (user?.id) {
        try {
          const availRes = await axios.get(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/${user.id}`
          );
          if (availRes.data && availRes.data.length > 0) {
            const loadedAvail = availRes.data.map((a: any) => ({
              day: a.day_of_week,
              name: getDayName(a.day_of_week),
              available: a.available,
              start_time: a.start_time || '09:00',
              end_time: a.end_time || '17:00',
            }));
            setAvailability(loadedAvail);
          }
        } catch (err) {
          console.log('No availability data yet');
        }
      }
      
    } catch (error: any) {
      console.error('Load data error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load roster data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Sunday
    return end;
  };

  const getDayName = (dayNum: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleCreateShift = async () => {
    if (!selectedEmployee || !selectedSite || !selectedRole) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts?created_by=${user?.id}`,
        {
          employee_id: selectedEmployee,
          site_id: selectedSite,
          role: selectedRole,
          start_time: shiftStart.toISOString(),
          end_time: shiftEnd.toISOString(),
          notes: shiftNotes,
        }
      );
      
      Alert.alert('Success', 'Shift created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create shift');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability`,
        {
          employee_id: user?.id,
          availability: availability.map(a => ({
            day: a.day,
            available: a.available,
            start_time: a.start_time,
            end_time: a.end_time,
          }))
        }
      );
      
      Alert.alert('Success', 'Availability updated successfully!');
      setShowAvailabilityModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = async () => {
    if (!selectedShiftForSwap || !swapToEmployee) {
      Alert.alert('Error', 'Please select an employee to swap with');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shift-swaps`,
        {
          shift_id: selectedShiftForSwap.id,
          from_employee_id: user?.id,
          to_employee_id: swapToEmployee,
          reason: swapReason,
        }
      );
      
      Alert.alert('Success', 'Swap request sent! Waiting for supervisor approval.');
      setShowSwapModal(false);
      setSelectedShiftForSwap(null);
      setSwapToEmployee('');
      setSwapReason('');
      loadSwapRequests();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create swap request');
    } finally {
      setLoading(false);
    }
  };

  const loadSwapRequests = async () => {
    try {
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shift-swaps`,
        {
          params: {
            employee_id: !isSupervisor ? user?.id : undefined,
            status: 'pending'
          }
        }
      );
      setSwapRequests(res.data);
    } catch (error) {
      console.error('Failed to load swap requests:', error);
    }
  };

  const handleSwapAction = async (swapId: string, action: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shift-swaps/action`,
        {
          swap_id: swapId,
          action: action,
          approved_by: user?.id,
        }
      );
      
      Alert.alert('Success', `Swap request ${action}!`);
      loadSwapRequests();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to process swap request');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateEmployee || !templateSite || !templateRole) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/templates?created_by=${user?.id}`,
        {
          name: templateName,
          employee_id: templateEmployee,
          site_id: templateSite,
          role: templateRole,
          day_of_week: templateDay,
          start_time: templateStartTime,
          end_time: templateEndTime,
        }
      );
      
      Alert.alert('Success', 'Recurring template created!');
      setShowTemplateModal(false);
      resetTemplateForm();
      loadTemplates();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/templates`,
        {
          params: {
            active: true
          }
        }
      );
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleGenerateFromTemplate = async (templateId: string, weeks: number = 4) => {
    Alert.alert(
      'Generate Shifts',
      `Generate ${weeks} weeks of shifts from this template?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await axios.post(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/templates/${templateId}/generate?weeks=${weeks}`
              );
              
              Alert.alert('Success', `Created ${res.data.shifts_created} shifts!`);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to generate shifts');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetCreateForm = () => {
    setSelectedEmployee('');
    setSelectedSite('');
    setSelectedRole('');
    setShiftStart(new Date());
    setShiftEnd(new Date());
    setShiftNotes('');
  };

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateEmployee('');
    setTemplateSite('');
    setTemplateRole('');
    setTemplateDay(0);
    setTemplateStartTime('09:00');
    setTemplateEndTime('17:00');
  };

  const handleReassignShift = async (shiftId: string, newEmployeeId: string) => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts/${shiftId}`,
        {
          employee_id: newEmployeeId,
          updated_at: new Date().toISOString(),
        }
      );
      
      Alert.alert('Success', 'Shift reassigned successfully!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reassign shift');
    } finally {
      setLoading(false);
    }
  };

  const promptReassignShift = (shift: RosterShift) => {
    if (!isSupervisor) {
      Alert.alert('Permission Denied', 'Only supervisors can reassign shifts');
      return;
    }

    Alert.alert(
      'Reassign Shift',
      `Reassign ${shift.employee_name}'s shift on ${formatDate(shift.start_time)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Employee',
          onPress: () => {
            // Show picker with employees
            const employeeList = employees.map((emp: any) => 
              `${emp.first_name} ${emp.last_name}`
            ).join('\n');
            
            Alert.prompt(
              'Select Employee',
              'Enter employee name or use the roster screen to tap and hold a shift, then select a new employee',
              [
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        }
      ]
    );
  };

  const previousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const handleQuickCreateShift = (date: Date) => {
    if (!isSupervisor) {
      Alert.alert('Permission Denied', 'Only supervisors can create shifts');
      return;
    }
    
    // Set the shift start time to 9 AM on the selected date
    const shiftStart = new Date(date);
    shiftStart.setHours(9, 0, 0, 0);
    
    const shiftEnd = new Date(date);
    shiftEnd.setHours(17, 0, 0, 0);
    
    setShiftStart(shiftStart);
    setShiftEnd(shiftEnd);
    setShowCreateModal(true);
  };

  const handleShiftLongPress = (shift: RosterShift) => {
    if (!isSupervisor) return;
    
    Alert.alert(
      'Shift Actions',
      `${shift.employee_name} • ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`,
      [
        {
          text: 'Reassign',
          onPress: () => promptReassignShift(shift)
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteShift(shift.id)
        },
        {
          text: 'Copy to Next Week',
          onPress: () => handleCopyShift(shift)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleDeleteShift = async (shiftId: string) => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts/${shiftId}`
              );
              Alert.alert('Success', 'Shift deleted');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete shift');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCopyShift = async (shift: RosterShift) => {
    try {
      setLoading(true);
      
      // Create new shift one week later
      const newStartTime = new Date(shift.start_time);
      newStartTime.setDate(newStartTime.getDate() + 7);
      
      const newEndTime = new Date(shift.end_time);
      newEndTime.setDate(newEndTime.getDate() + 7);
      
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roster/shifts`,
        {
          employee_id: shift.employee_id,
          site_id: shift.site_id,
          role: shift.role,
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          notes: shift.notes,
          created_by: user?.id,
        }
      );
      
      Alert.alert('Success', 'Shift copied to next week!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to copy shift');
    } finally {
      setLoading(false);
    }
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(selectedDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayShifts = getShiftsForDate(date);
      
      days.push(
        <View key={i} style={styles.dayColumn}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
            <Text style={styles.dayDate}>{date.getDate()}</Text>
          </View>
          
          <ScrollView style={styles.dayShifts}>
            {dayShifts.length > 0 ? (
              dayShifts.map(shift => (
                <TouchableOpacity
                  key={shift.id}
                  style={styles.shiftCard}
                  onPress={() => isSupervisor && handleShiftLongPress(shift)}
                  onLongPress={() => handleShiftLongPress(shift)}
                  activeOpacity={0.7}
                >
                  {isSupervisor && (
                    <View style={styles.shiftEmployeeRow}>
                      <Ionicons name="person" size={14} color={colors.primary} />
                      <Text style={styles.shiftEmployee}>{shift.employee_name}</Text>
                    </View>
                  )}
                  <View style={styles.shiftTimeRow}>
                    <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.shiftTime}>
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </Text>
                  </View>
                  <Text style={styles.shiftSite} numberOfLines={1}>
                    📍 {shift.site_name}
                  </Text>
                  <Text style={styles.shiftRole} numberOfLines={1}>
                    💼 {shift.role}
                  </Text>
                </TouchableOpacity>
              ))
            ) : null}
            
            {/* Quick Add Button for Empty Days */}
            {isSupervisor && (
              <TouchableOpacity
                style={styles.addShiftButton}
                onPress={() => handleQuickCreateShift(date)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addShiftText}>Add Shift</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      );
    }
    
    return <View style={styles.weekContainer}>{days}</View>;
  };

  const renderListView = () => {
    const myShifts = isSupervisor ? shifts : shifts.filter(s => s.employee_id === user?.id);
    
    if (myShifts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No shifts scheduled</Text>
          {!isSupervisor && (
            <Text style={styles.emptySubtext}>
              Contact your supervisor to be added to the roster
            </Text>
          )}
        </View>
      );
    }
    
    return myShifts.map(shift => (
      <View key={shift.id} style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <Ionicons name="time" size={24} color={colors.primary} />
          <View style={styles.listCardInfo}>
            <Text style={styles.listCardDate}>{formatDate(shift.start_time)}</Text>
            <Text style={styles.listCardTime}>
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>
              {shift.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.listCardDetails}>
          {isSupervisor && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>{shift.employee_name}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{shift.site_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{shift.role}</Text>
          </View>
          {shift.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>{shift.notes}</Text>
            </View>
          )}
        </View>
      </View>
    ));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading roster...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={previousWeek} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.weekLabel}>
            <Text style={styles.weekText}>
              {getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          
          <TouchableOpacity onPress={nextWeek} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          {isSupervisor && (
            <>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>Create Shift</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.gold }]}
                onPress={() => {
                  loadTemplates();
                  setShowTemplateModal(true);
                }}
              >
                <Ionicons name="copy-outline" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>Templates</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.availabilityButton}
            onPress={() => setShowAvailabilityModal(true)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={styles.availabilityButtonText}>My Availability</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.availabilityButton, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
            onPress={() => {
              loadSwapRequests();
              setShowSwapRequestsModal(true);
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.warning} />
            <Text style={[styles.availabilityButtonText, { color: colors.warning }]}>
              Swaps {swapRequests.length > 0 && `(${swapRequests.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'week' && styles.viewButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'week' && styles.viewButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'day' && styles.viewButtonActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'day' && styles.viewButtonTextActive]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Site Filter */}
        {isSupervisor && sites.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Site:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filterSiteId}
                onValueChange={(value) => setFilterSiteId(value)}
                style={styles.picker}
              >
                <Picker.Item label="All Sites" value="all" />
                {sites.map((site: any) => (
                  <Picker.Item key={site.id} label={site.name} value={site.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'week' ? renderWeekView() : renderListView()}
      </ScrollView>

      {/* Create Shift Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Roster Shift</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select employee..." value="" />
                    {employees.map(emp => (
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
                <Text style={styles.inputLabel}>Site *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedSite}
                    onValueChange={setSelectedSite}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select site..." value="" />
                    {sites.map(site => (
                      <Picker.Item key={site.id} label={site.name} value={site.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedRole}
                    onValueChange={setSelectedRole}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select role..." value="" />
                    <Picker.Item label="Room Attendant" value="Room Attendant" />
                    <Picker.Item label="Houseman" value="Houseman" />
                    <Picker.Item label="Public Area Attendant" value="Public Area Attendant" />
                    <Picker.Item label="Supervisor" value="Supervisor" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Time *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {shiftStart.toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={shiftStart}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartPicker(false);
                      if (date) setShiftStart(date);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Time *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {shiftEnd.toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={shiftEnd}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndPicker(false);
                      if (date) setShiftEnd(date);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  value={shiftNotes}
                  onChangeText={setShiftNotes}
                  placeholder="Add any special instructions..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreateShift}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={styles.submitButtonText}>Create Shift</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Availability Modal */}
      <Modal
        visible={showAvailabilityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvailabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Availability</Text>
              <TouchableOpacity onPress={() => setShowAvailabilityModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.availabilityInfo}>
                Set your weekly availability to help supervisors schedule your shifts.
              </Text>

              {availability.map((day, index) => (
                <View key={day.day} style={styles.availabilityRow}>
                  <TouchableOpacity
                    style={styles.availabilityToggle}
                    onPress={() => {
                      const newAvail = [...availability];
                      newAvail[index].available = !newAvail[index].available;
                      setAvailability(newAvail);
                    }}
                  >
                    <Ionicons
                      name={day.available ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={day.available ? colors.success : colors.gray[400]}
                    />
                    <Text style={[styles.dayNameText, !day.available && styles.dayNameDisabled]}>
                      {day.name}
                    </Text>
                  </TouchableOpacity>
                  
                  {day.available && (
                    <View style={styles.timeInputs}>
                      <TextInput
                        style={styles.timeInput}
                        value={day.start_time}
                        onChangeText={(text) => {
                          const newAvail = [...availability];
                          newAvail[index].start_time = text;
                          setAvailability(newAvail);
                        }}
                        placeholder="09:00"
                        placeholderTextColor={colors.gray[400]}
                      />
                      <Text style={styles.timeSeparator}>-</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={day.end_time}
                        onChangeText={(text) => {
                          const newAvail = [...availability];
                          newAvail[index].end_time = text;
                          setAvailability(newAvail);
                        }}
                        placeholder="17:00"
                        placeholderTextColor={colors.gray[400]}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSaveAvailability}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={styles.submitButtonText}>Save Availability</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Roster Templates Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Roster Templates</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.availabilityInfo}>
                Create recurring shift templates to quickly generate weekly schedules.
              </Text>

              {/* Existing Templates */}
              {templates.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 12 }]}>Saved Templates</Text>
                  {templates.map((template: any) => (
                    <View key={template.id} style={styles.listCard}>
                      <View style={styles.listCardHeader}>
                        <Ionicons name="copy-outline" size={24} color={colors.gold} />
                        <View style={styles.listCardInfo}>
                          <Text style={styles.listCardDate}>{template.name}</Text>
                          <Text style={styles.listCardTime}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][template.day_of_week]}
                            {' • '}
                            {template.start_time} - {template.end_time}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.listCardDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="person" size={16} color={colors.text.secondary} />
                          <Text style={styles.detailText}>{template.employee_name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="location" size={16} color={colors.text.secondary} />
                          <Text style={styles.detailText}>{template.site_name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="briefcase" size={16} color={colors.text.secondary} />
                          <Text style={styles.detailText}>{template.role}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.submitButton, { marginTop: 12 }]}
                        onPress={() => handleGenerateFromTemplate(template.id, 4)}
                      >
                        <Ionicons name="calendar" size={18} color={colors.white} />
                        <Text style={styles.submitButtonText}>Generate 4 Weeks</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Create New Template Form */}
              <Text style={[styles.inputLabel, { marginTop: 8, marginBottom: 16 }]}>Create New Template</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Template Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={templateName}
                  onChangeText={setTemplateName}
                  placeholder="e.g., Morning Shift - Room Attendant"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={templateEmployee}
                    onValueChange={setTemplateEmployee}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Employee" value="" />
                    {employees.map((emp: any) => (
                      <Picker.Item
                        key={emp.id}
                        label={`${emp.first_name} ${emp.last_name}`}
                        value={emp.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Site</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={templateSite}
                    onValueChange={setTemplateSite}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Site" value="" />
                    {sites.map((site: any) => (
                      <Picker.Item key={site.id} label={site.name} value={site.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <TextInput
                  style={styles.textInput}
                  value={templateRole}
                  onChangeText={setTemplateRole}
                  placeholder="Room Attendant"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Day of Week</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={templateDay}
                    onValueChange={(value) => setTemplateDay(Number(value))}
                    style={styles.picker}
                  >
                    <Picker.Item label="Monday" value={0} />
                    <Picker.Item label="Tuesday" value={1} />
                    <Picker.Item label="Wednesday" value={2} />
                    <Picker.Item label="Thursday" value={3} />
                    <Picker.Item label="Friday" value={4} />
                    <Picker.Item label="Saturday" value={5} />
                    <Picker.Item label="Sunday" value={6} />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Time (HH:MM)</Text>
                <TextInput
                  style={styles.textInput}
                  value={templateStartTime}
                  onChangeText={setTemplateStartTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Time (HH:MM)</Text>
                <TextInput
                  style={styles.textInput}
                  value={templateEndTime}
                  onChangeText={setTemplateEndTime}
                  placeholder="17:00"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreateTemplate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color={colors.white} />
                    <Text style={styles.submitButtonText}>Create Template</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shift Swap Requests Modal */}
      <Modal
        visible={showSwapRequestsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSwapRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shift Swap Requests</Text>
              <TouchableOpacity onPress={() => setShowSwapRequestsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {swapRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="swap-horizontal" size={64} color={colors.gray[300]} />
                  <Text style={styles.emptyText}>No Pending Swap Requests</Text>
                  <Text style={styles.emptySubtext}>
                    Shift swap requests will appear here for approval
                  </Text>
                </View>
              ) : (
                swapRequests.map((swap: any) => (
                  <View key={swap.id} style={styles.listCard}>
                    <View style={styles.listCardHeader}>
                      <Ionicons name="swap-horizontal" size={24} color={colors.warning} />
                      <View style={styles.listCardInfo}>
                        <Text style={styles.listCardDate}>
                          {swap.requester_name} → {swap.requested_employee_name}
                        </Text>
                        <Text style={styles.listCardTime}>
                          {formatDate(swap.shift_start_time)} • {formatTime(swap.shift_start_time)} - {formatTime(swap.shift_end_time)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.warning }]}>
                          {swap.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.listCardDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color={colors.text.secondary} />
                        <Text style={styles.detailText}>{swap.site_name}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="briefcase" size={16} color={colors.text.secondary} />
                        <Text style={styles.detailText}>{swap.role}</Text>
                      </View>
                      {swap.reason && (
                        <View style={styles.detailRow}>
                          <Ionicons name="document-text" size={16} color={colors.text.secondary} />
                          <Text style={styles.detailText}>{swap.reason}</Text>
                        </View>
                      )}
                    </View>

                    {isSupervisor && swap.status === 'pending' && (
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                        <TouchableOpacity
                          style={[styles.submitButton, { flex: 1, backgroundColor: colors.success }]}
                          onPress={() => handleSwapAction(swap.id, 'approved')}
                        >
                          <Ionicons name="checkmark" size={18} color={colors.white} />
                          <Text style={styles.submitButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.submitButton, { flex: 1, backgroundColor: colors.error }]}
                          onPress={() => handleSwapAction(swap.id, 'rejected')}
                        >
                          <Ionicons name="close" size={18} color={colors.white} />
                          <Text style={styles.submitButtonText}>Reject</Text>
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  weekLabel: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  availabilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  availabilityButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: colors.white,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  viewButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterSection: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    flexDirection: 'row',
    padding: 8,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  dayHeader: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  dayShifts: {
    flex: 1,
  },
  shiftCard: {
    backgroundColor: colors.primary + '15',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  shiftEmployee: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  shiftSite: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  shiftRole: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  noShifts: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 16,
  },
  listCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  listCardInfo: {
    flex: 1,
  },
  listCardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listCardTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  listCardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: 16,
    fontSize: 15,
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
  availabilityInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  availabilityRow: {
    marginBottom: 16,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dayNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dayNameDisabled: {
    color: colors.gray[400],
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 36,
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
  },
  timeSeparator: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
