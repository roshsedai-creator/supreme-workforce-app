import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform, View } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

LogBox.ignoreLogs([
  'textShadow* style props are deprecated',
  'shadow* style props are deprecated',
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
]);

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </ErrorBoundary>
  );
}
