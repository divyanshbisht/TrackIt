const mongoose = require('mongoose');

const PersonalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'default-user',
      index: true,
    },
    exerciseId: {
      type: String,
      required: true,
      index: true,
    },
    exerciseName: {
      type: String,
      required: true,
    },
    maxWeight: {
      type: Number,
      required: true,
    },
    repsAtMax: {
      type: Number,
      required: true,
    },
    achievedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on userId + exerciseId to quickly fetch records per user and exercise
PersonalRecordSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

module.exports = mongoose.models.PersonalRecord || mongoose.model('PersonalRecord', PersonalRecordSchema);
