const Workout = require('../models/Workout');
const PersonalRecord = require('../models/PersonalRecord');
const { getDBStatus } = require('../config/db');

// In-memory store fallback if MongoDB is not connected during local testing
const inMemoryStore = {
  workouts: [],
  prs: new Map(), // key: exerciseId -> pr document
};

/**
 * Helper to get user ID from request headers or body or default
 */
const getUserId = (req) => {
  return req.user?.id || req.headers['x-user-id'] || req.body?.userId || 'default-user';
};

/**
 * GET /api/workouts/previous-performance?exerciseId=xyz
 * Returns the most recent completed sets for this exercise (for ghost placeholders)
 */
exports.getPreviousPerformance = async (req, res) => {
  try {
    const exerciseId = req.query.exerciseId;
    const userId = getUserId(req);

    if (!exerciseId) {
      return res.status(400).json({ error: 'exerciseId query parameter is required' });
    }

    if (getDBStatus()) {
      // Find latest completed workout that contains this exercise
      const latestWorkout = await Workout.findOne({
        userId,
        'exercises.exerciseId': exerciseId,
      })
        .sort({ date: -1 })
        .lean();

      if (!latestWorkout) {
        return res.status(200).json({ success: true, sets: [] });
      }

      const matchingExercise = latestWorkout.exercises.find(
        (ex) => ex.exerciseId === exerciseId
      );

      const completedSets = (matchingExercise?.sets || []).filter((s) => s.isCompleted);
      return res.status(200).json({
        success: true,
        date: latestWorkout.date,
        sets: completedSets,
      });
    }

    // In-memory fallback
    const matchingWorkout = [...inMemoryStore.workouts]
      .reverse()
      .find((w) => w.userId === userId && w.exercises?.some((e) => e.exerciseId === exerciseId));

    if (!matchingWorkout) {
      return res.status(200).json({ success: true, sets: [] });
    }

    const ex = matchingWorkout.exercises.find((e) => e.exerciseId === exerciseId);
    const completedSets = (ex?.sets || []).filter((s) => s.isCompleted);
    return res.status(200).json({
      success: true,
      date: matchingWorkout.date,
      sets: completedSets,
    });
  } catch (error) {
    console.error('[Previous Performance Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve previous performance' });
  }
};

/**
 * POST /api/workouts/complete
 * Saves the completed workout, checks for PRs, and updates/creates records.
 */
exports.completeWorkout = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { splitName, durationSeconds, exercises, date } = req.body;

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Workout must contain at least one exercise' });
    }

    const workoutData = {
      userId,
      splitName: splitName || 'Custom',
      durationSeconds: durationSeconds || 0,
      date: date ? new Date(date) : new Date(),
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'Other',
        sets: (ex.sets || []).map((s, idx) => ({
          setNumber: s.setNumber || idx + 1,
          type: s.type || 'regular',
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          isCompleted: Boolean(s.isCompleted),
        })),
      })),
    };

    const newPRs = [];

    if (getDBStatus()) {
      // 1. Save Workout to MongoDB
      const savedWorkout = await Workout.create(workoutData);

      // 2. Evaluate PRs for each completed set
      for (const exercise of workoutData.exercises) {
        const completedSets = exercise.sets.filter((s) => s.isCompleted && s.weight > 0);
        if (completedSets.length === 0) continue;

        // Find current best set in this session for this exercise
        const sessionBest = completedSets.reduce((prev, current) => {
          if (current.weight > prev.weight) return current;
          if (current.weight === prev.weight && current.reps > prev.reps) return current;
          return prev;
        });

        // Check against existing PR in database
        const existingPR = await PersonalRecord.findOne({
          userId,
          exerciseId: exercise.exerciseId,
        });

        const isNewRecord =
          !existingPR ||
          sessionBest.weight > existingPR.maxWeight ||
          (sessionBest.weight === existingPR.maxWeight && sessionBest.reps > existingPR.repsAtMax);

        if (isNewRecord) {
          const prDoc = await PersonalRecord.findOneAndUpdate(
            { userId, exerciseId: exercise.exerciseId },
            {
              userId,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.name,
              maxWeight: sessionBest.weight,
              repsAtMax: sessionBest.reps,
              achievedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.name,
            maxWeight: sessionBest.weight,
            repsAtMax: sessionBest.reps,
            previousWeight: existingPR ? existingPR.maxWeight : 0,
            achievedAt: prDoc.achievedAt,
          });
        }
      }

      return res.status(201).json({
        success: true,
        workout: savedWorkout,
        newPRs,
      });
    }

    // In-memory fallback
    const inMemWorkout = { ...workoutData, _id: 'mem_' + Date.now() };
    inMemoryStore.workouts.push(inMemWorkout);

    for (const exercise of workoutData.exercises) {
      const completedSets = exercise.sets.filter((s) => s.isCompleted && s.weight > 0);
      if (completedSets.length === 0) continue;

      const sessionBest = completedSets.reduce((prev, current) => {
        if (current.weight > prev.weight) return current;
        if (current.weight === prev.weight && current.reps > prev.reps) return current;
        return prev;
      });

      const existingPR = inMemoryStore.prs.get(`${userId}:${exercise.exerciseId}`);
      const isNewRecord =
        !existingPR ||
        sessionBest.weight > existingPR.maxWeight ||
        (sessionBest.weight === existingPR.maxWeight && sessionBest.reps > existingPR.repsAtMax);

      if (isNewRecord) {
        const prEntry = {
          userId,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.name,
          maxWeight: sessionBest.weight,
          repsAtMax: sessionBest.reps,
          achievedAt: new Date(),
        };
        inMemoryStore.prs.set(`${userId}:${exercise.exerciseId}`, prEntry);
        newPRs.push({
          ...prEntry,
          previousWeight: existingPR ? existingPR.maxWeight : 0,
        });
      }
    }

    return res.status(201).json({
      success: true,
      workout: inMemWorkout,
      newPRs,
    });
  } catch (error) {
    console.error('[Complete Workout Error]:', error);
    return res.status(500).json({ error: 'Failed to complete workout' });
  }
};

