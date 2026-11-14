import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAppModeStore } from '../store/useAppModeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSplitStore } from '../store/useSplitStore';
import RestTimerBanner from '../components/RestTimerBanner';

// Polyfill Alert.alert for React Native Web where it is otherwise a no-op
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length === 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(text);
      }
      return;
    }

    if (buttons.length === 1) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(text);
      }
      buttons[0]?.onPress?.();
      return;
    }

    const cancelButton = buttons.find((b) => b.style === 'cancel');
    const confirmButton = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(text);
      if (ok) {
        confirmButton?.onPress?.();
      } else {
        cancelButton?.onPress?.();
      }
    } else {
      confirmButton?.onPress?.();
    }
  };
}

export default function RootLayout() {
  const loadSavedMode = useAppModeStore((s) => s.loadSavedMode);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadAuthSession = useAuthStore((s) => s.loadAuthSession);
  const loadSplits = useSplitStore((s) => s.loadSplits);

  useEffect(() => {
    loadSavedMode();
    loadSettings();
    loadAuthSession();
    loadSplits();
  }, []);

  return (
    <View style={styles.outerContainer}>
      <ExpoStatusBar style="light" backgroundColor="#0B0F17" />
      <View style={styles.responsiveContainer}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B0F17' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        </Stack>

        {/* Global floating rest timer banner */}
        <RestTimerBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05080E',
    alignItems: 'center',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#0B0F17',
    position: 'relative',
    height: '100%',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
    }),
  },
});
