import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'TRACKIT_SPLIT_TEMPLATES_V2';

export const PROGRAM_PRESETS = {
  PPL: {
    id: 'PPL',
    name: 'Push / Pull / Legs',
    desc: '3-6 Days: Chest/Delts/Tris, Back/Biceps, Quads/Hams',
    days: ['Push Day', 'Pull Day', 'Legs Day'],
    defaults: {
      'Push Day': {
        name: 'Push Day',
        description: 'Chest, Shoulders & Triceps',
        color: '#38BDF8',
        exercises: [
          { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', isCompound: false, defaultSets: 4, defaultReps: 15 },
          { exerciseId: 'tricep-rope-pushdown', name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 12 },
        ],
      },
      'Pull Day': {
        name: 'Pull Day',
        description: 'Back, Rear Delts & Biceps',
        color: '#34D399',
        exercises: [
          { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'barbell-bent-over-row', name: 'Barbell Bent Over Row', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'Face_Pull', name: 'Face Pull', muscleGroup: 'Shoulders', isCompound: false, defaultSets: 3, defaultReps: 15 },
          { exerciseId: 'Dumbbell_Bicep_Curl', name: 'Dumbbell Bicep Curl', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Hammer_Curls', name: 'Hammer Curls', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 12 },
        ],
      },
      'Legs Day': {
        name: 'Legs Day',
        description: 'Quads, Hamstrings & Calves',
        color: '#F59E0B',
        exercises: [
          { exerciseId: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Leg_Press', name: 'Leg Press', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 12 },
          { exerciseId: 'Standing_Calf_Raises', name: 'Standing Calf Raises', muscleGroup: 'Legs', isCompound: false, defaultSets: 4, defaultReps: 15 },
        ],
      },
    },
  },
  UPPER_LOWER: {
    id: 'UPPER_LOWER',
    name: 'Upper / Lower',
    desc: '4 Days: Alternating Upper Body & Lower Body',
    days: ['Upper Day', 'Lower Day'],
    defaults: {
      'Upper Day': {
        name: 'Upper Day',
        description: 'Complete Upper Body',
        color: '#A78BFA',
        exercises: [
          { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'barbell-bent-over-row', name: 'Barbell Bent Over Row', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Dumbbell_Bicep_Curl', name: 'Dumbbell Bicep Curl', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 10 },
        ],
      },
      'Lower Day': {
        name: 'Lower Day',
        description: 'Quads, Hamstrings & Core',
        color: '#FB7185',
        exercises: [
          { exerciseId: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Leg_Press', name: 'Leg Press', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Standing_Calf_Raises', name: 'Standing Calf Raises', muscleGroup: 'Legs', isCompound: false, defaultSets: 4, defaultReps: 15 },
        ],
      },
    },
  },
  ARNOLD: {
    id: 'ARNOLD',
    name: 'Arnold Split',
    desc: 'Chest & Back, Shoulders & Arms, Legs',
    days: ['Chest & Back', 'Shoulders & Arms', 'Legs Day'],
    defaults: {
      'Chest & Back': {
        name: 'Chest & Back',
        description: 'Antagonistic Upper Torso',
        color: '#38BDF8',
        exercises: [
          { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'barbell-bent-over-row', name: 'Barbell Bent Over Row', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 10 },
        ],
      },
      'Shoulders & Arms': {
        name: 'Shoulders & Arms',
        description: 'Delts, Biceps & Triceps',
        color: '#F59E0B',
        exercises: [
          { exerciseId: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', isCompound: false, defaultSets: 4, defaultReps: 15 },
          { exerciseId: 'Dumbbell_Bicep_Curl', name: 'Dumbbell Bicep Curl', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'tricep-rope-pushdown', name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 12 },
        ],
      },
      'Legs Day': {
        name: 'Legs Day',
        description: 'Complete Legs Session',
        color: '#34D399',
        exercises: [
          { exerciseId: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Leg_Press', name: 'Leg Press', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 12 },
        ],
      },
    },
  },
  BRO_SPLIT: {
    id: 'BRO_SPLIT',
    name: 'Body Part / Bro Split',
    desc: '5 Days: 1 Major Muscle Group per Day',
    days: ['Chest Day', 'Back Day', 'Shoulders Day', 'Arms Day', 'Legs Day'],
    defaults: {
      'Chest Day': { name: 'Chest Day', description: 'Chest Hypertrophy', color: '#38BDF8', exercises: [] },
      'Back Day': { name: 'Back Day', description: 'Back Thickness & Lat Width', color: '#34D399', exercises: [] },
      'Shoulders Day': { name: 'Shoulders Day', description: 'Delts & Traps', color: '#F59E0B', exercises: [] },
      'Arms Day': { name: 'Arms Day', description: 'Biceps & Triceps', color: '#A78BFA', exercises: [] },
      'Legs Day': { name: 'Legs Day', description: 'Quads, Hams & Calves', color: '#FB7185', exercises: [] },
    },
  },
  FULL_BODY: {
    id: 'FULL_BODY',
    name: 'Full Body (3 Days)',
    desc: 'Compound Movements Hitting Whole Body',
    days: ['Full Body A', 'Full Body B'],
    defaults: {
      'Full Body A': {
        name: 'Full Body A',
        description: 'Squat & Bench Focus',
        color: '#38BDF8',
        exercises: [
          { exerciseId: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', isCompound: true, defaultSets: 3, defaultReps: 10 },
        ],
      },
      'Full Body B': {
        name: 'Full Body B',
        description: 'Deadlift & OHP Focus',
        color: '#34D399',
        exercises: [
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', isCompound: true, defaultSets: 3, defaultReps: 8 },
          { exerciseId: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', isCompound: true, defaultSets: 3, defaultReps: 10 },
          { exerciseId: 'Dumbbell_Bicep_Curl', name: 'Dumbbell Bicep Curl', muscleGroup: 'Arms', isCompound: false, defaultSets: 3, defaultReps: 10 },
        ],
      },
    },
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Program (Blank Slate)',
    desc: 'Define your own split days from scratch',
    days: ['Day A', 'Day B'],
    defaults: {
      'Day A': { name: 'Day A', description: 'Custom Session A', color: '#38BDF8', exercises: [] },
      'Day B': { name: 'Day B', description: 'Custom Session B', color: '#34D399', exercises: [] },
    },
  },
};

// Default initial state: PPL
const INITIAL_SPLITS = PROGRAM_PRESETS.PPL.defaults;

export const useSplitStore = create((set, get) => ({
  splits: INITIAL_SPLITS,
  isInitialized: false,

  loadSplits: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && Object.keys(parsed).length > 0) {
          set({ splits: parsed, isInitialized: true });
          return;
        }
      }
      set({ splits: INITIAL_SPLITS, isInitialized: true });
    } catch (e) {
      console.error('Failed to load split templates:', e);
      set({ splits: INITIAL_SPLITS, isInitialized: true });
    }
  },

  applyProgramPreset: async (presetKey, startEmpty = false) => {
    const preset = PROGRAM_PRESETS[presetKey];
    if (!preset) return;

    let newSplits = {};
    if (startEmpty) {
      preset.days.forEach((dayName) => {
        const original = preset.defaults[dayName];
        newSplits[dayName] = {
          name: dayName,
          description: original ? original.description : 'Custom Routine',
          color: original ? original.color : '#38BDF8',
          exercises: [],
        };
      });
    } else {
      newSplits = { ...preset.defaults };
    }

    set({ splits: newSplits });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSplits));
  },

  addSplitDay: async (name, description = '') => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const current = { ...get().splits };
    current[cleanName] = {
      name: cleanName,
      description: description || 'Custom Routine',
      color: '#38BDF8',
      exercises: [],
    };
    set({ splits: current });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  },

  deleteSplitDay: async (splitName) => {
    const current = { ...get().splits };
    delete current[splitName];
    set({ splits: current });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  },

  renameSplitDay: async (oldName, newName) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName || cleanNewName === oldName) return;
    const current = get().splits;
    const target = current[oldName];
    if (!target) return;

    const updated = {};
    Object.keys(current).forEach((k) => {
      if (k === oldName) {
        updated[cleanNewName] = { ...target, name: cleanNewName };
      } else {
        updated[k] = current[k];
      }
    });

    set({ splits: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  reorderSplitDays: async (fromIndex, toIndex) => {
    const current = get().splits;
    const keys = Object.keys(current);
    if (fromIndex < 0 || fromIndex >= keys.length || toIndex < 0 || toIndex >= keys.length) return;

    const [movedKey] = keys.splice(fromIndex, 1);
    keys.splice(toIndex, 0, movedKey);

    const reordered = {};
    keys.forEach((k) => {
      reordered[k] = current[k];
    });

    set({ splits: reordered });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
  },

  saveSplitTemplate: async (splitName, exercises) => {
    try {
      const cleanName = splitName.trim();
      const currentSplits = { ...get().splits };
      const existing = currentSplits[cleanName] || {};

      const formattedExercises = exercises.map((ex) => ({
        exerciseId: ex.exerciseId || ex.id || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'Full Body',
        isCompound: ex.isCompound !== undefined ? ex.isCompound : false,
        defaultSets: ex.sets ? ex.sets.length : (ex.defaultSets || 3),
        defaultReps: ex.sets && ex.sets[0] ? Number(ex.sets[0].reps) || 10 : (ex.defaultReps || 10),
      }));

      currentSplits[cleanName] = {
        ...existing,
        name: cleanName,
        description: existing.description || `${formattedExercises.length} exercises configured`,
        color: existing.color || '#38BDF8',
        exercises: formattedExercises,
      };

      set({ splits: currentSplits });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentSplits));
      return true;
    } catch (e) {
      console.error('Failed to save split template:', e);
      return false;
    }
  },
}));
