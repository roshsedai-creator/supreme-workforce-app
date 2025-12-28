import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

// Super Premium Tab Icon
const TabIcon = ({ name, label, focused }: { name: string; label: string; focused: boolean }) => {
  if (focused) {
    return (
      <View style={styles.activeTab}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeGradient}
        >
          <Ionicons name={name as any} size={20} color="#fff" />
          <Text style={styles.activeLabel}>{label}</Text>
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <View style={styles.inactiveTab}>
      <Ionicons name={`${name}-outline` as any} size={22} color="#9ca3af" />
    </View>
  );
};

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
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 10,
          paddingHorizontal: 10,
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 25,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#6366f1',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="roster" options={{ href: null }} />
      <Tabs.Screen name="payroll" options={{ href: null }} />
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarIcon: ({ focused }) => <TabIcon name="time" label="Time" focused={focused} />,
        }}
      />
      {canAccessSupervisor && (
        <Tabs.Screen
          name="supervisor"
          options={{
            title: 'Approve',
            tabBarIcon: ({ focused }) => <TabIcon name="checkmark-circle" label="Approve" focused={focused} />,
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ focused }) => <TabIcon name="shield" label="Admin" focused={focused} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" label="Me" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  activeLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
