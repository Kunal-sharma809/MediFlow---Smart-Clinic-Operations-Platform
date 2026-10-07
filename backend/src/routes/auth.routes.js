const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { generateTokens, REFRESH_SECRET, authenticateToken } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, clinicCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let query = { email: email.toLowerCase() };

    // If clinic code is provided, look up tenant first
    if (clinicCode) {
      const tenant = await Tenant.findOne({ code: clinicCode.toLowerCase() });
      if (tenant) {
        query.clinicId = tenant._id;
      }
    }

    const user = await User.findOne(query).populate('clinicId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or clinic code.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is deactivated.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    await logAuditAction({
      req: { ...req, user: { userId: user._id, name: user.name, role: user.role, clinicId: user.clinicId ? user.clinicId._id : null } },
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user._id,
      details: `User ${user.email} logged in successfully.`
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          clinic: user.clinicId ? {
            id: user.clinicId._id,
            name: user.clinicId.name,
            code: user.clinicId.code
          } : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register (Staff or Doctor onboarding within clinic)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, clinicId, specialization, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase(), clinicId: clinicId || null });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in the clinic.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      clinicId: clinicId || null,
      specialization: role === 'DOCTOR' ? specialization : undefined,
      phone
    });

    const { accessToken, refreshToken } = generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          clinicId: newUser.clinicId
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Expired or invalid refresh token.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate('clinicId').select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
