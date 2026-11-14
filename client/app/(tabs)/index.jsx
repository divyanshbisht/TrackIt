import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Plus,
  Flame,
  ChevronRight,
  Shield,
  Cloud,
  Zap,
  Clock,
  Dumbbell,
  Pencil,
  RotateCcw,
  History,
  Calendar,
  Sliders,
} from 'lucide-react-native';
import { useAppModeStore, APP_MODES } from '../../store/useAppModeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useSplitStore } from '../../store/useSplitStore';
import {
  fetchPersonalRecords,
  fetchWorkoutHistory,
  deleteWorkoutSession,
  fetchPreviousPerformance,
} from '../../services/api';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';
import CustomizeSplitModal from '../../components/CustomizeSplitModal';
import ManageSplitsModal from '../../components/ManageSplitsModal';

export default function HomeScreen() {
  const router = useRouter();
  const { mode } = useAppModeStore();
  const { isRestTimerEnabled, toggleRestTimer, defaultRestDuration } = useSettingsStore();
  const {
    activeSplit,
    setActiveSplit,
    loadSplitRoutine,
    loadPastWorkoutAsActive,
  } = useWorkoutStore();
  const { splits, loadSplits, saveSplitTemplate } = useSplitStore();

  const [prs, setPrs] = useState([]);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isStartingSplit, setIsStartingSplit] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isManageSplitsOpen, setIsManageSplitsOpen] = useState(false);

  // Load all PRs and past workouts
  const loadData = useCallback(async () => {
    try {
      const [records, pastSessions] = await Promise.all([
        fetchPersonalRecords(mode).catch(() => []),
        fetchWorkoutHistory(mode).catch(() => []),
      ]);
      setPrs(records || []);
      setHistory(pastSessions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [mode]);

  useEffect(() => {
    loadSplits();
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Determine active split object
  const splitKeys = Object.keys(splits);
  const currentSplitKey =
    splitKeys.find(
      (k) =>
        k.toLowerCase() === (activeSplit || '').toLowerCase() ||
        k.toLowerCase().startsWith((activeSplit || '').toLowerCase().replace(/ day$/, ''))
    ) || splitKeys[0] || 'Push Day';

  const currentSplit = splits[currentSplitKey] || {
    name: currentSplitKey,
    description: 'Custom Routine',
    exercises: [],
  };

  // 1-Click Launch a Split Routine
  const handleStartSplitRoutine = async (splitKey) => {
    const targetSplit = splits[splitKey] || currentSplit;
    setIsStartingSplit(true);

    try {
      // Parallel fetch ghost previous performance for each exercise in this split
      const ghostMap = {};
      await Promise.all(
        (targetSplit.exercises || []).map(async (ex) => {
          try {
            const prevSets = await fetchPreviousPerformance(ex.exerciseId, mode);
            ghostMap[ex.exerciseId] = prevSets;
          } catch (e) {
            ghostMap[ex.exerciseId] = [];
          }
        })
      );

      loadSplitRoutine(targetSplit.name, targetSplit.exercises, ghostMap);
      router.push('/(tabs)/workout');
    } catch (err) {
      console.error('Failed to start split routine:', err);
      router.push('/(tabs)/workout');
    } finally {
      setIsStartingSplit(false);
    }
  };

  // Start an empty session with the active split name
  const handleStartEmptyWorkout = () => {
    setActiveSplit(currentSplitKey);
    router.push('/(tabs)/workout');
  };

  // 1-Click Repeat a Past Workout from History
  const handleRepeatWorkout = async (pastWorkout) => {
    try {
      const ghostMap = {};
      await Promise.all(
        (pastWorkout.exercises || []).map(async (ex) => {
          try {
            const prevSets = await fetchPreviousPerformance(ex.exerciseId, mode);
            ghostMap[ex.exerciseId] = prevSets;
          } catch (e) {
            ghostMap[ex.exerciseId] = [];
          }
        })
      );
      loadPastWorkoutAsActive(pastWorkout, ghostMap);
      router.push('/(tabs)/workout');
    } catch (err) {
      loadPastWorkoutAsActive(pastWorkout, {});
      router.push('/(tabs)/workout');
    }
  };

  // Delete a Workout Session from History
  const handleDeleteWorkout = async (workoutId) => {
    try {
      await deleteWorkoutSession(workoutId, mode);
      setHistory((prev) => prev.filter((w) => (w._id || w.id) !== workoutId));
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  const renderModeBadge = () => {
    switch (mode) {
      case APP_MODES.OFFLINE:
        return (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.modePill, styles.modeOffline]}
            activeOpacity={0.7}
          >
            <Shield size={12} color="#94A3B8" />
            <Text style={styles.modeOfflineText}>OFFLINE</Text>
          </TouchableOpacity>
        );
      case APP_MODES.ONLINE:
        return (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.modePill, styles.modeOnline]}
            activeOpacity={0.7}
          >
            <Cloud size={12} color="#38BDF8" />
            <Text style={styles.modeOnlineText}>ONLINE</Text>
          </TouchableOpacity>
        );
      case APP_MODES.SMART_AI:
      default:
        return (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.modePill, styles.modeAI]}
            activeOpacity={0.7}
          >
            <Zap size={12} color="#F59E0B" />
            <Text style={styles.modeAIText}>SMART AI</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>TrackIt</Text>
            <View style={styles.activeSplitBadge}>
              <Text style={styles.activeSplitText}>{currentSplitKey}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {renderModeBadge()}
          </View>
        </View>

        {/* Split Switcher Horizontal List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY SPLITS & ROUTINES</Text>
          <TouchableOpacity
            onPress={() => setIsManageSplitsOpen(true)}
            style={styles.manageSplitsBtn}
            activeOpacity={0.7}
          >
            <Sliders size={13} color="#38BDF8" />
            <Text style={styles.manageSplitsText}>Choose / Edit Program</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.splitList}
        >
          {splitKeys.map((splitKey) => {
            const isCurrent = splitKey === currentSplitKey;
            return (
              <TouchableOpacity
                key={splitKey}
                onPress={() => setActiveSplit(splitKey)}
                style={[styles.splitChip, isCurrent && styles.splitChipActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.splitChipText,
                    isCurrent && styles.splitChipTextActive,
                  ]}
                >
                  {splitKey}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 1-Click Launch Active Split Card */}
        <View style={styles.splitLaunchCard}>
          <View style={styles.splitLaunchTop}>
            <View style={styles.splitIconCircle}>
              <Dumbbell size={20} color="#38BDF8" />
            </View>
            <View style={styles.splitLaunchInfo}>
              <Text style={styles.splitLaunchTitle}>{currentSplit.name}</Text>
              <Text style={styles.splitLaunchDesc}>
                {currentSplit.description || `${(currentSplit.exercises || []).length} exercises configured`}
              </Text>
            </View>
          </View>

          {/* Exercise Preview Chips or Empty State */}
          {(currentSplit.exercises || []).length > 0 ? (
            <View style={styles.exerciseChipsContainer}>
              {(currentSplit.exercises || []).map((ex, idx) => (
                <View key={`${ex.exerciseId}-${idx}`} style={styles.exerciseChip}>
                  <Text style={styles.exerciseChipText} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text style={styles.exerciseChipSets}>{ex.defaultSets || 3}s</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySplitBox}>
              <Text style={styles.emptySplitTitle}>No exercises assigned yet</Text>
              <Text style={styles.emptySplitSubtitle}>
                Exercises & sets come later! Tap below to start your workout and build it as you train, or tap Customize to add movements now.
              </Text>
            </View>
          )}

          {/* Action Row */}
          <View style={styles.splitActionRow}>
            <TouchableOpacity
              onPress={() => handleStartSplitRoutine(currentSplitKey)}
              style={styles.launchBtn}
              activeOpacity={0.85}
              disabled={isStartingSplit}
            >
              {isStartingSplit ? (
                <ActivityIndicator size="small" color="#0B0F17" />
              ) : (
                <>
                  <Zap size={16} color="#0B0F17" />
                  <Text style={styles.launchBtnText}>
                    {(currentSplit.exercises || []).length > 0
                      ? `Start ${currentSplit.name}`
                      : `Start ${currentSplit.name} (Build As You Go)`}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCustomizeOpen(true)}
              style={styles.customizeSplitBtn}
              activeOpacity={0.7}
            >
              <Pencil size={14} color="#38BDF8" />
              <Text style={styles.customizeSplitText}>Customize</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Empty Workout Secondary Link */}
        <TouchableOpacity
          onPress={handleStartEmptyWorkout}
          style={styles.emptyStartLink}
          activeOpacity={0.7}
        >
          <Plus size={16} color="#64748B" />
          <Text style={styles.emptyStartText}>Or start a blank session without template</Text>
        </TouchableOpacity>

        {/* 🏋️ Workout History Section (THE LOGGED WORKOUTS!) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithIcon}>
            <History size={16} color="#38BDF8" />
            <Text style={styles.sectionTitle}>WORKOUT HISTORY</Text>
          </View>
          <Text style={styles.prCountText}>{history.length} Sessions</Text>
        </View>

        {history.length > 0 ? (
          history.map((w, index) => (
            <WorkoutHistoryCard
              key={w._id || w.id || index}
              workout={w}
              onRepeat={handleRepeatWorkout}
              onDelete={handleDeleteWorkout}
            />
          ))
        ) : (
          <View style={styles.emptyHistoryBox}>
            <History size={32} color="#334155" />
            <Text style={styles.emptyHistoryTitle}>No past workouts logged yet</Text>
            <Text style={styles.emptyHistorySubtitle}>
              Completed workout sessions will show up right here with your full sets, weights, and reps.
            </Text>
          </View>
        )}

        {/* 🏆 PR Showcase */}
        <View style={styles.prHeaderRow}>
          <View style={styles.titleWithIcon}>
            <Trophy size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          </View>
          <Text style={styles.prCountText}>{prs.length} Records</Text>
        </View>

        {prs.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prCardsContainer}
          >
            {prs.map((pr, index) => {
              const formattedDate = pr.achievedAt
                ? new Date(pr.achievedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <View key={pr.exerciseId || index} style={styles.prCard}>
                  <View style={styles.prCardHeader}>
                    <View style={styles.trophyPill}>
                      <Trophy size={12} color="#10B981" />
                      <Text style={styles.trophyPillText}>PR</Text>
                    </View>
                    <Text style={styles.prDateText}>{formattedDate}</Text>
                  </View>

                  <Text style={styles.prExerciseName} numberOfLines={2}>
                    {pr.exerciseName}
                  </Text>

                  <View style={styles.prStatsRow}>
                    <Text style={styles.prWeightText}>{pr.maxWeight} kg</Text>
                    <Text style={styles.prRepsText}>× {pr.repsAtMax} reps</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyPrBox}>
            <Trophy size={28} color="#334155" />
            <Text style={styles.emptyPrTitle}>No records logged yet</Text>
            <Text style={styles.emptyPrSubtitle}>
              Complete sets in the workout tab to automatically establish your personal records.
            </Text>
          </View>
        )}

        {/* Rest Timer Quick Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={styles.timerIconBox}>
              <Clock size={20} color="#38BDF8" />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Auto Rest Timer</Text>
              <Text style={styles.toggleSubtitle}>
                Starts {defaultRestDuration}s countdown upon checking a set
              </Text>
            </View>
          </View>
          <Switch
            value={isRestTimerEnabled}
            onValueChange={toggleRestTimer}
            trackColor={{ false: '#222F43', true: '#38BDF8' }}
            thumbColor={isRestTimerEnabled ? '#0B0F17' : '#64748B'}
          />
        </View>
      </ScrollView>

      {/* Customize Split Modal */}
      <CustomizeSplitModal
        visible={isCustomizeOpen}
        splitName={currentSplitKey}
        initialExercises={currentSplit.exercises || []}
        onClose={() => setIsCustomizeOpen(false)}
        onSave={(name, updatedExs) => saveSplitTemplate(name, updatedExs)}
      />

      {/* Program Presets & Split Management Modal */}
      <ManageSplitsModal
        visible={isManageSplitsOpen}
        onClose={() => setIsManageSplitsOpen(false)}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.8,
  },
  activeSplitBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  activeSplitText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  modeOffline: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  modeOfflineText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeOnline: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modeOnlineText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeAI: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  modeAIText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  manageSplitsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  manageSplitsText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  splitList: {
    gap: 8,
    paddingVertical: 4,
  },
  splitChip: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  splitChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  splitChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  splitChipTextActive: {
    color: '#0B0F17',
    fontWeight: '800',
  },
  splitLaunchCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  splitLaunchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  splitIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitLaunchInfo: {
    flex: 1,
  },
  splitLaunchTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  splitLaunchDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  exerciseChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    maxWidth: '48%',
  },
  exerciseChipText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  exerciseChipSets: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  emptySplitBox: {
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  emptySplitTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySplitSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  splitActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  launchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  launchBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '800',
  },
  customizeSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  customizeSplitText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStartLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
    gap: 6,
  },
  emptyStartText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyHistoryBox: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyHistoryTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyHistorySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  prHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  prCountText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  prCardsContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  prCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    width: 170,
  },
  prCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  trophyPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  prDateText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  prExerciseName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    minHeight: 36,
  },
  prStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  prWeightText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  prRepsText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyPrBox: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPrTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyPrSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  toggleCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  timerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});
