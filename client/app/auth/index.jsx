import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Dumbbell,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthScreen() {
  const router = useRouter();
  const {
    login,
    sendSignupOTP,
    verifyOTPAndSignup,
    isLoading,
    error,
    clearError,
    isAuthenticated,
  } = useAuthStore();

  // Tab: 'login' or 'signup'
  const [tab, setTab] = useState('login');

  // Step for signup: 'form' or 'otp'
  const [signupStep, setSignupStep] = useState('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6-digit OTP state
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (signupStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signupStep, resendTimer]);

  useEffect(() => {
    clearError();
  }, [tab, signupStep]);

  // Handle Login
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    try {
      await login(email, password);
      Alert.alert('Welcome Back! 💪', 'Logged in successfully.');
      router.replace('/(tabs)');
    } catch (err) {
      // Error handled by store
    }
  };

  // Handle Send OTP
  const handleSendOTP = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Valid Email Required', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Password Length', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await sendSignupOTP(email);
      setDevOtpHint(res.devOtp || '');
      setSignupStep('otp');
      setResendTimer(60);
    } catch (err) {
      // Error handled by store
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await sendSignupOTP(email);
      setDevOtpHint(res.devOtp || '');
      setResendTimer(60);
      Alert.alert('New Code Sent', 'A new 6-digit verification code has been generated.');
    } catch (err) {
      // Error handled by store
    }
  };

  // Handle Verify OTP & Complete Signup
  const handleVerifySignup = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      await verifyOTPAndSignup({
        name,
        email,
        password,
        otp: otpCode,
      });
      Alert.alert('Account Verified! 🎉', 'Your account has been created and verified.');
      router.replace('/(tabs)');
    } catch (err) {
      // Error handled by store
    }
  };

  // Skip / Continue as Guest
  const handleContinueAsGuest = () => {
    useAuthStore.getState().continueAsGuest();
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      handleContinueAsGuest();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back / Skip Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#94A3B8" />
          <Text style={styles.backBtnText}>
            {router.canGoBack() ? 'Back' : 'Continue as Guest'}
          </Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoCircle}>
            <Dumbbell size={28} color="#38BDF8" />
          </View>
          <Text style={styles.brandTitle}>TrackIt</Text>
          <Text style={styles.brandSubtitle}>
            {tab === 'login'
              ? 'Sign in to access your synchronized cloud workouts'
              : signupStep === 'otp'
              ? 'Verify your email to activate your account'
              : 'Create an account with instant OTP verification'}
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Segmented Tab Switcher (Only if not in OTP step) */}
        {signupStep !== 'otp' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setTab('login')}
              style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTab('signup');
                setSignupStep('form');
              }}
              style={[styles.tabButton, tab === 'signup' && styles.tabButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- SIGN IN FORM --- */}
        {tab === 'login' && signupStep !== 'otp' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="athlete@trackit.dev"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0B0F17" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In to TrackIt</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={handleContinueAsGuest}
              style={styles.guestBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.guestBtnText}>Continue as Guest (Offline Mode)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- SIGNUP STEP 1: CREDENTIALS --- */}
        {tab === 'signup' && signupStep === 'form' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Alex Lift"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="athlete@trackit.dev"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSendOTP}
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0B0F17" />
              ) : (
                <View style={styles.btnRow}>
                  <KeyRound size={18} color="#0B0F17" />
                  <Text style={styles.primaryBtnText}>Send 6-Digit OTP</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinueAsGuest}
              style={styles.guestBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.guestBtnText}>Skip and Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- SIGNUP STEP 2: OTP VERIFICATION --- */}
        {tab === 'signup' && signupStep === 'otp' && (
          <View style={styles.formCard}>
            <View style={styles.otpHeader}>
              <View style={styles.shieldGlow}>
                <ShieldCheck size={32} color="#10B981" />
              </View>
              <Text style={styles.otpTitle}>Enter Verification Code</Text>
              <Text style={styles.otpSubtitle}>
                A 6-digit code was dispatched to:
              </Text>
              <Text style={styles.otpTargetEmail}>{email}</Text>
            </View>

            {/* Dev OTP Helper Badge */}
            {devOtpHint ? (
              <TouchableOpacity
                onPress={() => setOtpCode(devOtpHint)}
                style={styles.devOtpBadge}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.devOtpText}>
                  Dev Mode Code: <Text style={styles.devOtpDigits}>{devOtpHint}</Text> (Tap to auto-fill)
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* OTP Input Boxes Display */}
            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.hiddenOtpInput}
                value={otpCode}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpCode(numeric);
                }}
                keyboardType="numeric"
                maxLength={6}
                autoFocus={true}
              />
              <View style={styles.digitBoxesRow}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otpCode[index] || '';
                  const isCurrent = otpCode.length === index;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.digitBox,
                        digit ? styles.digitBoxFilled : null,
                        isCurrent ? styles.digitBoxActive : null,
                      ]}
                    >
                      <Text style={styles.digitText}>{digit}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifySignup}
              style={[
                styles.verifyBtn,
                (isLoading || otpCode.length !== 6) && styles.btnDisabled,
              ]}
              disabled={isLoading || otpCode.length !== 6}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0B0F17" />
              ) : (
                <View style={styles.btnRow}>
                  <CheckCircle2 size={18} color="#0B0F17" />
                  <Text style={styles.verifyBtnText}>Verify & Complete Signup</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Resend & Back Row */}
            <View style={styles.otpActionsRow}>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendTimer > 0}
                style={styles.resendBtn}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color={resendTimer > 0 ? '#64748B' : '#38BDF8'} />
                <Text
                  style={[
                    styles.resendText,
                    resendTimer > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSignupStep('form')}
                style={styles.editDetailsBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.editDetailsText}>Edit Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#151D2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222F43',
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#38BDF8',
  },
  formCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 16,
    padding: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#0B0F17',
    fontSize: 15,
    fontWeight: '800',
  },
  verifyBtnText: {
    color: '#0B0F17',
    fontSize: 15,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222F43',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  guestBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222F43',
    backgroundColor: '#0B0F17',
  },
  guestBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  otpTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  otpSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  otpTargetEmail: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  devOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'center',
    gap: 6,
    marginBottom: 16,
  },
  devOtpText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  devOtpDigits: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  otpInputContainer: {
    position: 'relative',
    marginVertical: 10,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0.01,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  digitBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  digitBox: {
    flex: 1,
    height: 52,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: '#10B981',
  },
  digitBoxFilled: {
    borderColor: '#38BDF8',
    backgroundColor: '#111E2E',
  },
  digitText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 47, 67, 0.5)',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#64748B',
  },
  editDetailsBtn: {
    padding: 4,
  },
  editDetailsText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
