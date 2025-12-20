import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import ErrorBoundary from '../components/ErrorBoundary';

// Ignore common warnings that don't affect functionality
LogBox.ignoreLogs([
  'textShadow* style props are deprecated',
  'shadow* style props are deprecated',
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
]);

export default function RootLayout() {
  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const errorHandler = (error: any) => {
      console.error('Unhandled error:', error);
    };

    // Add global error handling
    if (Platform.OS !== 'web') {
      // For mobile, add error handler
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('Global error:', error, 'Fatal:', isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ErrorBoundary>
  );
}
