import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const permissions = user?.permissions || {};
  const userRole = user?.role?.toLowerCase() || '';
  
  const canAccessSupervisor = permissions.view_all_timesheets === true || 
    permissions.edit_timesheets === true || 
    permissions.approve_timesheets === true ||
    userRole === 'supervisor' ||
    userRole === 'manager' ||
    userRole === 'admin';
  
  const canAccessAdmin = permissions.manage_users === true || 
    permissions.manage_sites === true ||
    userRole === 'admin' ||
    userRole === 'manager';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: '#6366f1',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerTitleAlign: 'center',
      }}
    >
      {/* Hidden screens */}
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="roster" options={{ href: null }} />
      <Tabs.Screen name="payroll" options={{ href: null }} />
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarLabel: 'Timesheets',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      
      {canAccessSupervisor && (
        <Tabs.Screen
          name="supervisor"
          options={{
            title: 'Approve',
            tabBarLabel: 'Approve',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
      )}
      
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: '#eef2ff',
  },
});
