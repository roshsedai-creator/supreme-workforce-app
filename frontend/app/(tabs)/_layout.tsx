import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

// Custom Tab Bar Icon with Label
const TabBarIcon = ({ name, label, focused }: { name: string; label: string; focused: boolean }) => {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Ionicons 
          name={focused ? name as any : `${name}-outline` as any} 
          size={22} 
          color={focused ? '#ffffff' : '#64748b'} 
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
};

export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const permissions = user?.permissions || {};
  const userRole = user?.role?.toLowerCase() || '';
  
  // Supervisor access: check permissions OR role
  const canAccessSupervisor = permissions.view_all_timesheets === true || 
    permissions.edit_timesheets === true || 
    permissions.approve_timesheets === true ||
    userRole === 'supervisor' ||
    userRole === 'manager' ||
    userRole === 'admin';
  
  // Admin access: check permissions OR role (admin or manager)
  const canAccessAdmin = permissions.manage_users === true || 
    permissions.manage_sites === true ||
    userRole === 'admin' ||
    userRole === 'manager';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 80 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 12,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#6366f1',
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
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
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="time" label="Timesheets" focused={focused} />
          ),
        }}
      />
      {canAccessSupervisor && (
        <Tabs.Screen
          name="supervisor"
          options={{
            title: 'Approve',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="checkmark-circle" label="Approve" focused={focused} />
            ),
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="shield" label="Admin" focused={focused} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#6366f1',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#6366f1',
  },
});
