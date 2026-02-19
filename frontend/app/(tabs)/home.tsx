import React, { useState, useCallback, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [entryMode, setEntryMode] = useState<'daily' | 'fortnight' | 'rooms'>('daily');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'daily' | 'fortnight' | 'rooms'>('daily');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Daily entry
  const [dailyDate, setDailyDate] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('');
  const [dailyEndTime, setDailyEndTime] = useState('');
  const [dailyBreak, setDailyBreak] = useState('30');
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  
  // Fortnight
  const [fortnightStartDate, setFortnightStartDate] = useState('');
  const [fortnightEntries, setFortnightEntries] = useState<any[]>([]);
  const [fortnightImage, setFortnightImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Room Cleaning - Multi-room support
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomDate, setRoomDate] = useState('');
  const [roomEntries, setRoomEntries] = useState<{roomTypeId: string, roomTypeName: string, status: string, count: number, minutes: number}[]>([]);
  const [roomNotes, setRoomNotes] = useState('');
  const [todayRoomEntries, setTodayRoomEntries] = useState<any[]>([]);
  
  // Productivity comparison
  const [productivity, setProductivity] = useState<any>(null);
  const [todayTimesheetHours, setTodayTimesheetHours] = useState(0);

  // Fetch room types on mount
  useEffect(() => {
    fetchRoomTypes();
    fetchTodayRoomEntries();
    fetchTodayTimesheet();
    fetchProductivity();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await axios.get(`${backendUrl}/api/room-types`);
      setRoomTypes(response.data);
      if (response.data.length > 0) {
        setSelectedRoomType(response.data[0]);
      }
    } catch (error) {
      console.log('Failed to fetch room types:', error);
    }
  };

  const fetchTodayRoomEntries = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const today = getTodayDate();
      const response = await axios.get(`${backendUrl}/api/room-cleaning?employee_id=${user?.id}&date=${today}`);
      setTodayRoomEntries(response.data);
    } catch (error) {
      console.log('Failed to fetch room entries:', error);
    }
  };

  const fetchTodayTimesheet = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const today = getTodayDate();
      const response = await axios.get(`${backendUrl}/api/timesheets?employee_id=${user?.id}`);
      // Filter for today's entries
      const todayEntries = response.data.filter((ts: any) => {
        if (ts.clock_in) {
          const tsDate = ts.clock_in.split('T')[0];
          return tsDate === today;
        }
        return false;
      });
      const totalHours = todayEntries.reduce((sum: number, ts: any) => sum + (ts.total_hours || 0), 0);
      setTodayTimesheetHours(totalHours);
    } catch (error) {
      console.log('Failed to fetch timesheets:', error);
    }
  };

  const fetchProductivity = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const today = getTodayDate();
      const response = await axios.get(`${backendUrl}/api/productivity/${user?.id}?date=${today}`);
      setProductivity(response.data);
    } catch (error) {
      console.log('Failed to fetch productivity:', error);
    }
  };

  // Add room entry to the list
  const addRoomEntry = (roomType: any, status: string) => {
    const minutes = status === 'departure' 
      ? (roomType.departure_minutes || 30)
      : status === 'linen_change' 
        ? (roomType.linen_change_minutes || 20)
        : (roomType.stayover_minutes || 15);
    
    // Check if same room type + status already exists
    const existingIndex = roomEntries.findIndex(
      e => e.roomTypeId === roomType.id && e.status === status
    );
    
    if (existingIndex >= 0) {
      // Increment count
      const updated = [...roomEntries];
      updated[existingIndex].count += 1;
      updated[existingIndex].minutes = minutes * updated[existingIndex].count;
      setRoomEntries(updated);
    } else {
      // Add new entry
      setRoomEntries([...roomEntries, {
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        status,
        count: 1,
        minutes
      }]);
    }
  };

  // Remove room entry
  const removeRoomEntry = (index: number) => {
    const updated = [...roomEntries];
    if (updated[index].count > 1) {
      updated[index].count -= 1;
      const roomType = roomTypes.find(rt => rt.id === updated[index].roomTypeId);
      const mins = updated[index].status === 'departure' 
        ? (roomType?.departure_minutes || 30)
        : updated[index].status === 'linen_change'
          ? (roomType?.linen_change_minutes || 20)
          : (roomType?.stayover_minutes || 15);
      updated[index].minutes = mins * updated[index].count;
      setRoomEntries(updated);
    } else {
      updated.splice(index, 1);
      setRoomEntries(updated);
    }
  };

  // Calculate totals
  const getTotalRoomMinutes = () => {
    return roomEntries.reduce((sum, e) => sum + e.minutes, 0);
  };

  const getTotalRoomCount = () => {
    return roomEntries.reduce((sum, e) => sum + e.count, 0);
  };

  const getTodayRoomMinutes = () => {
    return todayRoomEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  };

  const getTodayRoomHours = () => {
    return getTodayRoomMinutes() / 60;
  };

  const getVariance = () => {
    return todayTimesheetHours - getTodayRoomHours();
  };

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Auto-format time input (e.g., "800" -> "08:00", "1430" -> "14:30")
  const formatTimeInput = (value: string): string => {
    // Remove any non-numeric characters except colon
    let cleaned = value.replace(/[^0-9:]/g, '');
    
    // If already has colon and is valid, return as is
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      if (parts.length === 2 && parts[0].length <= 2 && parts[1].length <= 2) {
        return cleaned;
      }
    }
    
    // Remove colon for processing
    cleaned = cleaned.replace(':', '');
    
    if (cleaned.length === 0) return '';
    
    // Handle different input lengths
    if (cleaned.length <= 2) {
      // Just hours: "8" -> "08:00", "12" -> "12:00"
      const hour = cleaned.padStart(2, '0');
      return `${hour}:00`;
    } else if (cleaned.length === 3) {
      // "800" -> "08:00", "930" -> "09:30"
      const hour = cleaned.slice(0, 1).padStart(2, '0');
      const min = cleaned.slice(1).padStart(2, '0');
      return `${hour}:${min}`;
    } else if (cleaned.length >= 4) {
      // "0800" -> "08:00", "1430" -> "14:30"
      const hour = cleaned.slice(0, 2);
      const min = cleaned.slice(2, 4);
      return `${hour}:${min}`;
    }
    
    return value;
  };

  // Calendar helper functions
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const formatDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = formatDateString(selectedDate);
    
    if (calendarTarget === 'daily') {
      setDailyDate(dateStr);
    } else if (calendarTarget === 'fortnight') {
      setFortnightStartDate(dateStr);
      generateFortnightDates(dateStr);
    } else if (calendarTarget === 'rooms') {
      setRoomDate(dateStr);
    }
    
    setShowCalendar(false);
  };

  const openCalendar = (target: 'daily' | 'fortnight' | 'rooms') => {
    setCalendarTarget(target);
    setCalendarMonth(new Date());
    setShowCalendar(true);
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCalendarMonth(newMonth);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateFortnightDates = (startDate: string) => {
    const entries = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      entries.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        startTime: '',
        endTime: '',
        breakMins: '30',
      });
    }
    
    setFortnightEntries(entries);
  };

  const openEntryModal = (mode: 'daily' | 'fortnight' | 'rooms') => {
    setEntryMode(mode);
    if (mode === 'daily') {
      setDailyDate(getTodayDate());
      setDailyStartTime('');
      setDailyEndTime('');
      setDailyBreak('30');
      setDailyNotes('');
      setDailyImage(null);
    } else if (mode === 'fortnight') {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      const startDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      setFortnightStartDate(startDate);
      generateFortnightDates(startDate);
      setFortnightImage(null);
    } else if (mode === 'rooms') {
      setRoomDate(getTodayDate());
      setRoomEntries([]);
      setRoomNotes('');
    }
    setShowEntryModal(true);
  };

  // Web file picker
  const pickImageWeb = (callback: (base64: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickImage = async (target: 'daily' | 'fortnight') => {
    const setImage = target === 'daily' ? setDailyImage : setFortnightImage;
    
    if (Platform.OS === 'web') {
      pickImageWeb((base64) => setImage(base64));
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0].base64) {
        setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const submitDailyTimesheet = async () => {
    console.log('Submitting daily timesheet...');
    console.log('Date:', dailyDate, 'Start:', dailyStartTime, 'End:', dailyEndTime);
    
    if (!dailyDate || !dailyStartTime || !dailyEndTime) {
      const msg = 'Please fill in date, start time and end time';
      console.log('Validation failed:', msg);
      Alert.alert('Missing Fields', msg);
      return;
    }

    // Format times before submission
    const formattedStart = formatTimeInput(dailyStartTime);
    const formattedEnd = formatTimeInput(dailyEndTime);
    console.log('Formatted times - Start:', formattedStart, 'End:', formattedEnd);

    setLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      console.log('Backend URL:', backendUrl);
      console.log('User ID:', user?.id);
      
      const payload = {
        employee_id: user?.id,
        date: dailyDate,
        clock_in_time: formattedStart,
        clock_out_time: formattedEnd,
        break_minutes: parseInt(dailyBreak) || 0,
        notes: dailyNotes,
        image: dailyImage,
      };
      console.log('Payload:', JSON.stringify(payload));
      
      const response = await axios.post(
        `${backendUrl}/api/timesheets/manual`,
        payload
      );

      console.log('Response:', response.data);
      
      if (response.data) {
        Alert.alert('Success', 'Timesheet submitted successfully!');
        setShowEntryModal(false);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      const msg = error.response?.data?.detail || error.message || 'Failed to submit';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const submitFortnightTimesheet = async () => {
    const validEntries = fortnightEntries.filter(e => e.startTime && e.endTime);
    
    if (validEntries.length === 0) {
      Alert.alert('No Entries', 'Please fill in at least one day with start and end time');
      return;
    }

    console.log('Submitting fortnight timesheet...');
    console.log('Valid entries:', validEntries.length);

    setLoading(true);
    let successCount = 0;
    let errorMsg = '';
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    
    for (const entry of validEntries) {
      try {
        // Format times before submission
        const formattedStart = formatTimeInput(entry.startTime);
        const formattedEnd = formatTimeInput(entry.endTime);
        console.log(`Entry ${entry.date}: ${formattedStart} - ${formattedEnd}`);
        
        await axios.post(`${backendUrl}/api/timesheets/manual`, {
          employee_id: user?.id,
          date: entry.date,
          clock_in_time: formattedStart,
          clock_out_time: formattedEnd,
          break_minutes: parseInt(entry.breakMins) || 0,
          notes: 'Fortnight entry',
          image: fortnightImage,
        });
        successCount++;
      } catch (err: any) {
        errorMsg = err.response?.data?.detail || err.message || 'Error';
        console.error('Failed to submit entry:', entry.date, err);
      }
    }
    
    setLoading(false);
    
    if (successCount > 0) {
      Alert.alert('Success', `${successCount} timesheet(s) submitted successfully!`);
      setShowEntryModal(false);
    } else {
      Alert.alert('Error', 'Failed to submit: ' + errorMsg);
    }
  };

  const submitRoomCleaning = async () => {
    if (!roomDate || roomEntries.length === 0) {
      Alert.alert('Missing Data', 'Please add at least one room entry');
      return;
    }

    setLoading(true);
    let successCount = 0;
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    
    for (const entry of roomEntries) {
      try {
        await axios.post(`${backendUrl}/api/room-cleaning`, {
          employee_id: user?.id,
          site_id: user?.site_id || 'default',
          date: roomDate,
          room_type_id: entry.roomTypeId,
          status: entry.status,
          count: entry.count,
          notes: roomNotes,
        });
        successCount++;
      } catch (error: any) {
        console.error('Room cleaning submit error:', error);
      }
    }

    setLoading(false);
    
    if (successCount > 0) {
      const totalRooms = getTotalRoomCount();
      const totalMins = getTotalRoomMinutes();
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      Alert.alert('Success', `${totalRooms} room(s) logged! (${hours}h ${mins}m credit)`);
      setShowEntryModal(false);
      setRoomEntries([]);
      setRoomNotes('');
      fetchTodayRoomEntries();
      fetchTodayTimesheet();
      fetchProductivity();
    } else {
      Alert.alert('Error', 'Failed to submit room entries');
    }
  };

  const deleteTodayRoomEntry = async (entryId: string) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this room entry?')) return;
    }

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      await axios.delete(`${backendUrl}/api/room-cleaning/${entryId}`);
      fetchTodayRoomEntries();
      fetchProductivity();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const updateFortnightEntry = (index: number, field: string, value: string) => {
    const updated = [...fortnightEntries];
    updated[index][field] = value;
    setFortnightEntries(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Cards */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Submit Timesheet</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('daily')}>
            <View style={[styles.cardIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="today" size={28} color="#6366f1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Single Day Entry</Text>
              <Text style={styles.cardDesc}>Submit hours for one day</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('fortnight')}>
            <View style={[styles.cardIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="calendar" size={28} color="#10b981" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Fortnight Entry</Text>
              <Text style={styles.cardDesc}>Submit 2 weeks at once</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => openEntryModal('rooms')}>
            <View style={[styles.cardIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="bed" size={28} color="#f59e0b" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Room Cleaning</Text>
              <Text style={styles.cardDesc}>Log rooms cleaned today</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Productivity Comparison Card */}
        {(todayTimesheetHours > 0 || todayRoomEntries.length > 0) && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Today's Productivity</Text>
            <View style={styles.productivityCard}>
              {/* Main Stats Row */}
              <View style={styles.productivityStatsRow}>
                <View style={styles.productivityStat}>
                  <Text style={styles.productivityStatLabel}>Timesheet</Text>
                  <Text style={styles.productivityStatValue}>{todayTimesheetHours.toFixed(1)}h</Text>
                  <Text style={styles.productivityStatSub}>Actual Hours</Text>
                </View>
                <View style={styles.productivityDivider} />
                <View style={styles.productivityStat}>
                  <Text style={styles.productivityStatLabel}>Room Credits</Text>
                  <Text style={styles.productivityStatValue}>{getTodayRoomHours().toFixed(1)}h</Text>
                  <Text style={styles.productivityStatSub}>Expected Hours</Text>
                </View>
                <View style={styles.productivityDivider} />
                <View style={styles.productivityStat}>
                  <Text style={styles.productivityStatLabel}>Variance</Text>
                  <Text style={[
                    styles.productivityStatValue,
                    { color: getVariance() >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {getVariance() >= 0 ? '+' : ''}{getVariance().toFixed(1)}h
                  </Text>
                  <Text style={styles.productivityStatSub}>
                    {getVariance() >= 0 ? 'Ahead' : 'Behind'}
                  </Text>
                </View>
              </View>
              
              {/* Efficiency Bar */}
              <View style={styles.efficiencySection}>
                <View style={styles.efficiencyHeader}>
                  <Text style={styles.efficiencyLabel}>Efficiency</Text>
                  <Text style={styles.efficiencyPercent}>
                    {todayTimesheetHours > 0 
                      ? Math.round((getTodayRoomHours() / todayTimesheetHours) * 100) 
                      : 0}%
                  </Text>
                </View>
                <View style={styles.efficiencyBarBg}>
                  <View style={[
                    styles.efficiencyBarFill,
                    { 
                      width: `${Math.min(100, todayTimesheetHours > 0 ? (getTodayRoomHours() / todayTimesheetHours) * 100 : 0)}%`,
                      backgroundColor: (getTodayRoomHours() / todayTimesheetHours) >= 0.8 ? '#10b981' : '#f59e0b'
                    }
                  ]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Today's Room Summary */}
        {todayRoomEntries.length > 0 && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Rooms Cleaned Today</Text>
            <View style={styles.roomSummaryCard}>
              <View style={styles.roomSummaryHeader}>
                <View style={styles.roomSummaryHeaderItem}>
                  <Ionicons name="bed" size={20} color="#6366f1" />
                  <Text style={styles.roomSummaryHeaderValue}>
                    {todayRoomEntries.reduce((sum, e) => sum + e.count, 0)} rooms
                  </Text>
                </View>
                <View style={styles.roomSummaryHeaderItem}>
                  <Ionicons name="time" size={20} color="#10b981" />
                  <Text style={styles.roomSummaryHeaderValue}>
                    {(() => {
                      const totalMins = getTodayRoomMinutes();
                      const hours = Math.floor(totalMins / 60);
                      const mins = totalMins % 60;
                      return hours > 0 ? `${hours}h ${mins}m` : `${totalMins}m`;
                    })()}
                  </Text>
                </View>
              </View>
              {todayRoomEntries.map((entry, index) => (
                <View key={entry.id || index} style={styles.roomEntryItem}>
                  <View style={styles.roomEntryInfo}>
                    <Text style={styles.roomEntryType}>{entry.room_type_name}</Text>
                    <Text style={styles.roomEntryStatus}>
                      {entry.status === 'departure' ? '🚪 Departure' : 
                       entry.status === 'linen_change' ? '🛏️ Linen' : '🧹 Stayover'} • {entry.total_minutes || 0}m
                    </Text>
                  </View>
                  <View style={styles.roomEntryRight}>
                    <Text style={styles.roomEntryCount}>×{entry.count}</Text>
                    <TouchableOpacity onPress={() => deleteTodayRoomEntry(entry.id)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Entry Modal */}
      <Modal visible={showEntryModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {entryMode === 'daily' ? 'Daily Entry' : entryMode === 'fortnight' ? 'Fortnight Entry' : 'Room Cleaning'}
            </Text>
            <TouchableOpacity 
              onPress={entryMode === 'daily' ? submitDailyTimesheet : entryMode === 'fortnight' ? submitFortnightTimesheet : submitRoomCleaning} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={styles.submitBtn}>Submit</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {entryMode === 'daily' && (
              /* DAILY ENTRY FORM */
              <View style={styles.form}>
                <Text style={styles.label}>Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={dailyDate}
                    onChangeText={setDailyDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity style={styles.calendarBtn} onPress={() => openCalendar('daily')}>
                    <Ionicons name="calendar" size={24} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Start Time</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyStartTime}
                      onChangeText={setDailyStartTime}
                      placeholder="HH:MM (e.g. 09:00)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>End Time</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyEndTime}
                      onChangeText={setDailyEndTime}
                      placeholder="HH:MM (e.g. 17:00)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Break (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={dailyBreak}
                  onChangeText={setDailyBreak}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={dailyNotes}
                  onChangeText={setDailyNotes}
                  placeholder="Add notes..."
                  multiline
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Photo Evidence (optional)</Text>
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('daily')}>
                  <Ionicons name="camera" size={20} color="#6366f1" />
                  <Text style={styles.photoBtnText}>Upload Photo</Text>
                </TouchableOpacity>
                {dailyImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: dailyImage }} style={styles.previewImg} />
                    <TouchableOpacity style={styles.removeImg} onPress={() => setDailyImage(null)}>
                      <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            
            {entryMode === 'fortnight' && (
              /* FORTNIGHT ENTRY FORM */
              <View style={styles.form}>
                <Text style={styles.label}>Fortnight Start Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={fortnightStartDate}
                    onChangeText={(val) => {
                      setFortnightStartDate(val);
                      if (val.length === 10) generateFortnightDates(val);
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity style={styles.calendarBtn} onPress={() => openCalendar('fortnight')}>
                    <Ionicons name="calendar" size={24} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Enter Times (leave blank for days off)</Text>
                
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.thDay}>Day</Text>
                  <Text style={styles.thTime}>Start</Text>
                  <Text style={styles.thTime}>End</Text>
                  <Text style={styles.thBreak}>Break</Text>
                </View>

                {/* Table Rows */}
                {fortnightEntries.map((entry, index) => (
                  <View key={entry.date} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                    <View style={styles.tdDay}>
                      <Text style={styles.dayName}>{entry.dayName}</Text>
                      <Text style={styles.dayNum}>{entry.dayNum}</Text>
                    </View>
                    <TextInput
                      style={styles.tdInput}
                      value={entry.startTime}
                      onChangeText={(val) => updateFortnightEntry(index, 'startTime', val)}
                      placeholder="09:00"
                      placeholderTextColor="#cbd5e1"
                    />
                    <TextInput
                      style={styles.tdInput}
                      value={entry.endTime}
                      onChangeText={(val) => updateFortnightEntry(index, 'endTime', val)}
                      placeholder="17:00"
                      placeholderTextColor="#cbd5e1"
                    />
                    <TextInput
                      style={styles.tdBreak}
                      value={entry.breakMins}
                      onChangeText={(val) => updateFortnightEntry(index, 'breakMins', val)}
                      placeholder="30"
                      keyboardType="numeric"
                      placeholderTextColor="#cbd5e1"
                    />
                  </View>
                ))}

                {/* Photo Section */}
                <View style={styles.photoSection}>
                  <Text style={styles.photoTitle}>📷 Attach Timesheet Photo</Text>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('fortnight')}>
                    <Ionicons name="camera" size={20} color="#6366f1" />
                    <Text style={styles.photoBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                  {fortnightImage && (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: fortnightImage }} style={styles.previewImg} />
                      <TouchableOpacity style={styles.removeImg} onPress={() => setFortnightImage(null)}>
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {entryMode === 'rooms' && (
              /* ROOM CLEANING FORM - MULTI-SELECT */
              <View style={styles.form}>
                <Text style={styles.label}>Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={roomDate}
                    onChangeText={setRoomDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity style={styles.calendarBtn} onPress={() => openCalendar('rooms')}>
                    <Ionicons name="calendar" size={24} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Select Room Types & Status</Text>
                <Text style={styles.subLabel}>Tap to add, tap multiple times to increase count</Text>
                
                {/* Room Types Grid with Actions */}
                {roomTypes.map((rt) => (
                  <View key={rt.id} style={styles.roomTypeRow}>
                    <View style={styles.roomTypeRowHeader}>
                      <Text style={styles.roomTypeRowName}>{rt.name}</Text>
                    </View>
                    <View style={styles.roomTypeRowActions}>
                      <TouchableOpacity 
                        style={styles.roomActionBtn}
                        onPress={() => addRoomEntry(rt, 'departure')}
                      >
                        <Text style={styles.roomActionEmoji}>🚪</Text>
                        <Text style={styles.roomActionTime}>{rt.departure_minutes || 30}m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.roomActionBtn}
                        onPress={() => addRoomEntry(rt, 'linen_change')}
                      >
                        <Text style={styles.roomActionEmoji}>🛏️</Text>
                        <Text style={styles.roomActionTime}>{rt.linen_change_minutes || 20}m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.roomActionBtn}
                        onPress={() => addRoomEntry(rt, 'stayover')}
                      >
                        <Text style={styles.roomActionEmoji}>🧹</Text>
                        <Text style={styles.roomActionTime}>{rt.stayover_minutes || 15}m</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Selected Rooms List */}
                {roomEntries.length > 0 && (
                  <View style={styles.selectedRoomsSection}>
                    <Text style={styles.selectedRoomsTitle}>Added Rooms</Text>
                    {roomEntries.map((entry, index) => (
                      <View key={index} style={styles.selectedRoomItem}>
                        <View style={styles.selectedRoomInfo}>
                          <Text style={styles.selectedRoomName}>{entry.roomTypeName}</Text>
                          <Text style={styles.selectedRoomStatus}>
                            {entry.status === 'departure' ? '🚪 Departure' : 
                             entry.status === 'linen_change' ? '🛏️ Linen' : '🧹 Stayover'}
                          </Text>
                        </View>
                        <View style={styles.selectedRoomRight}>
                          <TouchableOpacity 
                            style={styles.selectedRoomMinus}
                            onPress={() => removeRoomEntry(index)}
                          >
                            <Ionicons name="remove" size={16} color="#ef4444" />
                          </TouchableOpacity>
                          <Text style={styles.selectedRoomCount}>×{entry.count}</Text>
                          <TouchableOpacity 
                            style={styles.selectedRoomPlus}
                            onPress={() => {
                              const rt = roomTypes.find(r => r.id === entry.roomTypeId);
                              if (rt) addRoomEntry(rt, entry.status);
                            }}
                          >
                            <Ionicons name="add" size={16} color="#10b981" />
                          </TouchableOpacity>
                          <Text style={styles.selectedRoomMinutes}>{entry.minutes}m</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Total Summary */}
                <View style={styles.roomTotalCard}>
                  <View style={styles.roomTotalRow}>
                    <View style={styles.roomTotalItem}>
                      <Ionicons name="bed" size={24} color="#6366f1" />
                      <Text style={styles.roomTotalValue}>{getTotalRoomCount()}</Text>
                      <Text style={styles.roomTotalLabel}>Rooms</Text>
                    </View>
                    <View style={styles.roomTotalDivider} />
                    <View style={styles.roomTotalItem}>
                      <Ionicons name="time" size={24} color="#10b981" />
                      <Text style={styles.roomTotalValue}>
                        {(() => {
                          const totalMins = getTotalRoomMinutes();
                          const hours = Math.floor(totalMins / 60);
                          const mins = totalMins % 60;
                          return hours > 0 ? `${hours}h ${mins}m` : `${totalMins}m`;
                        })()}
                      </Text>
                      <Text style={styles.roomTotalLabel}>Credit</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={roomNotes}
                  onChangeText={setRoomNotes}
                  placeholder="Add notes..."
                  multiline
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}
            
            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="fade" transparent>
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-back" size={24} color="#6366f1" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-forward" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>
            
            {/* Day Names */}
            <View style={styles.calendarDayNames}>
              {dayNames.map(day => (
                <Text key={day} style={styles.calendarDayName}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {getMonthDays(calendarMonth).map((day, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.calendarDay,
                    day === null && styles.calendarDayEmpty,
                    day !== null && styles.calendarDayActive
                  ]}
                  onPress={() => day !== null && handleDateSelect(day)}
                  disabled={day === null}
                >
                  {day !== null && <Text style={styles.calendarDayText}>{day}</Text>}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Close Button */}
            <TouchableOpacity style={styles.calendarCloseBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.calendarCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image View Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.imageModalBg}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewingImage && <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollView: { flex: 1 },
  
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  
  cardsSection: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  cardDesc: { fontSize: 14, color: '#64748b', marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cancelBtn: { fontSize: 16, color: '#64748b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  submitBtn: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  
  modalBody: { flex: 1 },
  form: { padding: 20 },
  
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#1e293b' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed' },
  photoBtnText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImg: { width: '100%', height: 200, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#6366f1', padding: 12, borderRadius: 8, marginTop: 12 },
  thDay: { width: 60, fontSize: 12, fontWeight: '700', color: '#fff' },
  thTime: { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  thBreak: { width: 50, fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  
  tdDay: { width: 60 },
  dayName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  dayNum: { fontSize: 12, color: '#64748b' },
  
  tdInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, marginHorizontal: 4, fontSize: 14, color: '#1e293b', textAlign: 'center' },
  tdBreak: { width: 50, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, fontSize: 14, color: '#1e293b', textAlign: 'center' },
  
  photoSection: { marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#6366f1' },
  photoTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  
  // Date input with calendar button
  dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1 },
  calendarBtn: { width: 56, height: 56, backgroundColor: '#eef2ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#c7d2fe' },
  
  // Calendar modal styles
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  calendarTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  calendarDayNames: { flexDirection: 'row', marginBottom: 10 },
  calendarDayName: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#64748b' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarDayEmpty: { opacity: 0 },
  calendarDayActive: { },
  calendarDayText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
  calendarCloseBtn: { marginTop: 20, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
  calendarCloseBtnText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  
  imageModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },

  // Room Cleaning styles
  roomTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomTypeOption: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', minWidth: '30%', alignItems: 'center' },
  roomTypeSelected: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  roomTypeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  roomTypeTextSelected: { color: '#fff' },
  roomTypeCredits: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  statusBtnActive: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  statusEmoji: { fontSize: 24 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 4 },
  statusTextActive: { color: '#92400e' },
  statusMultiplier: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  counterBtn: { width: 50, height: 50, backgroundColor: '#eef2ff', borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#c7d2fe' },
  counterInput: { width: 80, fontSize: 32, fontWeight: '800', color: '#1e293b', textAlign: 'center' },

  creditsPreview: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#dcfce7', padding: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  creditsLabel: { fontSize: 16, fontWeight: '600', color: '#166534' },
  creditsValue: { fontSize: 24, fontWeight: '800', color: '#166534' },

  // Room Summary styles
  roomSummaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  roomSummaryHeader: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#f1f5f9', marginBottom: 12 },
  roomSummaryHeaderItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomSummaryHeaderValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  roomSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roomSummaryLabel: { fontSize: 14, color: '#64748b' },
  roomSummaryValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  roomEntryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roomEntryInfo: { flex: 1 },
  roomEntryType: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  roomEntryStatus: { fontSize: 12, color: '#64748b', marginTop: 2 },
  roomEntryRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomEntryCount: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  
  // Productivity Card styles
  productivityCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
  productivityStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productivityStat: { flex: 1, alignItems: 'center' },
  productivityStatLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  productivityStatValue: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  productivityStatSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  productivityDivider: { width: 1, height: 50, backgroundColor: '#e2e8f0' },
  efficiencySection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  efficiencyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  efficiencyLabel: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  efficiencyPercent: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  efficiencyBarBg: { height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' },
  efficiencyBarFill: { height: '100%', borderRadius: 6 },
  
  // Multi-room selection styles
  subLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 12, marginTop: -8 },
  roomTypeRow: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  roomTypeRowHeader: { marginBottom: 10 },
  roomTypeRowName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  roomTypeRowActions: { flexDirection: 'row', gap: 8 },
  roomActionBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  roomActionEmoji: { fontSize: 20 },
  roomActionTime: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 4 },
  
  selectedRoomsSection: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#6366f1' },
  selectedRoomsTitle: { fontSize: 14, fontWeight: '700', color: '#6366f1', marginBottom: 12 },
  selectedRoomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectedRoomInfo: { flex: 1 },
  selectedRoomName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  selectedRoomStatus: { fontSize: 12, color: '#64748b', marginTop: 2 },
  selectedRoomRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedRoomMinus: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  selectedRoomPlus: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  selectedRoomCount: { fontSize: 16, fontWeight: '700', color: '#1e293b', minWidth: 30, textAlign: 'center' },
  selectedRoomMinutes: { fontSize: 14, fontWeight: '600', color: '#6366f1', minWidth: 50, textAlign: 'right' },
  
  roomTotalCard: { backgroundColor: '#6366f1', borderRadius: 16, padding: 20, marginTop: 20 },
  roomTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  roomTotalItem: { alignItems: 'center' },
  roomTotalValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 },
  roomTotalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roomTotalDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.3)' },
});
