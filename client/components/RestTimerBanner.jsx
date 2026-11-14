import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Timer, X, Plus, Minus, Bell } from 'lucide-react-native';
import { useWorkoutStore } from '../store/useWorkoutStore';

export default function RestTimerBanner() {
  const { activeTimerSeconds, addTimerTime, clearTimer } = useWorkoutStore();

  if (activeTimerSeconds === null) {
    return null;
  }

  const minutes = Math.floor(activeTimerSeconds / 60);
  const seconds = activeTimerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isFinished = activeTimerSeconds === 0;

  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.banner, isFinished && styles.bannerFinished]}>
        {/* Left icon & time */}
        <View style={styles.timeGroup}>
          <View style={[styles.iconBadge, isFinished && styles.iconBadgeFinished]}>
            {isFinished ? (
              <Bell size={16} color="#10B981" />
            ) : (
              <Timer size={16} color="#38BDF8" />
            )}
          </View>
          <View>
            <Text style={styles.statusLabel}>
              {isFinished ? 'REST COMPLETE!' : 'REST TIMER'}
            </Text>
            <Text
              style={[
                styles.timerDigits,
                isFinished && styles.timerDigitsFinished,
              ]}
            >
              {formattedTime}
            </Text>
          </View>
        </View>

        {/* Quick adjustments */}
        {!isFinished ? (
          <View style={styles.controlsGroup}>
            <TouchableOpacity
              onPress={() => addTimerTime(-15)}
              style={styles.pillButton}
              activeOpacity={0.7}
            >
              <Text style={styles.pillText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addTimerTime(30)}
              style={styles.pillButton}
              activeOpacity={0.7}
            >
              <Text style={styles.pillText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearTimer}
              style={[styles.pillButton, styles.skipButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={clearTimer}
            style={[styles.pillButton, styles.dismissButton]}
            activeOpacity={0.7}
          >
            <X size={14} color="#F8FAFC" />
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 76,
    left: 16,
    right: 16,
    maxWidth: 648,
    marginHorizontal: 'auto',
    zIndex: 999,
  },
  banner: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerFinished: {
    borderColor: '#10B981',
    backgroundColor: '#0F231D',
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  iconBadgeFinished: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  timerDigits: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerDigitsFinished: {
    color: '#10B981',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillButton: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  skipButton: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#334155',
  },
  skipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    paddingHorizontal: 12,
  },
  dismissText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '800',
  },
});
