import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getTimesheets } from '../../utils/api';
import { colors } from '../../constants/colors';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const timesheets = await getTimesheets(user?.id);
      
      const totalHours = timesheets.reduce((sum: number, ts: any) => sum + ts.total_hours, 0);
      const approvedCount = timesheets.filter((ts: any) => ts.approval_status === 'approved').length;
      const pendingCount = timesheets.filter((ts: any) => ts.approval_status === 'pending').length;
      const thisMonth = timesheets.filter((ts: any) => {
        const date = new Date(ts.clock_in);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const monthHours = thisMonth.reduce((sum: number, ts: any) => sum + ts.total_hours, 0);
      
      setStats({
        totalShifts: timesheets.length,
        totalHours: totalHours.toFixed(1),
        approvedShifts: approvedCount,
        pendingShifts: pendingCount,
        monthlyHours: monthHours.toFixed(1),
        avgHoursPerShift: timesheets.length > 0 ? (totalHours / timesheets.length).toFixed(1) : '0',
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Platform-specific alert handling
    if (typeof window !== 'undefined' && Platform.OS === 'web') {
      // Use browser confirm dialog for web
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              logout();
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.role}>{user?.job_title}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role.toUpperCase()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Your Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color={colors.primary} />
                <Text style={styles.statValue}>{stats?.totalShifts}</Text>
                <Text style={styles.statLabel}>Total Shifts</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="time" size={28} color={colors.success} />
                <Text style={styles.statValue}>{stats?.totalHours}</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                <Text style={styles.statValue}>{stats?.approvedShifts}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="hourglass" size={28} color={colors.warning} />
                <Text style={styles.statValue}>{stats?.pendingShifts}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.highlightCard}>
              <View style={styles.highlightRow}>
                <Ionicons name="trending-up" size={24} color={colors.primary} />
                <View style={styles.highlightInfo}>
                  <Text style={styles.highlightLabel}>This Month</Text>
                  <Text style={styles.highlightValue}>{stats?.monthlyHours} hours</Text>
                </View>
              </View>
              
              <View style={styles.highlightRow}>
                <Ionicons name="stats-chart" size={24} color={colors.gold} />
                <View style={styles.highlightInfo}>
                  <Text style={styles.highlightLabel}>Average per Shift</Text>
                  <Text style={styles.highlightValue}>{stats?.avgHoursPerShift} hours</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Account Details</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="briefcase" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Job Title</Text>
                <Text style={styles.infoValue}>{user?.job_title}</Text>
              </View>
              
              {user?.abn && (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>ABN</Text>
                  <Text style={styles.infoValue}>{user?.abn}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏦 Bank Details</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => Alert.alert('Coming Soon', 'Bank details editing will be available soon')}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoCard}>
              {user?.bank_details ? (
                <>
                  <View style={styles.infoRow}>
                    <Ionicons name="business" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Bank Name</Text>
                    <Text style={styles.infoValue}>{user?.bank_details?.bank_name || 'Not provided'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Account Name</Text>
                    <Text style={styles.infoValue}>{user?.bank_details?.account_name || 'Not provided'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="card" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>BSB</Text>
                    <Text style={styles.infoValue}>{user?.bank_details?.bsb || 'Not provided'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="keypad" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Account Number</Text>
                    <Text style={styles.infoValue}>
                      {user?.bank_details?.account_number 
                        ? `****${user.bank_details.account_number.slice(-4)}` 
                        : 'Not provided'}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyBankDetails}>
                  <Ionicons name="information-circle" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyText}>No bank details added</Text>
                  <Text style={styles.emptySubtext}>Add your bank details to receive salary payments</Text>
                  <TouchableOpacity 
                    style={styles.addBankButton}
                    onPress={() => Alert.alert('Coming Soon', 'Bank details editing will be available soon')}
                  >
                    <Ionicons name="add-circle" size={20} color={colors.white} />
                    <Text style={styles.addBankButtonText}>Add Bank Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ App Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>Supreme Hospitality</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="code-working" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Security</Text>
                <Text style={styles.infoValue}>GPS Verified</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Quick Guide</Text>
            
            <View style={styles.helpCard}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Clock In/Out</Text>
                <Text style={styles.helpText}>Ensure GPS is enabled and you are within 100m of the site</Text>
              </View>
            </View>
            
            <View style={styles.helpCard}>
              <Ionicons name="create" size={24} color={colors.primary} />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Edit Timesheets</Text>
                <Text style={styles.helpText}>Use Edit Times on pending timesheets to correct errors</Text>
              </View>
            </View>
            
            <View style={styles.helpCard}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Attach Photos</Text>
                <Text style={styles.helpText}>Add photo evidence for manual timesheet edits</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for Supreme Hospitality</Text>
        <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  highlightCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  helpInfo: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyBankDetails: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBankButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
    opacity: 0.7,
  },
});
