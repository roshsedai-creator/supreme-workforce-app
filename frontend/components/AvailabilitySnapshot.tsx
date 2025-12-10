import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { colors } from '../constants/colors';

interface AvailabilitySnapshotProps {
  visible: boolean;
  onClose: () => void;
}

interface EmployeeAvailability {
  employee_id: string;
  employee_name: string;
  site_name: string;
  job_title: string;
  availability: {
    day: number;
    available: boolean;
    start_time: string;
    end_time: string;
  }[];
}

export default function AvailabilitySnapshot({ visible, onClose }: AvailabilitySnapshotProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<EmployeeAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('all');

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const daysFull = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, selectedSite]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [employeesRes, sitesRes] = await Promise.all([
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users?role=employee`),
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`),
      ]);

      setEmployees(employeesRes.data);
      setSites(sitesRes.data);

      let filteredEmployees = employeesRes.data;
      if (selectedSite !== 'all') {
        filteredEmployees = employeesRes.data.filter(
          (emp: any) => emp.site_id === selectedSite
        );
      }

      const availabilityPromises = filteredEmployees.map(async (emp: any) => {
        try {
          const availRes = await axios.get(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/${emp.id}`
          );

          const site = sitesRes.data.find((s: any) => s.id === emp.site_id);

          const availArray = daysOfWeek.map((_, index) => {
            const dayAvail = availRes.data.find((a: any) => a.day_of_week === index);
            return {
              day: index,
              available: dayAvail?.available ?? (index < 5), // Default Mon-Fri
              start_time: dayAvail?.start_time || '09:00',
              end_time: dayAvail?.end_time || '17:00',
            };
          });

          return {
            employee_id: emp.id,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            site_name: site?.name || 'No Site',
            job_title: emp.job_title || 'Staff',
            availability: availArray,
          };
        } catch (error) {
          const site = sitesRes.data.find((s: any) => s.id === emp.site_id);
          return {
            employee_id: emp.id,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            site_name: site?.name || 'No Site',
            job_title: emp.job_title || 'Staff',
            availability: daysOfWeek.map((_, index) => ({
              day: index,
              available: index < 5,
              start_time: '09:00',
              end_time: '17:00',
            })),
          };
        }
      });

      const availData = await Promise.all(availabilityPromises);
      setAvailabilityData(availData);
    } catch (error) {
      console.error('Failed to load availability snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <View>
              <Text style={styles.modalTitle}>Employee Availability</Text>
              <Text style={styles.modalSubtitle}>Weekly availability snapshot</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Site:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedSite}
                onValueChange={(value) => setSelectedSite(value)}
                style={styles.picker}
              >
                <Picker.Item label="All Sites" value="all" />
                {sites.map((site: any) => (
                  <Picker.Item key={site.id} label={site.name} value={site.id} />
                ))}
              </Picker>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading availability...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalBody} horizontal>
              <View>
                {/* Header Row */}
                <View style={styles.tableRow}>
                  <View style={styles.employeeCell}>
                    <Text style={styles.headerText}>Employee</Text>
                  </View>
                  {daysFull.map((day, index) => (
                    <View key={index} style={styles.dayCell}>
                      <Text style={styles.dayHeaderText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Employee Rows */}
                {availabilityData.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={colors.gray[300]} />
                    <Text style={styles.emptyText}>No employees found</Text>
                    <Text style={styles.emptySubtext}>
                      {selectedSite !== 'all'
                        ? 'Try selecting a different site'
                        : 'Add employees to see their availability'}
                    </Text>
                  </View>
                ) : (
                  availabilityData.map((emp) => (
                    <View key={emp.employee_id} style={styles.tableRow}>
                      <View style={styles.employeeCell}>
                        <Text style={styles.employeeName}>{emp.employee_name}</Text>
                        <Text style={styles.employeeDetails}>
                          {emp.job_title}
                        </Text>
                        <Text style={styles.employeeDetails}>
                          {emp.site_name}
                        </Text>
                      </View>

                      {emp.availability.map((avail, dayIndex) => (
                        <View key={dayIndex} style={styles.dayCell}>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: avail.available
                                  ? colors.success
                                  : colors.error + '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: avail.available ? colors.white : colors.error },
                              ]}
                            >
                              {avail.available ? '✓' : '✗'}
                            </Text>
                          </View>
                          {avail.available && (
                            <Text style={styles.timeText}>
                              {avail.start_time}
                            </Text>
                          )}
                          {avail.available && (
                            <Text style={styles.timeText}>
                              {avail.end_time}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))
                )}

                {/* Legend */}
                <View style={styles.legend}>
                  <Text style={styles.legendTitle}>Legend:</Text>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.legendBadgeText}>✓</Text>
                      </View>
                      <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBadge, { backgroundColor: colors.error + '20' }]}>
                        <Text style={[styles.legendBadgeText, { color: colors.error }]}>✗</Text>
                      </View>
                      <Text style={styles.legendText}>Not Available</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  filterSection: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterLabel: {
    fontSize: 14,
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
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
    backgroundColor: colors.white,
  },
  employeeCell: {
    width: 180,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  employeeDetails: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dayCell: {
    width: 90,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  legend: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 32,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  legendText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
});
