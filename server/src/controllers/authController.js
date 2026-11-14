const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { getDBStatus } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// In-memory store fallback if MongoDB is not connected
const inMemoryAuth = {
  users: new Map(), // email -> user doc
  otps: new Map(),  // email -> { otp, expiresAt, type }
};

/**
 * Generate secure 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/send-otp
 * Body: { email, type: 'SIGNUP' | 'LOGIN' }
 */
exports.sendOtp = async (req, res) => {
  try {
    const { email, type = 'SIGNUP' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If signing up, check if user already exists
    if (type === 'SIGNUP') {
      if (getDBStatus()) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({
            error: 'An account with this email already exists. Please sign in.',
          });
        }
      } else {
        if (inMemoryAuth.users.has(normalizedEmail)) {
          return res.status(400).json({
            error: 'An account with this email already exists. Please sign in.',
          });
        }
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (getDBStatus()) {
      // Remove any previous OTP for this email
      await OTP.deleteMany({ email: normalizedEmail });
      await OTP.create({
        email: normalizedEmail,
        otp,
        type,
        expiresAt,
      });
    } else {
      inMemoryAuth.otps.set(normalizedEmail, { otp, type, expiresAt });
    }

    console.log(`=========================================`);
    console.log(`🔑 [TrackIt Auth OTP] ${type} code for: ${normalizedEmail}`);
    console.log(`   OTP: ${otp} (Valid for 10 minutes)`);
    console.log(`=========================================`);

    return res.status(200).json({
      success: true,
      message: `6-digit verification code sent to ${normalizedEmail}`,
      devOtp: otp, // Returned for dev/testing convenience
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    return res.status(500).json({ error: 'Failed to send OTP code.' });
  }
};

/**
 * POST /api/auth/verify-otp-and-signup
 * Body: { name, email, password, otp }
 */
exports.verifyOtpAndSignup = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: 'Name, email, password, and OTP are all required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate OTP
    let isValidOtp = false;

    if (getDBStatus()) {
      const record = await OTP.findOne({
        email: normalizedEmail,
        otp: String(otp).trim(),
        expiresAt: { $gt: new Date() },
      });

      if (record) {
        isValidOtp = true;
        await OTP.deleteOne({ _id: record._id });
      }
    } else {
      const record = inMemoryAuth.otps.get(normalizedEmail);
      if (record && record.otp === String(otp).trim() && new Date() < record.expiresAt) {
        isValidOtp = true;
        inMemoryAuth.otps.delete(normalizedEmail);
      }
    }

    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP verification code.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (getDBStatus()) {
      const created = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: true,
      });

      user = {
        id: created._id.toString(),
        name: created.name,
        email: created.email,
        isVerified: created.isVerified,
      };
    } else {
      const id = 'user_' + Date.now();
      user = {
        id,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: true,
      };
      inMemoryAuth.users.set(normalizedEmail, user);
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created and verified successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error('[Verify & Signup Error]:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    return res.status(500).json({ error: 'Failed to complete signup verification.' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    if (getDBStatus()) {
      const found = await User.findOne({ email: normalizedEmail });
      if (!found) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, found.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      user = {
        id: found._id.toString(),
        name: found.name,
        email: found.email,
        isVerified: found.isVerified,
      };
    } else {
      const found = inMemoryAuth.users.get(normalizedEmail);
      if (!found) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, found.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      user = {
        id: found.id,
        name: found.name,
        email: found.email,
        isVerified: found.isVerified,
      };
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user,
      token,
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ error: 'Failed to sign in.' });
  }
};

/**
 * GET /api/auth/me
 * Returns authenticated user profile
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    return res.status(500).json({ error: 'Failed to get user profile.' });
  }
};
