const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');

// GET /api/workouts/previous-performance?exerciseId=xyz
router.get('/previous-performance', workoutController.getPreviousPerformance);

// POST /api/workouts/complete
router.post('/complete', workoutController.completeWorkout);

// GET /api/workouts/history
router.get('/history', workoutController.getWorkoutHistory);

// DELETE /api/workouts/:id
router.delete('/:id', workoutController.deleteWorkout);

// GET /api/workouts/prs
router.get('/prs', workoutController.getPersonalRecords);

// POST /api/workouts/sync
router.post('/sync', workoutController.syncOfflineWorkouts);

module.exports = router;
