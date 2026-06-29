import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, image } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, image },
      { new: true, select: '-password' }
    );
    res.json({ status: 'success', message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get user stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const Recipe = (await import('../models/Recipe.js')).default;
    const { Favorite } = await import('../models/Others.js');
    
    const [myRecipes, myFavorites, totalLikes] = await Promise.all([
      Recipe.countDocuments({ authorEmail: req.user.email, status: 'active' }),
      Favorite.countDocuments({ userEmail: req.user.email }),
      Recipe.aggregate([
        { $match: { authorEmail: req.user.email, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ])
    ]);

    res.json({
      status: 'success',
      stats: {
        totalRecipes: myRecipes,
        totalFavorites: myFavorites,
        totalLikes: totalLikes[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;