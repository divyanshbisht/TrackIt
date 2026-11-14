import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Cloud,
  Zap,
  Clock,
  Plus,
  Minus,
  RefreshCw,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  User,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react-native';
import { useAppModeStore, APP_MODES } from '../../store/useAppModeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getLocalWorkouts } from '../../services/offlineStorage';
import { syncLocalWorkoutsToCloud, checkBackendHealth } from '../../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode } = useAppModeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    isRestTimerEnabled,
    toggleRestTimer,
    defaultRestDuration,
    setDefaultRestDuration,
    apiBaseUrl,
    setApiBaseUrl,
  } = useSettingsStore();

  const [localCount, setLocalCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverHealth, setServerHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiBaseUrl);

  const loadLocalStats = async () => {
    try {
      const items = await getLocalWorkouts();
      setLocalCount(items.length);
    } catch (e) {
      setLocalCount(0);
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    const health = await checkBackendHealth();
    setServerHealth(health);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    loadLocalStats();
    handleHealthCheck();
  }, [apiBaseUrl]);

  const handleSyncToCloud = async () => {
    if (mode === APP_MODES.OFFLINE) {
      Alert.alert(
        'Offline Mode Active',
        'Switch to Online or Smart AI mode to sync workouts to the cloud.'
      );
      return;
    }

    try {
      setIsSyncing(true);
      const items = await getLocalWorkouts();
      if (items.length === 0) {
        Alert.alert('Sync Center', 'No local workouts to sync.');
        return;
      }

      const res = await syncLocalWorkoutsToCloud(items);
      Alert.alert(
        'Sync Complete! 🚀',
        `Successfully synced ${res.syncedCount || items.length} workout(s) to MongoDB Atlas.`
      );
    } catch (err) {
      console.error('Sync Error:', err);
      Alert.alert('Sync Failed', 'Could not reach the server. Make sure the backend is running.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(customUrl);
    Alert.alert('Settings Saved', `API Base URL set to: ${customUrl.trim()}`);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Are you sure you want to log out of your account?')) {
          logout();
        }
      } else {
        logout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure operational tiers, timer durations & cloud sync
          </Text>
        </View>

        {/* ACCOUNT PROFILE */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT & PROFILE</Text>
          {isAuthenticated && user ? (
            <View style={styles.profileCard}>
              <View style={styles.profileLeft}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.avatarLetter}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={11} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified Account</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutBtn}
                activeOpacity={0.7}
              >
                <LogOut size={16} color="#EF4444" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <View style={styles.guestLeft}>
                <View style={styles.guestAvatar}>
                  <User size={20} color="#64748B" />
                </View>
                <View style={styles.guestInfo}>
                  <Text style={styles.guestTitle}>Guest Athlete</Text>
                  <Text style={styles.guestSubtitle}>
                    Sign in with OTP to save & sync across devices
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/auth')}
                style={styles.signInBtn}
                activeOpacity={0.8}
              >
                <LogIn size={15} color="#0B0F17" />
                <Text style={styles.signInBtnText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 1: OPERATIONAL TIERS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OPERATIONAL TIER</Text>

          {/* Offline Mode */}
          <TouchableOpacity
            onPress={() => setMode(APP_MODES.OFFLINE)}
            style={[
              styles.modeCard,
              mode === APP_MODES.OFFLINE && styles.modeCardActive,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.modeCardTop}>
              <View style={[styles.iconBox, { backgroundColor: '#1E293B' }]}>
                <Shield size={20} color="#94A3B8" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>📴 Offline Mode</Text>
                <Text style={styles.modeBadgeText}>Local Only • Complete Privacy</Text>
              </View>
              <View
                style={[
                  styles.radioDot,
                  mode === APP_MODES.OFFLINE && styles.radioDotActive,
                ]}
              />
            </View>
            <Text style={styles.modeDescription}>
              100% functional locally with zero network requests. Uses bundled exercise catalog and saves all logs strictly to device storage.
            </Text>
          </TouchableOpacity>

          {/* Online Mode */}
          <TouchableOpacity
            onPress={() => setMode(APP_MODES.ONLINE)}
            style={[
              styles.modeCard,
              mode === APP_MODES.ONLINE && styles.modeCardActive,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.modeCardTop}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Cloud size={20} color="#38BDF8" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>🌐 Online Mode</Text>
                <Text style={styles.modeBadgeText}>Cloud Sync • Manual Logging</Text>
              </View>
              <View
                style={[
                  styles.radioDot,
                  mode === APP_MODES.ONLINE && styles.radioDotActive,
                ]}
              />
            </View>
            <Text style={styles.modeDescription}>
              Writes to local storage first, then synchronizes workouts and PRs to MongoDB Atlas via Express. AI features remain completely disabled.
            </Text>
          </TouchableOpacity>

          {/* Smart AI Mode */}
          <TouchableOpacity
            onPress={() => setMode(APP_MODES.SMART_AI)}
            style={[
              styles.modeCard,
              mode === APP_MODES.SMART_AI && styles.modeCardActive,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.modeCardTop}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Zap size={20} color="#F59E0B" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>⚡ Smart AI Mode</Text>
                <Text style={styles.modeBadgeText}>Cloud Sync + OpenAI Parser</Text>
              </View>
              <View
                style={[
                  styles.radioDot,
                  mode === APP_MODES.SMART_AI && styles.radioDotActive,
                ]}
              />
            </View>
            <Text style={styles.modeDescription}>
              Unlocks the natural-language input bar allowing 1-line routines to be parsed into biomechanically ordered structured workout cards.
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: REST TIMER CONFIGURATION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REST TIMER DURATION</Text>
          <View style={styles.settingsRowCard}>
            <View style={styles.settingsRowLeft}>
              <Clock size={20} color="#38BDF8" />
              <View>
                <Text style={styles.settingsRowTitle}>Default Duration</Text>
                <Text style={styles.settingsRowSubtitle}>
                  Triggered after checking a completed set
                </Text>
              </View>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => setDefaultRestDuration(defaultRestDuration - 15)}
                style={styles.stepperBtn}
                activeOpacity={0.7}
              >
                <Minus size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{defaultRestDuration}s</Text>

              <TouchableOpacity
                onPress={() => setDefaultRestDuration(defaultRestDuration + 15)}
                style={styles.stepperBtn}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 3: SYNC CENTER */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYNC CENTER</Text>
          <View style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View style={styles.syncInfo}>
                <Text style={styles.syncTitle}>Local Workouts</Text>
                <Text style={styles.syncCount}>{localCount} session(s) on device</Text>
              </View>

              <TouchableOpacity
                onPress={handleSyncToCloud}
                style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#0B0F17" />
                ) : (
                  <>
                    <RefreshCw size={14} color="#0B0F17" />
                    <Text style={styles.syncBtnText}>Sync to Cloud</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 4: SERVER API CONNECTION */}
        <View style={styles.section}>
          <View style={styles.serverHeaderRow}>
            <Text style={styles.sectionLabel}>BACKEND API CONFIGURATION</Text>
            <TouchableOpacity
              onPress={handleHealthCheck}
              style={styles.healthRefreshBtn}
              activeOpacity={0.7}
            >
              {isCheckingHealth ? (
                <ActivityIndicator size="small" color="#38BDF8" />
              ) : (
                <Text style={styles.healthRefreshText}>Test Status</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.serverCard}>
            {serverHealth && (
              <View style={styles.healthBanner}>
                {serverHealth.status === 'ok' ? (
                  <View style={styles.healthRow}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text style={styles.healthOkText}>
                      API Connected • Mongo: {serverHealth.mongoConnected ? 'Online' : 'In-Memory'} • AI: {serverHealth.openaiReady ? 'OpenAI' : 'Rule Engine'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.healthRow}>
                    <AlertCircle size={16} color="#EF4444" />
                    <Text style={styles.healthErrText}>
                      Backend Offline ({serverHealth.error || 'Check server'})
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.inputLabel}>Server Base URL</Text>
            <View style={styles.apiUrlRow}>
              <TextInput
                style={styles.urlInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://localhost:5000"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={handleSaveApiUrl}
                style={styles.saveUrlBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.saveUrlText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.urlHint}>
              Use your machine's LAN IP (e.g. http://192.168.1.X:5000) when testing on physical devices via Expo Go.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modeCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  modeCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#132238',
  },
  modeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modeBadgeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#334155',
  },
  radioDotActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#38BDF8',
  },
  modeDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  settingsRowCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsRowTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsRowSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222F43',
    padding: 4,
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#151D2A',
  },
  stepperValue: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  syncCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncInfo: {
    flex: 1,
  },
  syncTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  syncCount: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '800',
  },
  serverHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthRefreshBtn: {
    padding: 4,
  },
  healthRefreshText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  serverCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
  },
  healthBanner: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    marginBottom: 12,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthOkText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  healthErrText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  apiUrlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  saveUrlBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  saveUrlText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  urlHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  profileCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestInfo: {
    flex: 1,
  },
  guestTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  guestSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  signInBtnText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '800',
  },
});
