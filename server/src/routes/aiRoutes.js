const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/parse-workout
router.post('/parse-workout', aiController.parseWorkout);

// GET /api/ai/coach-insights & POST /api/ai/coach-insights
router.get('/coach-insights', aiController.getCoachInsights);
router.post('/coach-insights', aiController.getCoachInsights);

module.exports = router;
