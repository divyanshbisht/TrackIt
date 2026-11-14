import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function Index() {
  const { isAuthenticated, isGuest, isInitialized, loadAuthSession } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      loadAuthSession();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // If already authenticated or chose guest mode, proceed to main dashboard
  if (isAuthenticated || isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, default opening screen is login/signup with OTP
  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
