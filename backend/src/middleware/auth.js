const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'apexcare_super_secret_jwt_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'apexcare_super_secret_refresh_key_2026';

const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    clinicId: user.clinicId || null,
    email: user.email,
    name: user.name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Also support tenant header fallback if provided
  const headerTenantId = req.headers['x-tenant-id'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is missing or invalid.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // Set active clinicId (prefer token clinicId, or allow super admin header override)
    req.clinicId = decoded.clinicId || headerTenantId || null;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired access token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  REFRESH_SECRET,
  generateTokens,
  authenticateToken,
  authorizeRoles
};
