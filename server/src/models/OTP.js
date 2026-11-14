const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['SIGNUP', 'LOGIN', 'PASSWORD_RESET'],
      default: 'SIGNUP',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
