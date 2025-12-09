import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSites, createSite, createUser, getUsers } from '../../utils/api';
import { colors } from '../../constants/colors';
import axios from 'axios';

export default function AdminScreen() {
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payRates, setPayRates] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPayRateModal, setShowPayRateModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pay rate form
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [weekdayRate, setWeekdayRate] = useState('');
  const [saturdayRate, setSaturdayRate] = useState('');
  const [sundayRate, setSundayRate] = useState('');
  const [publicHolidayRate, setPublicHolidayRate] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');
  
  // Contract/Invoice form
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [contractType, setContractType] = useState('employment');
  const [invoiceStartDate, setInvoiceStartDate] = useState('');
  const [invoiceEndDate, setInvoiceEndDate] = useState('');

  // Site form
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteGpsLat, setSiteGpsLat] = useState('');
  const [siteGpsLong, setSiteGpsLong] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sitesData, usersData, payRatesData] = await Promise.all([
        getSites(),
        getUsers(),
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/pay-rates`),
      ]);
      setSites(sitesData);
      setUsers(usersData);
      setPayRates(payRatesData.data);
      
      // Fetch earnings
      fetchEarnings();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/earnings/summary`);
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
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
    } catch (error: any) {
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
        award_level: 1,
      });
      Alert.alert('Success', 'Employee created successfully!');
      setShowUserModal(false);
      resetUserForm();
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create employee');
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
  };

  const handleEditPayRate = async () => {
    if (!weekdayRate || !saturdayRate || !sundayRate || !publicHolidayRate || !overtimeRate) {
      Alert.alert('Error', 'Please fill in all rate fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/pay-rates`, {
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
    } catch (error: any) {
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

  const loadPayRate = (level: number) => {
    const rate = payRates.find((r: any) => r.award_level === level);
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
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to export payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleSendContract = async () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/contracts/send?employee_id=${selectedEmployee}&contract_type=${contractType}`
      );

      Alert.alert('Success', response.data.message);
      setShowContractModal(false);
      setSelectedEmployee('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send contract');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedEmployee || !invoiceStartDate || !invoiceEndDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/invoices/generate`, {
        employee_id: selectedEmployee,
        start_date: new Date(invoiceStartDate).toISOString(),
        end_date: new Date(invoiceEndDate).toISOString(),
      });

      const invoice = response.data.invoice;
      Alert.alert(
        'Invoice Generated',
        `Invoice #${invoice.invoice_number}\n\nHours: ${invoice.total_hours}\nSubtotal: $${invoice.subtotal}\nGST: $${invoice.gst}\nTotal: $${invoice.total}`,
        [{ text: 'OK' }]
      );

      setShowInvoiceModal(false);
      setSelectedEmployee('');
      setInvoiceStartDate('');
      setInvoiceEndDate('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
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

            {earnings.employees?.map((emp: any) => (
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

        {payRates.map((rate: any) => (
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
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payroll Export</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePayrollExport}
          >
            <Ionicons name="download" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Export CSV</Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowUserModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        {users.map((user) => (
          <View key={user.id} style={styles.card}>
            <Ionicons name="person" size={24} color={colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{user.first_name} {user.last_name}</Text>
              <Text style={styles.cardSubtitle}>{user.job_title}</Text>
              <Text style={styles.cardDetails}>{user.phone} • {user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contracts & Invoices</Text>
        </View>

        <TouchableOpacity style={styles.featureCard} onPress={() => setShowContractModal(true)}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Send Employment Contracts</Text>
            <Text style={styles.featureSubtitle}>Send contracts to employees for digital signature</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setShowInvoiceModal(true)}>
          <Ionicons name="receipt" size={32} color={colors.gold} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Generate ABN Invoices</Text>
            <Text style={styles.featureSubtitle}>Create invoices for independent contractors (ABN)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
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
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={siteAddress}
                onChangeText={setSiteAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="GPS Latitude (e.g., -27.4698)"
                value={siteGpsLat}
                onChangeText={setSiteGpsLat}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="GPS Longitude (e.g., 153.0251)"
                value={siteGpsLong}
                onChangeText={setSiteGpsLong}
                keyboardType="numeric"
              />

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
              <Text style={styles.modalTitle}>Add New Employee</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
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
              <TextInput
                style={styles.input}
                placeholder="4-digit PIN"
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={4}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Role:</Text>
                <View style={styles.roleOptions}>
                  {['employee', 'supervisor', 'admin'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleOption,
                        role === r && styles.roleOptionSelected,
                      ]}
                      onPress={() => setRole(r)}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          role === r && styles.roleOptionTextSelected,
                        ]}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Employee</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Send Contract Modal */}
      <Modal
        visible={showContractModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowContractModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Employment Contract</Text>
              <TouchableOpacity onPress={() => setShowContractModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select Employee</Text>
              <View style={styles.employeeList}>
                {users.map((user: any) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.employeeItem,
                      selectedEmployee === user.id && styles.employeeItemSelected,
                    ]}
                    onPress={() => setSelectedEmployee(user.id)}
                  >
                    <Ionicons 
                      name={selectedEmployee === user.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedEmployee === user.id ? colors.primary : colors.gray[400]} 
                    />
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{user.first_name} {user.last_name}</Text>
                      <Text style={styles.employeeRole}>{user.job_title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Contract Type</Text>
              <View style={styles.roleOptions}>
                {['employment', 'casual', 'part-time'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.roleOption,
                      contractType === type && styles.roleOptionSelected,
                    ]}
                    onPress={() => setContractType(type)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        contractType === type && styles.roleOptionTextSelected,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSendContract}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Send Contract</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate ABN Invoice</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select ABN Contractor</Text>
              <View style={styles.employeeList}>
                {users.map((user: any) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.employeeItem,
                      selectedEmployee === user.id && styles.employeeItemSelected,
                    ]}
                    onPress={() => setSelectedEmployee(user.id)}
                  >
                    <Ionicons 
                      name={selectedEmployee === user.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedEmployee === user.id ? colors.primary : colors.gray[400]} 
                    />
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{user.first_name} {user.last_name}</Text>
                      <Text style={styles.employeeRole}>{user.job_title} • ABN</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-01"
                value={invoiceStartDate}
                onChangeText={setInvoiceStartDate}
              />

              <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-14"
                value={invoiceEndDate}
                onChangeText={setInvoiceEndDate}
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleGenerateInvoice}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Generate Invoice</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
});
