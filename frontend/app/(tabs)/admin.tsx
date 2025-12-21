import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { getSites, createSite, createUser, getUsers } from '../../utils/api';
import { colors } from '../../constants/colors';
import axios from 'axios';
import PermissionsModal from '../../components/PermissionsModal';
import AvailabilitySnapshot from '../../components/AvailabilitySnapshot';
import ReportsCenter from '../../components/ReportsCenter';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [payRates, setPayRates] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPayRateModal, setShowPayRateModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Invitation form
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteJobTitle, setInviteJobTitle] = useState('Room Attendant');
  const [inviteSiteId, setInviteSiteId] = useState('');
  
  // Pay rate form
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [weekdayRate, setWeekdayRate] = useState('');
  const [saturdayRate, setSaturdayRate] = useState('');
  const [sundayRate, setSundayRate] = useState('');
  const [publicHolidayRate, setPublicHolidayRate] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');

  // Site form
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteGpsLat, setSiteGpsLat] = useState('');
  const [siteGpsLong, setSiteGpsLong] = useState('');
  const [lookingUpAddress, setLookingUpAddress] = useState(false);

  // User form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [jobTitle, setJobTitle] = useState('Room Attendant');
  const [pin, setPin] = useState('');
  const [abn, setAbn] = useState('');
  const [isContractor, setIsContractor] = useState(false);
  const [awardLevel, setAwardLevel] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  
  // Permissions modal
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    view_home: true,
    view_own_timesheets: true,
    clock_in_out: true,
    view_roster: false,
    request_time_off: false,
    view_own_pay: false,
    view_all_timesheets: false,
    edit_timesheets: false,
    approve_timesheets: false,
    manage_roster: false,
    view_reports: false,
    manage_users: false,
    manage_sites: false,
    export_payroll: false,
    manage_permissions: false,
  });

  // Security check - only admins can access
  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page');
      router.replace('/home');
    }
  }, [user]);

  // Define fetchData BEFORE using it in useEffect
  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching admin data...');
      const [sitesData, usersData, payRatesData] = await Promise.all([
        getSites(),
        getUsers(),
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/pay-rates`),
      ]);
      console.log(`Loaded: ${sitesData?.length || 0} sites, ${usersData?.length || 0} users`);
      setSites(sitesData || []);
      setUsers(usersData || []);
      
      // Deduplicate pay rates by award_level (keep the first occurrence of each level)
      const uniquePayRates = (payRatesData.data || []).reduce((acc: any[], rate: any) => {
        if (!acc.find((r) => r.award_level === rate.award_level)) {
          acc.push(rate);
        }
        return acc;
      }, []);
      setPayRates(uniquePayRates);
      
      // Fetch earnings
      fetchEarnings();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load data. Pull down to refresh.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleBulkDeleteTimesheets = async (type: string) => {
    let confirmMessage = '';
    let endpoint = '';
    
    if (type === 'rejected') {
      confirmMessage = 'Delete ALL rejected timesheets? This cannot be undone.';
      endpoint = '/api/timesheets/bulk-delete?status=rejected';
    } else if (type === 'out_of_bounds') {
      confirmMessage = 'Delete ALL out-of-bounds timesheets? This cannot be undone.';
      endpoint = '/api/timesheets/bulk-delete-out-of-bounds';
    }
    
    Alert.alert(
      'Confirm Delete',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.delete(`${process.env.EXPO_PUBLIC_BACKEND_URL}${endpoint}`);
              Alert.alert('Success', response.data.message || 'Timesheets deleted');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete timesheets');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/earnings/summary`);
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  // Call fetchData on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Don't render anything if not admin
  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied</Text>
      </View>
    );
  }

  // Auto-lookup address to get GPS coordinates
  const lookupAddressCoordinates = async () => {
    if (!siteAddress || siteAddress.trim().length < 5) {
      Alert.alert('Error', 'Please enter a valid address first');
      return;
    }

    setLookingUpAddress(true);
    try {
      // Use OpenStreetMap Nominatim API (free, no API key needed)
      const encodedAddress = encodeURIComponent(siteAddress.trim());
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'SupremeWorkforceApp/1.0'
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        setSiteGpsLat(parseFloat(location.lat).toFixed(6));
        setSiteGpsLong(parseFloat(location.lon).toFixed(6));
        Alert.alert(
          '✅ Location Found', 
          `Address: ${location.display_name}\n\nLatitude: ${location.lat}\nLongitude: ${location.lon}`
        );
      } else {
        Alert.alert(
          'Location Not Found', 
          'Could not find coordinates for this address. Please try a more specific address or enter coordinates manually.'
        );
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to lookup address. Please try again or enter coordinates manually.');
    } finally {
      setLookingUpAddress(false);
    }
  };

  const handleCreateSite = async () => {
    if (!siteName || !siteAddress || !siteGpsLat || !siteGpsLong) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await createSite({
        name: siteName,
        address: siteAddress,
        gps_lat: parseFloat(siteGpsLat),
        gps_long: parseFloat(siteGpsLong),
        radius_meters: 100,
      });
      Alert.alert('Success', 'Site created successfully!');
      setShowSiteModal(false);
      resetSiteForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!firstName || !lastName || !phone || !email || !pin) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedSiteId) {
      Alert.alert('Error', 'Please select a site for the employee');
      return;
    }

    if (isContractor && !abn) {
      Alert.alert('Error', 'Please provide ABN for contractors');
      return;
    }

    setLoading(true);
    try {
      await createUser({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        role,
        job_title: jobTitle,
        pin,
        site_id: selectedSiteId,
        award_level: awardLevel,
        abn: isContractor ? abn : null,
        is_contractor: isContractor,
      });
      Alert.alert('Success', 'Employee created successfully!');
      setShowUserModal(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (user) => {
    setEditingEmployee(user);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPhone(user.phone);
    setEmail(user.email);
    setRole(user.role);
    setJobTitle(user.job_title);
    setAwardLevel(user.award_level || 1);
    setIsContractor(user.is_contractor || false);
    setAbn(user.abn || '');
    setSelectedSiteId(user.site_id || '');
    setIsEditMode(true);
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'Disable' : 'Enable';
    
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${user.first_name} ${user.last_name}?${newStatus === 'inactive' ? '\n\nThey will not be able to login.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: newStatus === 'inactive' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.put(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${user.id}`,
                { status: newStatus }
              );
              Alert.alert('Success', `User ${action.toLowerCase()}d successfully`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || `Failed to ${action.toLowerCase()} user`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.first_name} ${user.last_name}?\n\nThis will:\n- Remove their account\n- Delete all their timesheets\n- Remove them from roster\n\nThis action cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${user.id}`
              );
              Alert.alert('Success', 'User deleted successfully');
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete user');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChangeUserRole = async (user) => {
    Alert.alert(
      'Change Role',
      `Select new role for ${user.first_name} ${user.last_name}`,
      [
        {
          text: 'Employee',
          onPress: () => updateUserRole(user, 'employee')
        },
        {
          text: 'Supervisor',
          onPress: () => updateUserRole(user, 'supervisor')
        },
        {
          text: 'Admin',
          onPress: () => updateUserRole(user, 'admin')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateUserRole = async (user, newRole) => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${user.id}`,
        { role: newRole }
      );
      Alert.alert('Success', `Role changed to ${newRole}`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!inviteFirstName || !inviteLastName || !inviteEmail || !invitePhone || !inviteSiteId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/invitations`,
        {
          first_name: inviteFirstName,
          last_name: inviteLastName,
          email: inviteEmail,
          phone: invitePhone,
          job_title: inviteJobTitle,
          role: 'employee',
          site_id: inviteSiteId
        }
      );

      // Use the invitation_link from backend response which has the correct domain
      const fullLink = response.data.invitation_link;
      setInviteLink(fullLink);
      
      Alert.alert(
        'Invitation Created!',
        `${response.data.email_sent ? 'Email sent to' : 'Share this link with'} ${inviteFirstName} ${inviteLastName}${response.data.email_sent ? ' ✅' : ''}`,
        [
          {
            text: 'Copy Link',
            onPress: () => {
              // Show the link since we can't copy on web easily
              Alert.alert('Registration Link', fullLink);
            }
          },
          { text: 'OK' }
        ]
      );
      
      // Reset form
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      setInvitePhone('');
      setInviteJobTitle('Room Attendant');
      setInviteSiteId('');
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (site) => {
    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete ${site.name}?\n\nNote: You can only delete sites with no assigned employees or roster shifts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites/${site.id}`
              );
              Alert.alert('Success', 'Site deleted successfully');
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete site');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenPermissionsModal = (user) => {
    setSelectedUserForPermissions(user);
    setUserPermissions(user.permissions || {
      view_home: true,
      view_own_timesheets: true,
      clock_in_out: true,
      view_roster: false,
      request_time_off: false,
      view_own_pay: false,
      view_all_timesheets: false,
      edit_timesheets: false,
      approve_timesheets: false,
      manage_roster: false,
      view_reports: false,
      manage_users: false,
      manage_sites: false,
      export_payroll: false,
      manage_permissions: false,
    });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${selectedUserForPermissions.id}`,
        { permissions: userPermissions }
      );
      Alert.alert('Success', 'Permissions updated successfully');
      setShowPermissionsModal(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateEmployee = async () => {
    if (!firstName || !lastName || !phone || !email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedSiteId) {
      Alert.alert('Error', 'Please select a site for the employee');
      return;
    }

    if (isContractor && !abn) {
      Alert.alert('Error', 'Please provide ABN for contractors');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${editingEmployee.id}`, {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        role,
        job_title: jobTitle,
        site_id: selectedSiteId,
        award_level: awardLevel,
        abn: isContractor ? abn : null,
        is_contractor: isContractor,
      });
      Alert.alert('Success', 'Employee updated successfully!');
      setShowUserModal(false);
      resetUserForm();
      setIsEditMode(false);
      setEditingEmployee(null);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const resetSiteForm = () => {
    setSiteName('');
    setSiteAddress('');
    setSiteGpsLat('');
    setSiteGpsLong('');
  };

  const resetUserForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setRole('employee');
    setJobTitle('Room Attendant');
    setPin('');
    setAbn('');
    setAwardLevel(1);
    setIsContractor(false);
    setIsEditMode(false);
    setEditingEmployee(null);
    setSelectedSiteId('');
    setIsContractor(false);
    setAwardLevel(1);
  };

  const handleEditPayRate = async () => {
    if (!weekdayRate || !saturdayRate || !sundayRate || !publicHolidayRate || !overtimeRate) {
      Alert.alert('Error', 'Please fill in all rate fields');
      return;
    }

    setLoading(true);
    try {
      // Use PUT endpoint to update/upsert pay rate for the selected level
      await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/pay-rates/${selectedLevel}`, {
        award_level: selectedLevel,
        weekday_rate: parseFloat(weekdayRate),
        saturday_rate: parseFloat(saturdayRate),
        sunday_rate: parseFloat(sundayRate),
        public_holiday_rate: parseFloat(publicHolidayRate),
        overtime_rate: parseFloat(overtimeRate),
      });
      
      Alert.alert('Success', `Pay rate for Level ${selectedLevel} updated successfully!`);
      setShowPayRateModal(false);
      resetPayRateForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update pay rate');
    } finally {
      setLoading(false);
    }
  };

  const resetPayRateForm = () => {
    setSelectedLevel(1);
    setWeekdayRate('');
    setSaturdayRate('');
    setSundayRate('');
    setPublicHolidayRate('');
    setOvertimeRate('');
  };

  const loadPayRate = (level) => {
    const rate = payRates.find((r) => r.award_level === level);
    if (rate) {
      setWeekdayRate(rate.weekday_rate.toString());
      setSaturdayRate(rate.saturday_rate.toString());
      setSundayRate(rate.sunday_rate.toString());
      setPublicHolidayRate(rate.public_holiday_rate.toString());
      setOvertimeRate(rate.overtime_rate.toString());
    }
  };

  const handlePayrollExport = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Last 14 days

      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/export`, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      Alert.alert(
        'Payroll Export Ready',
        `Records: ${response.data.record_count}\nTotal Hours: ${response.data.total_hours.toFixed(2)}\nTotal Pay: $${response.data.total_pay.toFixed(2)}\n\nCSV data is ready for download.`,
        [{ text: 'OK' }]
      );
      
      console.log('CSV Data:', response.data.csv_data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to export payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Last 14 days

      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payroll/export-excel`, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }, {
        responseType: 'blob'
      });

      Alert.alert(
        'Excel Export Ready',
        `Excel payroll file has been generated successfully for the last 14 days.\n\nThe file contains detailed payroll information including hours worked, pay rates, and total compensation.`,
        [{ text: 'OK' }]
      );
      
      console.log('Excel file generated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to export Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => setShowReportsModal(true)}
        >
          <Ionicons name="bar-chart" size={28} color={colors.white} />
          <View style={styles.availabilityButtonContent}>
            <Text style={styles.availabilityButtonTitle}>Reports Center</Text>
            <Text style={styles.availabilityButtonSubtitle}>Generate payroll, roster, timesheet & ABN reports</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.availabilityButton, { backgroundColor: colors.success }]}
          onPress={() => setShowBankDetailsModal(true)}
        >
          <Ionicons name="card" size={24} color={colors.white} />
          <View style={styles.availabilityButtonContent}>
            <Text style={styles.availabilityButtonTitle}>Employee Bank Details</Text>
            <Text style={styles.availabilityButtonSubtitle}>View all bank accounts for payroll</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.availabilityButton}
          onPress={() => setShowAvailabilityModal(true)}
        >
          <Ionicons name="people" size={24} color={colors.white} />
          <View style={styles.availabilityButtonContent}>
            <Text style={styles.availabilityButtonTitle}>Employee Availability</Text>
            <Text style={styles.availabilityButtonSubtitle}>View weekly snapshot by site</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        {/* Timesheet Cleanup Section */}
        <View style={styles.cleanupSection}>
          <Text style={styles.cleanupTitle}>Timesheet Cleanup</Text>
          <View style={styles.cleanupButtons}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleBulkDeleteTimesheets('rejected')}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={styles.deleteButtonText}>Delete Rejected</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.warning }]}
              onPress={() => handleBulkDeleteTimesheets('out_of_bounds')}
            >
              <Ionicons name="location-outline" size={20} color={colors.white} />
              <Text style={styles.deleteButtonText}>Delete Out of Bounds</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Employee Earnings</Text>
        </View>

        {earnings && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>${earnings.total_pay?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.summaryLabel}>Total Pay</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{earnings.total_hours?.toFixed(1) || '0'}</Text>
                <Text style={styles.summaryLabel}>Total Hours</Text>
              </View>
            </View>

            {earnings.employees?.map((emp) => (
              <View key={emp.employee_id} style={styles.card}>
                <Ionicons name="person-circle" size={24} color={colors.success} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{emp.name}</Text>
                  <Text style={styles.cardSubtitle}>{emp.job_title} • Level {emp.award_level}</Text>
                  <View style={styles.earningsRow}>
                    <Text style={styles.earningsText}>
                      {emp.shift_count} shifts • {emp.total_hours} hrs • ${emp.total_pay.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pay Rates ({payRates.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowPayRateModal(true)}
          >
            <Ionicons name="create" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Edit Rates</Text>
          </TouchableOpacity>
        </View>

        {payRates.map((rate) => (
          <View key={rate.id} style={styles.card}>
            <Ionicons name="pricetag" size={24} color={colors.gold} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Level {rate.award_level}</Text>
              <Text style={styles.cardSubtitle}>
                Weekday: ${rate.weekday_rate} | Sat: ${rate.saturday_rate} | Sun: ${rate.sunday_rate}
              </Text>
              <Text style={styles.cardDetails}>
                PH: ${rate.public_holiday_rate} | OT: ${rate.overtime_rate}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sites ({sites.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowSiteModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add Site</Text>
          </TouchableOpacity>
        </View>

        {sites.map((site) => (
          <View key={site.id} style={styles.card}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{site.name}</Text>
              <Text style={styles.cardSubtitle}>{site.address}</Text>
              <Text style={styles.cardDetails}>
                GPS: {site.gps_lat.toFixed(6)}, {site.gps_long.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.error + '10' }]}
              onPress={() => handleDeleteSite(site)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payroll Export</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[styles.addButton, { flex: 1 }]}
              onPress={handlePayrollExport}
              disabled={loading}
            >
              <Ionicons name="document-text" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>CSV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addButton, { flex: 1, backgroundColor: colors.success }]}
              onPress={handleExcelExport}
              disabled={loading}
            >
              <Ionicons name="stats-chart" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Ionicons name="cash" size={24} color={colors.success} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Weekly/Fortnightly Payroll</Text>
            <Text style={styles.cardSubtitle}>Export approved timesheets with calculated pay</Text>
            <Text style={styles.cardDetails}>Includes award rates, penalties, and overtime</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Employees ({users.length})</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.success }]}
              onPress={() => setShowInviteModal(true)}
            >
              <Ionicons name="mail" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowUserModal(true)}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {users.map((user) => (
          <View key={user.id} style={styles.card}>
            <Ionicons name="person" size={24} color={colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{user.first_name} {user.last_name}</Text>
              <Text style={styles.cardSubtitle}>{user.job_title} • Level {user.award_level || 1}</Text>
              <Text style={styles.cardDetails}>{user.phone} • {user.email}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role}</Text>
                </View>
                {user.is_contractor && (
                  <View style={styles.abnBadge}>
                    <Ionicons name="briefcase" size={10} color={colors.gold} />
                    <Text style={styles.abnText}>ABN</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'column', gap: 6 }}>
              {/* Row 1: Edit & Permissions */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditEmployee(user)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleOpenPermissionsModal(user)}
                >
                  <Ionicons name="shield-checkmark" size={18} color={colors.gold} />
                </TouchableOpacity>
              </View>
              
              {/* Row 2: Role & Status */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: colors.primary + '10' }]}
                  onPress={() => handleChangeUserRole(user)}
                >
                  <Ionicons name="person-circle" size={18} color={colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.editButton, { 
                    backgroundColor: user.status === 'active' ? colors.warning + '10' : colors.success + '10' 
                  }]}
                  onPress={() => handleToggleUserStatus(user)}
                >
                  <Ionicons 
                    name={user.status === 'active' ? "pause" : "play"} 
                    size={18} 
                    color={user.status === 'active' ? colors.warning : colors.success} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Row 3: Delete */}
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.error + '10', width: '100%' }]}
                onPress={() => handleDeleteUser(user)}
              >
                <Ionicons name="trash" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add Site Modal */}
      <Modal
        visible={showSiteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSiteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Site</Text>
              <TouchableOpacity onPress={() => setShowSiteModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Site Name (e.g., Novotel Brisbane)"
                value={siteName}
                onChangeText={setSiteName}
              />
              
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full address (e.g., 200 Creek St, Brisbane QLD)"
                value={siteAddress}
                onChangeText={setSiteAddress}
                multiline
              />
              
              {/* Auto-lookup button */}
              <TouchableOpacity
                style={[styles.lookupButton, lookingUpAddress && styles.buttonDisabled]}
                onPress={lookupAddressCoordinates}
                disabled={lookingUpAddress}
              >
                {lookingUpAddress ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="location" size={20} color={colors.white} />
                    <Text style={styles.lookupButtonText}>Find GPS Coordinates</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateInput}>
                  <Text style={styles.inputLabel}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-27.4698"
                    value={siteGpsLat}
                    onChangeText={setSiteGpsLat}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.coordinateInput}>
                  <Text style={styles.inputLabel}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="153.0251"
                    value={siteGpsLong}
                    onChangeText={setSiteGpsLong}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <Text style={styles.helperText}>
                💡 Tip: Enter the address and tap "Find GPS Coordinates" to auto-fill
              </Text>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreateSite}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Site</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</Text>
              <TouchableOpacity onPress={() => {
                setShowUserModal(false);
                resetUserForm();
              }}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone (e.g., 0457 802 302)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Job Title (e.g., Room Attendant)"
                value={jobTitle}
                onChangeText={setJobTitle}
              />
              {!isEditMode && (
                <TextInput
                  style={styles.input}
                  placeholder="4-digit PIN"
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={4}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assign Site</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedSiteId}
                    onValueChange={(value) => setSelectedSiteId(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a site..." value="" />
                    {sites.map((site) => (
                      <Picker.Item 
                        key={site.id} 
                        label={site.name} 
                        value={site.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(value) => setRole(value)}
                    style={styles.picker}
                  >
                    {['employee', 'supervisor', 'admin'].map((r) => (
                      <Picker.Item 
                        key={r} 
                        label={r.charAt(0).toUpperCase() + r.slice(1)} 
                        value={r} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Award Level (Pay Rate)</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={awardLevel}
                    onValueChange={(value) => setAwardLevel(value)}
                    style={styles.picker}
                  >
                    {[1, 2, 3, 4].map((level) => (
                      <Picker.Item 
                        key={level} 
                        label={`Level ${level}`} 
                        value={level} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <TouchableOpacity
                style={styles.contractorToggle}
                onPress={() => setIsContractor(!isContractor)}
              >
                <Ionicons
                  name={isContractor ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isContractor ? colors.primary : colors.gray[400]}
                />
                <Text style={styles.contractorLabel}>ABN Contractor (Independent)</Text>
              </TouchableOpacity>

              {isContractor && (
                <TextInput
                  style={styles.input}
                  placeholder="ABN (e.g., 51 824 753 556)"
                  value={abn}
                  onChangeText={setAbn}
                />
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={isEditMode ? handleUpdateEmployee : handleCreateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Pay Rate Modal */}
      <Modal
        visible={showPayRateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPayRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Pay Rates</Text>
              <TouchableOpacity onPress={() => setShowPayRateModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Award Level</Text>
              <View style={styles.roleOptions}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.roleOption,
                      selectedLevel === level && styles.roleOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedLevel(level);
                      loadPayRate(level);
                    }}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedLevel === level && styles.roleOptionTextSelected,
                      ]}
                    >
                      Level {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Weekday Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="23.23"
                value={weekdayRate}
                onChangeText={setWeekdayRate}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Saturday Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="29.04"
                value={saturdayRate}
                onChangeText={setSaturdayRate}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Sunday Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="34.85"
                value={sundayRate}
                onChangeText={setSundayRate}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Public Holiday Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="46.46"
                value={publicHolidayRate}
                onChangeText={setPublicHolidayRate}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Overtime Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="34.85"
                value={overtimeRate}
                onChangeText={setOvertimeRate}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleEditPayRate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Update Pay Rate</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <PermissionsModal
        visible={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        onSave={handleSavePermissions}
        permissions={userPermissions}
        setPermissions={setUserPermissions}
        employee={selectedUserForPermissions}
        loading={loading}
        togglePermission={togglePermission}
      />

      <AvailabilitySnapshot
        visible={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
      />

      <ReportsCenter
        visible={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />

      {/* Bank Details Modal */}
      <Modal
        visible={showBankDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBankDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Employee Bank Details</Text>
              <TouchableOpacity onPress={() => setShowBankDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Bank details for payroll processing. Keep this information confidential.
                </Text>
              </View>

              {users.filter((u) => u.role === 'employee' || u.role === 'supervisor').length === 0 ? (
                <View style={styles.emptyBankState}>
                  <Ionicons name="people" size={64} color={colors.gray[300]} />
                  <Text style={styles.emptyBankText}>No employees found</Text>
                </View>
              ) : (
                users
                  .filter((u) => u.role === 'employee' || u.role === 'supervisor')
                  .map((employee) => (
                    <View key={employee.id} style={styles.bankCard}>
                      <View style={styles.bankCardHeader}>
                        <Ionicons name="person-circle" size={32} color={colors.primary} />
                        <View style={styles.bankCardInfo}>
                          <Text style={styles.bankCardName}>
                            {employee.first_name} {employee.last_name}
                          </Text>
                          <Text style={styles.bankCardSubtitle}>
                            {employee.job_title} • Level {employee.award_level || 1}
                          </Text>
                        </View>
                      </View>

                      {employee.bank_details ? (
                        <View style={styles.bankDetailsContent}>
                          <View style={styles.bankDetailRow}>
                            <Ionicons name="business" size={18} color={colors.text.secondary} />
                            <Text style={styles.bankDetailLabel}>Bank:</Text>
                            <Text style={styles.bankDetailValue}>
                              {employee.bank_details.bank_name || 'Not provided'}
                            </Text>
                          </View>

                          <View style={styles.bankDetailRow}>
                            <Ionicons name="person" size={18} color={colors.text.secondary} />
                            <Text style={styles.bankDetailLabel}>Account Name:</Text>
                            <Text style={styles.bankDetailValue}>
                              {employee.bank_details.account_name || 'Not provided'}
                            </Text>
                          </View>

                          <View style={styles.bankDetailRow}>
                            <Ionicons name="card" size={18} color={colors.text.secondary} />
                            <Text style={styles.bankDetailLabel}>BSB:</Text>
                            <Text style={styles.bankDetailValue}>
                              {employee.bank_details.bsb || 'Not provided'}
                            </Text>
                          </View>

                          <View style={styles.bankDetailRow}>
                            <Ionicons name="keypad" size={18} color={colors.text.secondary} />
                            <Text style={styles.bankDetailLabel}>Account Number:</Text>
                            <Text style={[styles.bankDetailValue, { fontFamily: 'monospace' }]}>
                              {employee.bank_details.account_number || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.noBankDetails}>
                          <Ionicons name="alert-circle" size={20} color={colors.warning} />
                          <Text style={styles.noBankDetailsText}>
                            No bank details provided
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => Alert.alert('Export', 'CSV export coming soon!')}
              >
                <Ionicons name="download" size={20} color={colors.white} />
                <Text style={styles.exportButtonText}>Export to CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invitation Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite New Employee</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={28} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={inviteFirstName}
                onChangeText={setInviteFirstName}
              />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={inviteLastName}
                onChangeText={setInviteLastName}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="employee@example.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="04XX XXX XXX"
                value={invitePhone}
                onChangeText={setInvitePhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Job Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Room Attendant"
                value={inviteJobTitle}
                onChangeText={setInviteJobTitle}
              />

              <Text style={styles.inputLabel}>Assign to Site *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={inviteSiteId}
                  onValueChange={(value) => {
                    console.log('Site selected:', value);
                    setInviteSiteId(value);
                  }}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="-- Tap to Select Site --" value="" />
                  {sites.map((site) => (
                    <Picker.Item key={site.id} label={site.name} value={site.id} />
                  ))}
                </Picker>
              </View>
              {inviteSiteId ? (
                <Text style={styles.selectedSiteText}>✓ Selected: {sites.find(s => s.id === inviteSiteId)?.name}</Text>
              ) : null}

              <Text style={styles.helperText}>
                * All fields are required. An invitation link will be generated that you can share with the employee.
              </Text>

              {inviteLink ? (
                <View style={styles.linkContainer}>
                  <Text style={styles.linkLabel}>📧 Invitation Link:</Text>
                  <Text style={styles.linkText} selectable={true}>{inviteLink}</Text>
                  <Text style={styles.linkHelper}>
                    Copy this link and share it with the employee via email, SMS, or any messaging app.
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteLink('');
                }}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCreateInvitation}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Generate Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  quickActionsSection: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    padding: 20,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cleanupSection: {
    backgroundColor: colors.white,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cleanupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  cleanupButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityButtonContent: {
    flex: 1,
  },
  availabilityButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  availabilityButtonSubtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    marginLeft: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
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
    maxHeight: '80%',
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
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleOptionText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  lookupButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  lookupButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
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
    textAlign: 'center',
  },
  earningsRow: {
    marginTop: 6,
  },
  earningsText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  employeeList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  employeeItemSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  employeeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  employeeRole: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  abnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  abnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  contractorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  contractorLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
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
    minHeight: 50,
  },
  picker: {
    height: 50,
    color: colors.text.primary,
    width: '100%',
  },
  selectedSiteText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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
  bankCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  bankCardInfo: {
    flex: 1,
  },
  bankCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  bankCardSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  bankDetailsContent: {
    gap: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 120,
  },
  bankDetailValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  noBankDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
  },
  noBankDetailsText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  emptyBankState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyBankText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  linkContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 13,
    color: colors.primary,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  linkHelper: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 18,
  },
});
