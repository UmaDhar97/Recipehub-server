import express from 'express';
import { Favorite } from '../models/Others.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get user favorites
router.get('/', verifyToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userEmail: req.user.email })
      .populate('recipeId')
      .sort({ addedAt: -1 });
    res.json({ status: 'success', favorites });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Add to favorites
router.post('/', verifyToken, async (req, res) => {
  try {
    const { recipeId } = req.body;
    const existing = await Favorite.findOne({ userEmail: req.user.email, recipeId });
    
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Already in favorites.' });
    }

    const favorite = await Favorite.create({
      userEmail: req.user.email,
      userId: req.user._id,
      recipeId
    });

    res.status(201).json({ status: 'success', message: 'Added to favorites!', favorite });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Remove from favorites
router.delete('/:recipeId', verifyToken, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ 
      userEmail: req.user.email, 
      recipeId: req.params.recipeId 
    });
    res.json({ status: 'success', message: 'Removed from favorites.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Check if recipe is in favorites
router.get('/check/:recipeId', verifyToken, async (req, res) => {
  try {
    const fav = await Favorite.findOne({ 
      userEmail: req.user.email, 
      recipeId: req.params.recipeId 
    });
    res.json({ status: 'success', isFavorite: !!fav });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;