/**
 * GET /api/workouts/history
 * Returns all completed workouts for the user sorted by date descending.
 */
exports.getWorkoutHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (getDBStatus()) {
      const workouts = await Workout.find({ userId })
        .sort({ date: -1 })
        .lean();
      return res.status(200).json({ success: true, workouts });
    }

    // In-memory fallback
    const workouts = inMemoryStore.workouts
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, workouts });
  } catch (error) {
    console.error('[Get History Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve workout history' });
  }
};

/**
 * DELETE /api/workouts/:id
 */
exports.deleteWorkout = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (getDBStatus()) {
      await Workout.findOneAndDelete({ _id: id, userId });
    } else {
      inMemoryStore.workouts = inMemoryStore.workouts.filter(
        (w) => !(w._id === id && w.userId === userId)
      );
    }

    return res.status(200).json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    console.error('[Delete Workout Error]:', error);
    return res.status(500).json({ error: 'Failed to delete workout' });
  }
};

/**
 * GET /api/workouts/prs
 * Returns all records from PersonalRecord sorted by achievedAt descending.
 */
exports.getPersonalRecords = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (getDBStatus()) {
      const records = await PersonalRecord.find({ userId })
        .sort({ achievedAt: -1 })
        .lean();
      return res.status(200).json({ success: true, records });
    }

    // In-memory fallback
    const records = Array.from(inMemoryStore.prs.values())
      .filter((pr) => pr.userId === userId)
      .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));

    return res.status(200).json({ success: true, records });
  } catch (error) {
    console.error('[Get PRs Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve personal records' });
  }
};

/**
 * POST /api/workouts/sync
 * Bulk syncs an array of offline completed workouts into MongoDB.
 */
exports.syncOfflineWorkouts = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { workouts } = req.body;

    if (!workouts || !Array.isArray(workouts)) {
      return res.status(400).json({ error: 'Array of workouts required for sync' });
    }

    const syncedPRs = [];
    let syncedCount = 0;

    for (const w of workouts) {
      // Format workout
      const wData = {
        userId,
        splitName: w.splitName || 'Synced Routine',
        durationSeconds: w.durationSeconds || 0,
        date: w.date ? new Date(w.date) : new Date(),
        exercises: (w.exercises || []).map((ex) => ({
          exerciseId: ex.exerciseId || ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup || 'Other',
          sets: (ex.sets || []).map((s, idx) => ({
            setNumber: s.setNumber || idx + 1,
            type: s.type || 'regular',
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            isCompleted: Boolean(s.isCompleted),
          })),
        })),
      };

      if (getDBStatus()) {
        await Workout.create(wData);

        for (const exercise of wData.exercises) {
          const completedSets = exercise.sets.filter((s) => s.isCompleted && s.weight > 0);
          for (const s of completedSets) {
            const existing = await PersonalRecord.findOne({ userId, exerciseId: exercise.exerciseId });
            if (!existing || s.weight > existing.maxWeight) {
              const updated = await PersonalRecord.findOneAndUpdate(
                { userId, exerciseId: exercise.exerciseId },
                {
                  userId,
                  exerciseId: exercise.exerciseId,
                  exerciseName: exercise.name,
                  maxWeight: s.weight,
                  repsAtMax: s.reps,
                  achievedAt: wData.date,
                },
                { upsert: true, new: true }
              );
              syncedPRs.push(updated);
            }
          }
        }
      }
      syncedCount++;
    }

    return res.status(200).json({
      success: true,
      syncedCount,
      syncedPRs,
    });
  } catch (error) {
    console.error('[Sync Offline Workouts Error]:', error);
    return res.status(500).json({ error: 'Failed to sync offline workouts' });
  }
};
