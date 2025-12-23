import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  // Check permissions ONLY - no role fallbacks
  const permissions = user?.permissions || {};
  const canViewRoster = permissions.view_roster === true || permissions.manage_roster === true;
  const canAccessSupervisor = permissions.view_all_timesheets === true || permissions.edit_timesheets === true || permissions.approve_timesheets === true || permissions.manage_roster === true;
  const canAccessAdmin = permissions.manage_users === true || permissions.manage_sites === true;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  // If not authenticated, don't render tabs (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          height: 70 + insets.bottom, // Add safe area bottom
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12, // Use safe area or default
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="leave"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: 'Roster',
          href: canViewRoster ? undefined : null, // Hide if no permission
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      {canAccessSupervisor && (
        <Tabs.Screen
          name="supervisor"
          options={{
            title: 'Supervisor',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="clipboard" size={size} color={color} />
            ),
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size}) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="payroll"
          options={{
            title: 'Pay',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
