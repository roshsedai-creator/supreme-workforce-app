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

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, selectedSite]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load employees and sites
      const [employeesRes, sitesRes] = await Promise.all([
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users?role=employee`),
        axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sites`),
      ]);

      setEmployees(employeesRes.data);
      setSites(sitesRes.data);

      // Filter employees by site if needed
      let filteredEmployees = employeesRes.data;
      if (selectedSite !== 'all') {
        filteredEmployees = employeesRes.data.filter(
          (emp: any) => emp.site_id === selectedSite
        );
      }

      // Load availability for each employee
      const availabilityPromises = filteredEmployees.map(async (emp: any) => {
        try {
          const availRes = await axios.get(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/${emp.id}`
          );

          // Find site name
          const site = sitesRes.data.find((s: any) => s.id === emp.site_id);

          // Convert availability to structured format
          const availArray = daysOfWeek.map((_, index) => {
            const dayAvail = availRes.data.find((a: any) => a.day_of_week === index);
            return {
              day: index,
              available: dayAvail?.available ?? false,
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
          // Return default if no availability set
          return {
            employee_id: emp.id,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            site_name: sitesRes.data.find((s: any) => s.id === emp.site_id)?.name || 'No Site',
            job_title: emp.job_title || 'Staff',
            availability: daysOfWeek.map((_, index) => ({
              day: index,
              available: index < 5, // Mon-Fri by default
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

  const getAvailabilityColor = (available: boolean) => {
    return available ? colors.success : colors.gray[300];
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

          {/* Site Filter */}
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
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Header Row */}
              <View style={styles.tableHeader}>
                <View style={styles.employeeColumn}>
                  <Text style={styles.headerText}>Employee</Text>
                </View>
                {daysOfWeek.map((day, index) => (
                  <View key={index} style={styles.dayColumn}>
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
                availabilityData.map((emp, empIndex) => (
                  <View key={emp.employee_id} style={styles.employeeRow}>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{emp.employee_name}</Text>
                      <Text style={styles.employeeDetails}>
                        {emp.job_title} • {emp.site_name}
                      </Text>
                    </View>

                    <View style={styles.availabilityGrid}>
                      {emp.availability.map((avail, dayIndex) => (
                        <View key={dayIndex} style={styles.availabilityCell}>
                          <View
                            style={[
                              styles.availabilityIndicator,
                              {
                                backgroundColor: getAvailabilityColor(avail.available),
                              },
                            ]}
                          >
                            {avail.available ? (
                              <Ionicons name="checkmark" size={14} color={colors.white} />
                            ) : (
                              <Ionicons name="close" size={14} color={colors.white} />
                            )}
                          </View>
                          {avail.available && (
                            <Text style={styles.timeText}>
                              {avail.start_time}-{avail.end_time}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}

              {/* Legend */}
              <View style={styles.legend}>
                <Text style={styles.legendTitle}>Legend:</Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.gray[300] }]} />
                    <Text style={styles.legendText}>Not Available</Text>
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
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
  },
  employeeColumn: {
    width: 150,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  employeeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  employeeInfo: {
    width: 150,
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  employeeDetails: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  availabilityGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  availabilityCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  legend: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 13,
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
