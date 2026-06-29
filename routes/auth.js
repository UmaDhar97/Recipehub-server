import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Password must be at least 6 characters with one uppercase and one lowercase letter.' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ status: 'error', message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name, email, password: hashedPassword, 
      image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e85d04&color=fff`,
      provider: 'credentials'
    });

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully!',
      token,
      user: { _id: user._id, name: user.name, email: user.email, image: user.image, role: user.role, isPremium: user.isPremium }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ status: 'error', message: 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ status: 'error', message: 'Your account has been blocked.' });
    }

    if (!user.password) {
      return res.status(401).json({ status: 'error', message: 'Please use Google login for this account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.json({
      status: 'success',
      message: 'Login successful!',
      token,
      user: { _id: user._id, name: user.name, email: user.email, image: user.image, role: user.role, isPremium: user.isPremium }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Login failed.' });
  }
});

// Google OAuth login/register
router.post('/google', async (req, res) => {
  try {
    const { name, email, image } = req.body;

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required.' });
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({ 
        name, email, 
        image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e85d04&color=fff`,
        provider: 'google' 
      });
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ status: 'error', message: 'Your account has been blocked.' });
      }
      user.image = image || user.image;
      await user.save();
    }

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    res.json({
      status: 'success',
      message: 'Google login successful!',
      token,
      user: { _id: user._id, name: user.name, email: user.email, image: user.image, role: user.role, isPremium: user.isPremium }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ status: 'error', message: 'Google authentication failed.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  res.json({ status: 'success', message: 'Logged out successfully.' });
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  res.json({ status: 'success', user: req.user });
});

// Verify token (for frontend route protection)
router.get('/verify', verifyToken, (req, res) => {
  res.json({ status: 'success', valid: true, user: req.user });
});

export default router;