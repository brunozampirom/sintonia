import { HapticsBridge } from '@/components/haptics-bridge';
import { SettingsProvider } from '@/contexts/settings-context';
import '@/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SettingsProvider>
          <HapticsBridge />
          <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="game-setup" />
            <Stack.Screen name="game" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="tutorial" />
            <Stack.Screen name="history" />
            <Stack.Screen name="landing" />
          </Stack>
          <StatusBar style="light" />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
