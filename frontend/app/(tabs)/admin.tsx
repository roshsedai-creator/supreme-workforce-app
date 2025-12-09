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

export default function AdminScreen() {
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sitesData, usersData] = await Promise.all([
        getSites(),
        getUsers(),
      ]);
      setSites(sitesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  return (
    <ScrollView style={styles.container}>
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
});
