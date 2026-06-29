import express from 'express';
import { Report } from '../models/Others.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Submit report
router.post('/', verifyToken, async (req, res) => {
  try {
    const { recipeId, reason, description } = req.body;

    const existing = await Report.findOne({ 
      recipeId, 
      reporterEmail: req.user.email,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'You have already reported this recipe.' });
    }

    const report = await Report.create({
      recipeId,
      reporterEmail: req.user.email,
      reason,
      description
    });

    res.status(201).json({ status: 'success', message: 'Recipe reported. Admin will review it.', report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;