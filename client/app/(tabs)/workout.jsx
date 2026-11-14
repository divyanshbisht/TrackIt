import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import {
  Zap,
  Plus,
  CheckCircle2,
  Trophy,
  RotateCcw,
  Sparkles,
  Dumbbell,
  Clock,
  Flame,
  Bookmark,
} from 'lucide-react-native';
import { useAppModeStore, APP_MODES } from '../../store/useAppModeStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useSplitStore } from '../../store/useSplitStore';
import ExerciseTrackerCard from '../../components/ExerciseTrackerCard';
import ExerciseSearchModal from '../../components/ExerciseSearchModal';
import EditExerciseModal from '../../components/EditExerciseModal';
import {
  parseWorkoutAI,
  completeWorkoutSession,
  fetchPreviousPerformance,
} from '../../services/api';

export default function WorkoutScreen() {
  const { mode } = useAppModeStore();
  const {
    activeSplit,
    exercises,
    startTime,
    setRoutine,
    addExercise,
    updateExercise,
    replaceExercise,
    resetWorkout,
  } = useWorkoutStore();

  // Smart AI prompt input
  const [promptInput, setPromptInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Exercise search modal & Edit exercise modal state
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [isReplacingExercise, setIsReplacingExercise] = useState(false);

  // Finishing & PR celebration state
  const [isFinishing, setIsFinishing] = useState(false);
  const [celebrationPRs, setCelebrationPRs] = useState(null);

  // Workout elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (startTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime]);

  const formatElapsed = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // AI Parse Handler
  const handleParsePrompt = async () => {
    if (!promptInput.trim()) return;
    setIsParsing(true);
    setParseError('');

    try {
      const routine = await parseWorkoutAI(promptInput.trim());
      if (routine) {
        // Fetch previous performance ghost values for parsed exercises
        const enhancedExercises = await Promise.all(
          (routine.exercises || []).map(async (ex) => {
            try {
              const prevSets = await fetchPreviousPerformance(ex.exerciseId, mode);
              const setsWithGhosts = (ex.sets || []).map((s, idx) => ({
                ...s,
                previousWeight: prevSets[idx]?.weight || prevSets[0]?.weight || 0,
                previousReps: prevSets[idx]?.reps || prevSets[0]?.reps || 0,
              }));
              return { ...ex, sets: setsWithGhosts };
            } catch (e) {
              return ex;
            }
          })
        );

        setRoutine({
          ...routine,
          exercises: enhancedExercises,
        });
        setPromptInput('');
      }
    } catch (err) {
      console.error('AI Parsing Error:', err);
      setParseError(err.message || 'Failed to parse workout. Please check your connection.');
    } finally {
      setIsParsing(false);
    }
  };

  // Add or Replace Exercise through Search Modal
  const handleSelectExercise = async (selected) => {
    try {
      const prevSets = await fetchPreviousPerformance(selected.id, mode);
      if (isReplacingExercise && editingExerciseIndex !== null) {
        replaceExercise(editingExerciseIndex, selected, prevSets);
        setIsReplacingExercise(false);
        setEditingExerciseIndex(null);
      } else {
        addExercise(selected, prevSets);
      }
    } catch (err) {
      if (isReplacingExercise && editingExerciseIndex !== null) {
        replaceExercise(editingExerciseIndex, selected, []);
        setIsReplacingExercise(false);
        setEditingExerciseIndex(null);
      } else {
        addExercise(selected, []);
      }
    }
  };

  const saveSplitTemplate = useSplitStore((s) => s.saveSplitTemplate);

  // Save manual modifications to exercise details
  const handleSaveExerciseEdit = (updatedFields) => {
    if (editingExerciseIndex !== null) {
      updateExercise(editingExerciseIndex, updatedFields);
      setEditingExerciseIndex(null);
    }
  };

  // Save current exercises as a reusable split template
  const handleSaveAsTemplate = async () => {
    if (exercises.length === 0) {
      Alert.alert('Empty Routine', 'Add exercises before saving as a template.');
      return;
    }
    const splitName = activeSplit || 'Custom Split';
    await saveSplitTemplate(splitName, exercises);
    Alert.alert(
      'Template Saved! 📋',
      `Saved ${exercises.length} exercise(s) as your default routine for "${splitName}". Next time you select it on the dashboard, it will load with 1 click!`
    );
  };

  // Finish Workout Session
  const handleFinishWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert('Empty Session', 'Add at least one exercise before completing.');
      return;
    }

    // Check if at least one set is completed
    const completedCount = exercises.reduce(
      (total, ex) => total + ex.sets.filter((s) => s.isCompleted).length,
      0
    );

    if (completedCount === 0) {
      Alert.alert(
        'No Sets Completed',
        'Please mark at least one set as completed before finishing the workout.'
      );
      return;
    }

    setIsFinishing(true);

    try {
      const workoutPayload = {
        splitName: activeSplit || 'Custom Day',
        durationSeconds: elapsedSeconds || 0,
        date: new Date().toISOString(),
        exercises,
      };

      const result = await completeWorkoutSession(workoutPayload, mode);

      if (result.newPRs && result.newPRs.length > 0) {
        setCelebrationPRs(result.newPRs);
      } else {
        Alert.alert('Workout Logged! 🎉', 'Great session! Your workout has been saved successfully.');
        resetWorkout();
      }
    } catch (err) {
      console.error('Failed to complete workout:', err);
      Alert.alert('Error', 'Could not save workout. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDismissCelebration = () => {
    setCelebrationPRs(null);
    resetWorkout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Dynamic Header Section */}
        <View style={styles.topHeader}>
          <View style={styles.splitInfoRow}>
            <View>
              <Text style={styles.activeSplitText}>{activeSplit || 'Active Workout'}</Text>
              {startTime && (
                <View style={styles.timerRow}>
                  <Clock size={12} color="#38BDF8" />
                  <Text style={styles.elapsedText}>{formatElapsed(elapsedSeconds)}</Text>
                </View>
              )}
            </View>

            {exercises.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (typeof window !== 'undefined' && window.confirm) {
                      if (window.confirm('Are you sure you want to discard this workout?')) {
                        resetWorkout();
                      }
                    } else {
                      resetWorkout();
                    }
                  } else {
                    Alert.alert(
                      'Discard Session?',
                      'Are you sure you want to discard this workout?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Discard', style: 'destructive', onPress: resetWorkout },
                      ]
                    );
                  }
                }}
                style={styles.discardBtn}
              >
                <RotateCcw size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* SMART AI Mode: Natural-Language Input Bar */}
          {mode === APP_MODES.SMART_AI ? (
            <View style={styles.aiBarContainer}>
              <View style={styles.aiInputWrapper}>
                <Sparkles size={16} color="#F59E0B" style={styles.aiIcon} />
                <TextInput
                  style={styles.aiInput}
                  placeholder="bench 3x8, incline db 3x10, lateral raises 4 sets..."
                  placeholderTextColor="#64748B"
                  value={promptInput}
                  onChangeText={setPromptInput}
                  returnKeyType="done"
                  onSubmitEditing={handleParsePrompt}
                />
              </View>

              <TouchableOpacity
                onPress={handleParsePrompt}
                style={[styles.parseButton, isParsing && styles.parseButtonDisabled]}
                disabled={isParsing || !promptInput.trim()}
                activeOpacity={0.8}
              >
                {isParsing ? (
                  <ActivityIndicator size="small" color="#0B0F17" />
                ) : (
                  <>
                    <Zap size={14} color="#0B0F17" />
                    <Text style={styles.parseButtonText}>Parse</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* OFFLINE & ONLINE Mode: Prominent "+ Add Exercise" Button */
            <TouchableOpacity
              onPress={() => setIsSearchModalVisible(true)}
              style={styles.addExerciseMainBtn}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#0B0F17" strokeWidth={2.5} />
              <Text style={styles.addExerciseMainText}>+ Add Exercise</Text>
            </TouchableOpacity>
          )}

          {parseError ? <Text style={styles.parseErrorText}>{parseError}</Text> : null}
        </View>

        {/* Exercises List / Empty State */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length > 0 ? (
            <>
              {exercises.map((exercise, index) => (
                <ExerciseTrackerCard
                  key={`${exercise.exerciseId}-${index}`}
                  exercise={exercise}
                  exerciseIndex={index}
                  totalExercises={exercises.length}
                  onEdit={() => setEditingExerciseIndex(index)}
                />
              ))}

              {/* Exercise Action Buttons */}
              <View style={styles.actionRowContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setIsReplacingExercise(false);
                    setIsSearchModalVisible(true);
                  }}
                  style={styles.secondaryAddBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#38BDF8" />
                  <Text style={styles.secondaryAddText}>Add Exercise</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveAsTemplate}
                  style={styles.saveTemplateBtn}
                  activeOpacity={0.7}
                >
                  <Bookmark size={15} color="#F59E0B" />
                  <Text style={styles.saveTemplateText}>Save Split Routine</Text>
                </TouchableOpacity>
              </View>

              {/* Finish Workout Button */}
              <TouchableOpacity
                onPress={handleFinishWorkout}
                style={[styles.finishBtn, isFinishing && styles.finishBtnDisabled]}
                disabled={isFinishing}
                activeOpacity={0.85}
              >
                {isFinishing ? (
                  <ActivityIndicator size="small" color="#0B0F17" />
                ) : (
                  <>
                    <CheckCircle2 size={20} color="#0B0F17" />
                    <Text style={styles.finishBtnText}>Finish Workout</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Dumbbell size={36} color="#38BDF8" />
              </View>
              <Text style={styles.emptyTitle}>Your Workout is Empty</Text>
              <Text style={styles.emptySubtitle}>
                {mode === APP_MODES.SMART_AI
                  ? 'Type your single-line routine above (e.g. "bench 3x8, db incline 3x10") or tap below to search manually.'
                  : 'Search from our verified exercise catalog to construct your session.'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setIsReplacingExercise(false);
                  setIsSearchModalVisible(true);
                }}
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#38BDF8" />
                <Text style={styles.emptyActionText}>Browse Exercises</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Edit Exercise Modal */}
        <EditExerciseModal
          visible={editingExerciseIndex !== null && !isReplacingExercise}
          exercise={editingExerciseIndex !== null ? exercises[editingExerciseIndex] : null}
          onClose={() => setEditingExerciseIndex(null)}
          onSave={handleSaveExerciseEdit}
          onOpenLibraryReplace={() => {
            setIsReplacingExercise(true);
            setIsSearchModalVisible(true);
          }}
        />

        {/* Exercise Search Modal */}
        <ExerciseSearchModal
          visible={isSearchModalVisible}
          onClose={() => {
            setIsSearchModalVisible(false);
            setIsReplacingExercise(false);
          }}
          onSelectExercise={handleSelectExercise}
        />

        {/* 🏆 PR Celebration Modal */}
        <Modal
          visible={celebrationPRs !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={handleDismissCelebration}
        >
          <View style={styles.prModalOverlay}>
            <View style={styles.prModalCard}>
              <View style={styles.trophyGlow}>
                <Trophy size={48} color="#10B981" />
              </View>

              <Text style={styles.prModalTitle}>NEW PERSONAL RECORD!</Text>
              <Text style={styles.prModalSubtitle}>
                You shattered your previous records this session!
              </Text>

              <View style={styles.prList}>
                {(celebrationPRs || []).map((pr, i) => (
                  <View key={i} style={styles.celebrationRow}>
                    <View style={styles.celebrationRowLeft}>
                      <Text style={styles.celebrationName}>{pr.exerciseName}</Text>
                      <Text style={styles.celebrationPrev}>
                        Previous: {pr.previousWeight > 0 ? `${pr.previousWeight} kg` : 'First log'}
                      </Text>
                    </View>
                    <View style={styles.celebrationRowRight}>
                      <Text style={styles.celebrationMax}>{pr.maxWeight} kg</Text>
                      <Text style={styles.celebrationReps}>× {pr.repsAtMax} reps</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleDismissCelebration}
                style={styles.celebrationDoneBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.celebrationDoneText}>Celebrate & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 32 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#151D2A',
  },
  splitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeSplitText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  elapsedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  discardBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  aiBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  aiIcon: {
    marginRight: 8,
  },
  aiInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  parseButtonDisabled: {
    opacity: 0.5,
  },
  parseButtonText: {
    color: '#0B0F17',
    fontSize: 13,
    fontWeight: '800',
  },
  addExerciseMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addExerciseMainText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '800',
  },
  parseErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },
  actionRowContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  secondaryAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryAddText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  saveTemplateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  saveTemplateText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  finishBtnDisabled: {
    opacity: 0.6,
  },
  finishBtnText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  emptyActionText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  prModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 13, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  prModalCard: {
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  trophyGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  prModalTitle: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prModalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  prList: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  celebrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    padding: 12,
  },
  celebrationRowLeft: {
    flex: 1,
    marginRight: 10,
  },
  celebrationName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  celebrationPrev: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  celebrationRowRight: {
    alignItems: 'flex-end',
  },
  celebrationMax: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  celebrationReps: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  celebrationDoneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  celebrationDoneText: {
    color: '#0B0F17',
    fontSize: 15,
    fontWeight: '800',
  },
});
