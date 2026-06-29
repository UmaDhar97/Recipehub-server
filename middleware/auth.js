import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found.' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ status: 'error', message: 'Account has been blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Token expired.' });
    }
    return res.status(401).json({ status: 'error', message: 'Invalid token.' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  await verifyToken(req, res, async () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Access denied. Admin only.' });
    }
    next();
  });
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      req.user = user;
    }
  } catch (error) {
    // Optional auth - continue without user
  }
  next();
};