const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['regular', 'warmup', 'drop', 'failure'],
      default: 'regular',
    },
    weight: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const WorkoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    muscleGroup: {
      type: String,
      default: 'Other',
    },
    sets: [SetSchema],
  },
  { _id: false }
);

const WorkoutSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'default-user',
      index: true,
    },
    splitName: {
      type: String,
      default: 'Custom',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    exercises: [WorkoutExerciseSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Workout || mongoose.model('Workout', WorkoutSchema);
