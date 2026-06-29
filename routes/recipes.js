import express from 'express';
import Recipe from '../models/Recipe.js';
import { verifyToken, verifyAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all recipes with filter + pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { status: 'active' };
    
    if (category && category !== 'All') {
      filter.category = { $in: Array.isArray(category) ? category : [category] };
    }

    if (search) {
      filter.$or = [
        { recipeName: { $regex: search, $options: 'i' } },
        { cuisineType: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likesCount: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Recipe.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      recipes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecipes: total,
        hasNext: skip + recipes.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get featured recipes
router.get('/featured', async (req, res) => {
  try {
    const recipes = await Recipe.find({ isFeatured: true, status: 'active' }).limit(6);
    res.json({ status: 'success', recipes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get popular recipes (most liked)
router.get('/popular', async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'active' }).sort({ likesCount: -1 }).limit(8);
    res.json({ status: 'success', recipes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get single recipe
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe || recipe.status === 'deleted') {
      return res.status(404).json({ status: 'error', message: 'Recipe not found.' });
    }
    res.json({ status: 'success', recipe });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create recipe
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Check recipe limit for non-premium users
    if (!user.isPremium && user.role !== 'admin') {
      const recipeCount = await Recipe.countDocuments({ 
        authorEmail: user.email, 
        status: 'active' 
      });
      if (recipeCount >= 2) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Free users can only add 2 recipes. Upgrade to Premium for unlimited recipes!',
          requiresPremium: true
        });
      }
    }

    const recipeData = {
      ...req.body,
      authorId: user._id,
      authorName: user.name,
      authorEmail: user.email
    };

    const recipe = await Recipe.create(recipeData);
    res.status(201).json({ status: 'success', message: 'Recipe created successfully!', recipe });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update recipe (owner or admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found.' });

    if (recipe.authorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized.' });
    }

    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ status: 'success', message: 'Recipe updated!', recipe: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete recipe (owner or admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found.' });

    if (recipe.authorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized.' });
    }

    await Recipe.findByIdAndUpdate(req.params.id, { status: 'deleted' });
    res.json({ status: 'success', message: 'Recipe deleted successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Like a recipe
router.patch('/:id/like', verifyToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ status: 'error', message: 'Recipe not found.' });

    const userEmail = req.user.email;
    const alreadyLiked = recipe.likedBy.includes(userEmail);

    if (alreadyLiked) {
      recipe.likedBy = recipe.likedBy.filter(e => e !== userEmail);
      recipe.likesCount = Math.max(0, recipe.likesCount - 1);
    } else {
      recipe.likedBy.push(userEmail);
      recipe.likesCount += 1;
    }

    await recipe.save();
    res.json({ 
      status: 'success', 
      liked: !alreadyLiked,
      likesCount: recipe.likesCount 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get user's own recipes
router.get('/user/mine', verifyToken, async (req, res) => {
  try {
    const recipes = await Recipe.find({ 
      authorEmail: req.user.email, 
      status: 'active' 
    }).sort({ createdAt: -1 });
    res.json({ status: 'success', recipes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;