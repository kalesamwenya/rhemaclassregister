import { Stack } from 'expo-router';
import { AppProvider, useAppContext } from '../context/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from '../components/SplashScreen';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isLoading } = useAppContext();

  useEffect(() => {
    if (!isLoading) {
      ExpoSplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="kiosk" />
        <Stack.Screen name="admin-auth" />
        <Stack.Screen name="admin" />
      </Stack>

      {isLoading && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#fff' }]}>
          <SplashScreen />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootLayoutContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
