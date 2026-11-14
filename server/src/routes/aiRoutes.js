const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/parse-workout
router.post('/parse-workout', aiController.parseWorkout);

module.exports = router;
