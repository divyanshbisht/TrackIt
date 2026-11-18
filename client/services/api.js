import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  saveWorkoutLocally,
  getPreviousPerformanceLocally,
  getLocalPRs,
  getLocalWorkouts,
  deleteLocalWorkout,
} from './offlineStorage';

import { useAuthStore } from '../store/useAuthStore';

/**
 * Creates an Axios client pointing to the user's configured backend API base URL
 */
function getClient() {
  const baseUrl = useSettingsStore.getState().apiBaseUrl || 'http://localhost:5000';
  const authState = useAuthStore.getState();
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': authState.user?.id || 'default-user',
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  return axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers,
  });
}

/**
 * Parse natural language single-line routine using OpenAI structured backend
 */
export async function parseWorkoutAI(rawInput) {
  const client = getClient();
  const response = await client.post('/api/ai/parse-workout', { rawInput });
  if (response.data && response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data?.error || 'Failed to parse workout');
}

/**
 * Complete a workout session
 * Writes to local storage first, then attempts cloud sync if in Online/Smart AI mode
 */
export async function completeWorkoutSession(workoutData, mode) {
  // Always save locally first to ensure data integrity
  const localResult = await saveWorkoutLocally(workoutData);

  if (mode === 'OFFLINE') {
    return localResult;
  }

  // Attempt backend persistence for Online & Smart AI modes
  try {
    const client = getClient();
    const response = await client.post('/api/workouts/complete', workoutData);
    if (response.data && response.data.success) {
      return {
        success: true,
        workout: response.data.workout,
        newPRs: response.data.newPRs || localResult.newPRs,
      };
    }
  } catch (netErr) {
    console.warn('[API Warning] Cloud sync failed during completeWorkoutSession. Preserved locally:', netErr.message);
  }

  return localResult;
}

/**
 * Retrieve previous performance sets for progressive overload target
 */
export async function fetchPreviousPerformance(exerciseId, mode) {
  if (mode === 'OFFLINE') {
    return await getPreviousPerformanceLocally(exerciseId);
  }

  try {
    const client = getClient();
    const response = await client.get('/api/workouts/previous-performance', {
      params: { exerciseId },
    });
    if (response.data && response.data.success) {
      if (response.data.sets && response.data.sets.length > 0) {
        return response.data.sets;
      }
    }
  } catch (err) {
    console.warn('[API Warning] Cloud fetch previous performance failed, checking local:', err.message);
  }

  // Fallback to local history
  return await getPreviousPerformanceLocally(exerciseId);
}

/**
 * Retrieve all Personal Records
 */
export async function fetchPersonalRecords(mode) {
  if (mode === 'OFFLINE') {
    return await getLocalPRs();
  }

  try {
    const client = getClient();
    const response = await client.get('/api/workouts/prs');
    if (response.data && response.data.success && response.data.records) {
      return response.data.records;
    }
  } catch (err) {
    console.warn('[API Warning] Cloud fetch PRs failed, checking local:', err.message);
  }

  return await getLocalPRs();
}

/**
 * Sync local workouts to cloud
 */
export async function syncLocalWorkoutsToCloud(workouts) {
  const client = getClient();
  const response = await client.post('/api/workouts/sync', { workouts });
  return response.data;
}

/**
 * Retrieve all past completed workouts
 */
export async function fetchWorkoutHistory(mode) {
  if (mode === 'OFFLINE') {
    const local = await getLocalWorkouts();
    return [...local].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  try {
    const client = getClient();
    const response = await client.get('/api/workouts/history');
    if (response.data && response.data.success && response.data.workouts) {
      return response.data.workouts;
    }
  } catch (err) {
    console.warn('[API Warning] Cloud fetch history failed, using local:', err.message);
  }

  const local = await getLocalWorkouts();
  return [...local].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Delete a past completed workout session
 */
export async function deleteWorkoutSession(workoutId, mode) {
  await deleteLocalWorkout(workoutId);

  if (mode !== 'OFFLINE') {
    try {
      const client = getClient();
      await client.delete(`/api/workouts/${workoutId}`);
    } catch (e) {
      console.warn('[API Warning] Cloud delete failed:', e.message);
    }
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth() {
  try {
    const client = getClient();
    const res = await client.get('/api/health', { timeout: 3000 });
    return res.data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Fetch AI Strength Coach insights, plateau detection, and progressive overload prescriptions
 */
export async function fetchCoachInsights(activeSplit, mode) {
  try {
    const client = getClient();
    const localWorkouts = await getLocalWorkouts().catch(() => []);
    const localPRs = await getLocalPRs().catch(() => []);

    const response = await client.post('/api/ai/coach-insights', {
      activeSplit,
      localWorkouts,
      localPRs,
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
  } catch (err) {
    console.warn(
      '[Coach API Warning] Cloud fetch coach insights failed, using local fallback:',
      err.message
    );
  }

  // Pure offline fallback generator if server is completely unreachable
  const localWorkouts = await getLocalWorkouts().catch(() => []);
  const localPRs = await getLocalPRs().catch(() => []);
  return {
    status: localWorkouts.length > 0 ? 'optimal' : 'getting_started',
    headline: localWorkouts.length > 0 ? 'Progressive Overload Active' : 'Welcome to TrackIt AI Coach',
    overview:
      localWorkouts.length > 0
        ? `Tracking ${localWorkouts.length} local session(s). Focus on consistent rep cadence and progressive overload.`
        : 'Complete your first workout to unlock automated plateau detection and volume balancing.',
    plateauAlerts: [],
    volumeBalance: {
      pushSets: 0,
      pullSets: 0,
      legsSets: 0,
      summary: 'Keep balanced training across push, pull, and leg movements.',
    },
    todayTarget: {
      splitFocus: activeSplit || 'Active Split',
      keyExercise: 'Primary Lift',
      recommendedAction: `Focus on progressive overload for today's ${activeSplit || 'session'}.`,
    },
    prsHighlighted: localPRs.slice(0, 3).map((p) => `${p.exerciseName}: ${p.maxWeight}kg`),
  };
}
