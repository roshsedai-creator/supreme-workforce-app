import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3e']}
        style={styles.headerGradient}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#7B2D8E', '#9B4DB0']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.userName}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.userRole}>{user?.role || 'Admin'}</Text>
        <View style={styles.brandBadge}>
          <Image
            source={require('../../assets/supreme-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>Supreme Compliance</Text>
        </View>
      </LinearGradient>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#f5f0ff' }]}>
              <Ionicons name="person-outline" size={18} color="#7B2D8E" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.first_name} {user?.last_name}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="call-outline" size={18} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="mail-outline" size={18} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#ec4899" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {(user?.role || 'admin').charAt(0).toUpperCase() + (user?.role || 'admin').slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#f5f0ff' }]}>
              <Ionicons name="information-circle-outline" size={18} color="#7B2D8E" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>2.0.0</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="sparkles-outline" size={18} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>AI Engine</Text>
              <Text style={styles.infoValue}>GPT-4.1 Powered</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Supreme Compliance</Text>
        <Text style={styles.footerSubText}>Outsourced Housekeeping SOPs & Compliance</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#C4A265',
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 14,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footerSubText: {
    fontSize: 11,
    color: '#d1d5db',
    marginTop: 2,
  },
});
