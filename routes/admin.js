import express from 'express';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import { Report, Payment } from '../models/Others.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const [totalUsers, totalRecipes, totalPremium, totalReports, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Recipe.countDocuments({ status: 'active' }),
      User.countDocuments({ isPremium: true }),
      Report.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      status: 'success',
      stats: {
        totalUsers,
        totalRecipes,
        totalPremium,
        totalReports,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all users (with pagination)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      users,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Block / unblock user
router.patch('/users/:id/block', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot block admin.' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ status: 'success', message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.`, isBlocked: user.isBlocked });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Make admin
router.patch('/users/:id/make-admin', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true });
    res.json({ status: 'success', message: 'User promoted to admin.', user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all recipes (admin view)
router.get('/recipes', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { status: 'active' };
    if (search) {
      filter.$or = [
        { recipeName: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } }
      ];
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Recipe.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      recipes,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Toggle featured recipe
router.patch('/recipes/:id/feature', verifyAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found.' });
    recipe.isFeatured = !recipe.isFeatured;
    await recipe.save();
    res.json({ status: 'success', message: `Recipe ${recipe.isFeatured ? 'featured' : 'unfeatured'}.`, isFeatured: recipe.isFeatured });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Admin delete recipe
router.delete('/recipes/:id', verifyAdmin, async (req, res) => {
  try {
    await Recipe.findByIdAndUpdate(req.params.id, { status: 'deleted' });
    res.json({ status: 'success', message: 'Recipe deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Admin edit recipe
router.put('/recipes/:id', verifyAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ status: 'success', message: 'Recipe updated.', recipe });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all reports
router.get('/reports', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reports, total] = await Promise.all([
      Report.find().populate('recipeId', 'recipeName recipeImage').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Report.countDocuments()
    ]);

    res.json({
      status: 'success',
      reports,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Dismiss report
router.patch('/reports/:id/dismiss', verifyAdmin, async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { status: 'dismissed' });
    res.json({ status: 'success', message: 'Report dismissed.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Remove recipe from report
router.patch('/reports/:id/remove-recipe', verifyAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    
    await Recipe.findByIdAndUpdate(report.recipeId, { status: 'deleted' });
    await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' });
    res.json({ status: 'success', message: 'Recipe removed and report resolved.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all transactions
router.get('/transactions', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find().sort({ paidAt: -1 }).skip(skip).limit(parseInt(limit)),
      Payment.countDocuments()
    ]);

    res.json({
      status: 'success',
      payments,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;