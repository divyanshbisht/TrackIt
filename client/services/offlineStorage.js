import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = 'TRACKIT_LOCAL_WORKOUTS';
const PRS_KEY = 'TRACKIT_LOCAL_PRS';

/**
 * Retrieve all locally saved workouts
 */
export async function getLocalWorkouts() {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to get local workouts:', err);
    return [];
  }
}

/**
 * Retrieve all locally saved personal records
 */
export async function getLocalPRs() {
  try {
    const data = await AsyncStorage.getItem(PRS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to get local PRs:', err);
    return [];
  }
}

/**
 * Find the most recent performance sets for a given exercise from local history
 */
export async function getPreviousPerformanceLocally(exerciseId) {
  try {
    const workouts = await getLocalWorkouts();
    // Most recent first
    const reversed = [...workouts].reverse();
    for (const w of reversed) {
      const match = (w.exercises || []).find((e) => (e.exerciseId || e.id) === exerciseId);
      if (match && match.sets && match.sets.length > 0) {
        const completed = match.sets.filter((s) => s.isCompleted);
        if (completed.length > 0) {
          return completed;
        }
      }
    }
    return [];
  } catch (err) {
    console.error('Failed to get local previous performance:', err);
    return [];
  }
}

/**
 * Check completed sets in workout against local PRs, save new PRs, and return newPRs list
 */
export async function checkAndUpdateLocalPRs(workout) {
  try {
    const existingPRs = await getLocalPRs();
    const prMap = new Map(existingPRs.map((pr) => [pr.exerciseId, pr]));
    const newPRs = [];

    for (const exercise of workout.exercises || []) {
      const exId = exercise.exerciseId || exercise.id;
      const completedSets = (exercise.sets || []).filter((s) => s.isCompleted && Number(s.weight) > 0);
      if (completedSets.length === 0) continue;

      const sessionBest = completedSets.reduce((best, curr) => {
        const wCurr = Number(curr.weight) || 0;
        const wBest = Number(best.weight) || 0;
        const rCurr = Number(curr.reps) || 0;
        const rBest = Number(best.reps) || 0;

        if (wCurr > wBest) return curr;
        if (wCurr === wBest && rCurr > rBest) return curr;
        return best;
      });

      const bestWeight = Number(sessionBest.weight) || 0;
      const bestReps = Number(sessionBest.reps) || 0;
      const existing = prMap.get(exId);

      const isRecord =
        !existing ||
        bestWeight > existing.maxWeight ||
        (bestWeight === existing.maxWeight && bestReps > existing.repsAtMax);

      if (isRecord) {
        const newRecord = {
          exerciseId: exId,
          exerciseName: exercise.name,
          maxWeight: bestWeight,
          repsAtMax: bestReps,
          previousWeight: existing ? existing.maxWeight : 0,
          achievedAt: workout.date || new Date().toISOString(),
        };

        prMap.set(exId, newRecord);
        newPRs.push(newRecord);
      }
    }

    const updatedPRsList = Array.from(prMap.values()).sort(
      (a, b) => new Date(b.achievedAt) - new Date(a.achievedAt)
    );
    await AsyncStorage.setItem(PRS_KEY, JSON.stringify(updatedPRsList));

    return newPRs;
  } catch (err) {
    console.error('Failed to check and update local PRs:', err);
    return [];
  }
}

/**
 * Save completed workout locally and evaluate PRs
 */
export async function saveWorkoutLocally(workoutData) {
  try {
    const workouts = await getLocalWorkouts();
    const record = {
      ...workoutData,
      _id: 'local_' + Date.now(),
      date: workoutData.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    workouts.push(record);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));

    const newPRs = await checkAndUpdateLocalPRs(record);

    return {
      success: true,
      workout: record,
      newPRs,
    };
  } catch (err) {
    console.error('Failed to save workout locally:', err);
    throw err;
  }
}

/**
 * Delete a single local workout by ID
 */
export async function deleteLocalWorkout(workoutId) {
  try {
    const workouts = await getLocalWorkouts();
    const updated = workouts.filter((w) => (w._id || w.id) !== workoutId);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Failed to delete local workout:', err);
    return false;
  }
}

/**
 * Clear local workout history (e.g., after full cloud migration if requested)
 */
export async function clearLocalWorkouts() {
  try {
    await AsyncStorage.removeItem(WORKOUTS_KEY);
  } catch (err) {
    console.error('Failed to clear local workouts:', err);
  }
}
