import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform, View } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';
import InstallPrompt from '../components/InstallPrompt';

LogBox.ignoreLogs([
  'textShadow* style props are deprecated',
  'shadow* style props are deprecated',
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
]);

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#f8f7f4' }}>
        <StatusBar style={Platform.OS === 'web' ? 'dark' : 'auto'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {Platform.OS === 'web' && <InstallPrompt />}
      </View>
    </ErrorBoundary>
  );
}
