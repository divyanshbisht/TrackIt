import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from './useSettingsStore';

const SET_TYPES = ['regular', 'warmup', 'drop', 'failure'];

let timerInterval = null;

export const useWorkoutStore = create((set, get) => ({
  activeSplit: 'Push Day',
  exercises: [],
  startTime: null,
  activeTimerSeconds: null,
  isTimerRunning: false,

  setActiveSplit: (split) => {
    set({ activeSplit: split });
  },

  setRoutine: (routine) => {
    const formattedExercises = (routine.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId || ex.id || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: ex.name,
      muscleGroup: ex.muscleGroup || 'Full Body',
      isCompound: ex.isCompound !== undefined ? ex.isCompound : true,
      sets: (ex.sets && ex.sets.length > 0)
        ? ex.sets.map((s, idx) => ({
            setNumber: s.setNumber || idx + 1,
            type: s.type || 'regular',
            weight: s.weight ? String(s.weight) : '',
            reps: s.reps ? String(s.reps) : '10',
            isCompleted: false,
            previousWeight: s.previousWeight || 0,
            previousReps: s.previousReps || 0,
          }))
        : [
            {
              setNumber: 1,
              type: 'regular',
              weight: '',
              reps: '10',
              isCompleted: false,
              previousWeight: 0,
              previousReps: 0,
            },
          ],
    }));

    set({
      activeSplit: routine.splitName || get().activeSplit || 'Custom Day',
      exercises: formattedExercises,
      startTime: get().startTime || Date.now(),
    });
  },

  loadSplitRoutine: (splitName, templateExercises, ghostDataMap = {}) => {
    const formatted = templateExercises.map((ex) => {
      const exId = ex.exerciseId || ex.id || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const ghostSets = ghostDataMap[exId] || [];
      const setCount = ex.defaultSets || (ex.sets ? ex.sets.length : 3);
      const defaultReps = ex.defaultReps || (ex.sets && ex.sets[0] ? Number(ex.sets[0].reps) || 10 : 10);

      const sets = [];
      for (let i = 1; i <= setCount; i++) {
        const ghostSet = ghostSets[i - 1] || ghostSets[0];
        sets.push({
          setNumber: i,
          type: 'regular',
          weight: '',
          reps: String(defaultReps),
          isCompleted: false,
          previousWeight: ghostSet ? ghostSet.weight : 0,
          previousReps: ghostSet ? ghostSet.reps : 0,
        });
      }

      return {
        exerciseId: exId,
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'Full Body',
        isCompound: ex.isCompound !== undefined ? ex.isCompound : false,
        sets: sets.length > 0 ? sets : [
          { setNumber: 1, type: 'regular', weight: '', reps: '10', isCompleted: false, previousWeight: 0, previousReps: 0 }
        ],
      };
    });

    set({
      activeSplit: splitName,
      exercises: formatted,
      startTime: Date.now(),
    });
  },

  loadPastWorkoutAsActive: (workout, ghostDataMap = {}) => {
    const formatted = (workout.exercises || []).map((ex) => {
      const exId = ex.exerciseId || ex.id;
      const ghostSets = ghostDataMap[exId] || ex.sets || [];

      const sets = (ex.sets || []).map((s, idx) => ({
        setNumber: idx + 1,
        type: s.type || 'regular',
        weight: '',
        reps: String(s.reps || 10),
        isCompleted: false,
        previousWeight: s.isCompleted && s.weight ? s.weight : (ghostSets[idx]?.weight || 0),
        previousReps: s.isCompleted && s.reps ? s.reps : (ghostSets[idx]?.reps || 0),
      }));

      return {
        exerciseId: exId,
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'Full Body',
        isCompound: ex.isCompound !== undefined ? ex.isCompound : false,
        sets: sets.length > 0 ? sets : [
          { setNumber: 1, type: 'regular', weight: '', reps: '10', isCompleted: false, previousWeight: 0, previousReps: 0 }
        ],
      };
    });

    set({
      activeSplit: workout.splitName || 'Repeated Workout',
      exercises: formatted,
      startTime: Date.now(),
    });
  },

  addExercise: (exerciseObj, previousSets = []) => {
    const defaultSet = {
      setNumber: 1,
      type: 'regular',
      weight: '',
      reps: '',
      isCompleted: false,
      previousWeight: previousSets[0]?.weight || 0,
      previousReps: previousSets[0]?.reps || 0,
    };

    const newExercise = {
      exerciseId: exerciseObj.id || exerciseObj.exerciseId,
      name: exerciseObj.name,
      muscleGroup: exerciseObj.muscleGroup || 'Other',
      isCompound: exerciseObj.isCompound || false,
      sets: [defaultSet],
    };

    set((state) => ({
      exercises: [...state.exercises, newExercise],
      startTime: state.startTime || Date.now(),
    }));
  },

  removeExercise: (exerciseIndex) => {
    set((state) => ({
      exercises: state.exercises.filter((_, idx) => idx !== exerciseIndex),
    }));
  },

  updateExercise: (exerciseIndex, updatedFields) => {
    set((state) => {
      const updated = [...state.exercises];
      if (!updated[exerciseIndex]) return state;
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        ...updatedFields,
      };
      return { exercises: updated };
    });
  },

  replaceExercise: (exerciseIndex, newExerciseObj, previousSets = []) => {
    set((state) => {
      const updated = [...state.exercises];
      const current = updated[exerciseIndex];
      if (!current) return state;

      const updatedSets = current.sets.map((s, idx) => ({
        ...s,
        previousWeight: previousSets[idx]?.weight || previousSets[0]?.weight || 0,
        previousReps: previousSets[idx]?.reps || previousSets[0]?.reps || 0,
      }));

      updated[exerciseIndex] = {
        ...current,
        exerciseId:
          newExerciseObj.id ||
          newExerciseObj.exerciseId ||
          newExerciseObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: newExerciseObj.name,
        muscleGroup: newExerciseObj.muscleGroup || current.muscleGroup || 'Full Body',
        isCompound:
          newExerciseObj.isCompound !== undefined
            ? newExerciseObj.isCompound
            : current.isCompound,
        sets: updatedSets,
      };
      return { exercises: updated };
    });
  },

  reorderExercise: (fromIndex, toIndex) => {
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.exercises.length ||
        toIndex < 0 ||
        toIndex >= state.exercises.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const updated = [...state.exercises];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return { exercises: updated };
    });
  },

  moveExerciseUp: (index) => {
    get().reorderExercise(index, index - 1);
  },

  moveExerciseDown: (index) => {
    get().reorderExercise(index, index + 1);
  },

  cycleSetType: (exerciseIndex, setIndex) => {
    set((state) => {
      const updated = [...state.exercises];
      const targetEx = { ...updated[exerciseIndex] };
      const targetSets = [...targetEx.sets];
      const currentType = targetSets[setIndex].type || 'regular';

      const currentIdx = SET_TYPES.indexOf(currentType);
      const nextType = SET_TYPES[(currentIdx + 1) % SET_TYPES.length];

      targetSets[setIndex] = { ...targetSets[setIndex], type: nextType };
      targetEx.sets = targetSets;
      updated[exerciseIndex] = targetEx;
      return { exercises: updated };
    });
  },

  updateSetField: (exerciseIndex, setIndex, field, value) => {
    set((state) => {
      const updated = [...state.exercises];
      const targetEx = { ...updated[exerciseIndex] };
      const targetSets = [...targetEx.sets];

      targetSets[setIndex] = {
        ...targetSets[setIndex],
        [field]: value,
      };

      targetEx.sets = targetSets;
      updated[exerciseIndex] = targetEx;
      return { exercises: updated };
    });
  },

  copyLastSet: (exerciseIndex) => {
    set((state) => {
      const updated = [...state.exercises];
      const targetEx = { ...updated[exerciseIndex] };
      const sets = [...targetEx.sets];

      const lastSet = sets[sets.length - 1];
      const newSetNumber = sets.length + 1;

      const newSet = {
        setNumber: newSetNumber,
        type: lastSet ? lastSet.type : 'regular',
        weight: lastSet ? lastSet.weight : '',
        reps: lastSet ? lastSet.reps : '',
        isCompleted: false,
        previousWeight: lastSet ? lastSet.previousWeight : 0,
        previousReps: lastSet ? lastSet.previousReps : 0,
      };

      targetEx.sets = [...sets, newSet];
      updated[exerciseIndex] = targetEx;
      return { exercises: updated };
    });
  },

  removeSet: (exerciseIndex, setIndex) => {
    set((state) => {
      const updated = [...state.exercises];
      const targetEx = { ...updated[exerciseIndex] };
      if (targetEx.sets.length <= 1) return state; // keep at least 1 set

      const sets = targetEx.sets
        .filter((_, idx) => idx !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      targetEx.sets = sets;
      updated[exerciseIndex] = targetEx;
      return { exercises: updated };
    });
  },

  toggleCompleteSet: (exerciseIndex, setIndex) => {
    const state = get();
    const currentStatus = state.exercises[exerciseIndex]?.sets[setIndex]?.isCompleted;
    const willBeCompleted = !currentStatus;

    // Haptic feedback
    if (willBeCompleted) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch (e) {
        // Safe failover for web/unsupported
      }
    }

    set((s) => {
      const updated = [...s.exercises];
      const targetEx = { ...updated[exerciseIndex] };
      const targetSets = [...targetEx.sets];

      targetSets[setIndex] = {
        ...targetSets[setIndex],
        isCompleted: willBeCompleted,
      };

      targetEx.sets = targetSets;
      updated[exerciseIndex] = targetEx;
      return { exercises: updated };
    });

    // Start rest timer if completed and enabled in settings
    if (willBeCompleted) {
      const settings = useSettingsStore.getState();
      if (settings.isRestTimerEnabled) {
        get().startTimer(settings.defaultRestDuration || 90);
      }
    }
  },

  startTimer: (seconds) => {
    if (timerInterval) clearInterval(timerInterval);

    set({ activeTimerSeconds: seconds, isTimerRunning: true });

    timerInterval = setInterval(() => {
      const current = get().activeTimerSeconds;
      if (current === null || current <= 1) {
        clearInterval(timerInterval);
        timerInterval = null;
        set({ activeTimerSeconds: 0, isTimerRunning: false });

        // Vibration alert when timer hits 0
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch (e) {}

        // Auto dismiss banner after 3 seconds
        setTimeout(() => {
          if (get().activeTimerSeconds === 0) {
            set({ activeTimerSeconds: null });
          }
        }, 3500);
      } else {
        set({ activeTimerSeconds: current - 1 });
      }
    }, 1000);
  },

  addTimerTime: (seconds) => {
    const current = get().activeTimerSeconds || 0;
    const next = Math.max(0, current + seconds);
    if (next === 0) {
      get().clearTimer();
    } else {
      set({ activeTimerSeconds: next });
    }
  },

  clearTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({ activeTimerSeconds: null, isTimerRunning: false });
  },

  resetWorkout: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({
      exercises: [],
      startTime: null,
      activeTimerSeconds: null,
      isTimerRunning: false,
    });
  },
}));
