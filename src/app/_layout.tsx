import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Platform, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

function MainApp() {
  const { isDarkMode, appLockEnabled } = useSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Start assuming we might need to auth

  useEffect(() => {
    // We only want to authenticate on mount if appLock is enabled
    // Settings context might take a split second to load, but initially appLockEnabled is false.
    // To handle initial load better, we trigger auth if appLockEnabled changes to true, or on mount.
    if (appLockEnabled) {
      authenticate();
    } else {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
    }
  }, [appLockEnabled]);

  const authenticate = async () => {
    setIsAuthenticating(true);
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SmartReceipt',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        setIsAuthenticated(true);
      }
    } else {
      // If biometrics are not set up, just let them in.
      setIsAuthenticated(true);
    }
    setIsAuthenticating(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        {isAuthenticating ? (
          <ActivityIndicator size="large" color="#4F46E5" />
        ) : (
          <TouchableOpacity 
            onPress={authenticate}
            style={{ alignItems: 'center', padding: 20 }}
          >
            <Ionicons name="lock-closed" size={64} color="#4F46E5" />
            <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
              App Locked
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Tap to unlock with Face ID / Fingerprint
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        const Purchases = require('react-native-purchases').default;
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: "goog_tINyAMSPVhZawfgWcsAqLzikzDj" });
      } catch (e) {
        // Ignore purchase errors
      }
    }
  }, []);

  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}
