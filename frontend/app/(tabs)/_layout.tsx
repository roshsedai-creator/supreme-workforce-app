import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';

// Premium Tab Bar Icon Component
const TabIcon = ({ name, color, focused }: { name: string; color: string; focused: boolean }) => {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View style={styles.activeIndicator}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeGradient}
          />
        </View>
      )}
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons 
          name={focused ? name : `${name}-outline` as any} 
          size={22} 
          color={focused ? '#6366f1' : '#9ca3af'} 
        />
      </View>
    </View>
  );
};

export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  // Check permissions ONLY - no role fallbacks
  const permissions = user?.permissions || {};
  const canAccessSupervisor = permissions.view_all_timesheets === true || permissions.edit_timesheets === true || permissions.approve_timesheets === true;
  const canAccessAdmin = permissions.manage_users === true || permissions.manage_sites === true;

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
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
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
          letterSpacing: 0.3,
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timesheets"
        options={{
          title: 'Timesheets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="time" color={color} focused={focused} />
          ),
        }}
      />
      {canAccessSupervisor && (
        <Tabs.Screen
          name="supervisor"
          options={{
            title: 'Approve',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="checkmark-circle" color={color} focused={focused} />
            ),
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="shield" color={color} focused={focused} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  activeGradient: {
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: '#eef2ff',
  },
});
