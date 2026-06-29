import express from 'express';
import Stripe from 'stripe';
import { Payment } from '../models/Others.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Create payment intent (Premium membership)
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount = 999, type = 'premium' } = req.body; // amount in cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        type
      }
    });

    res.json({ 
      status: 'success', 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Confirm payment & save transaction
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { transactionId, amount, type = 'premium', recipeId } = req.body;

    // Check for duplicate transaction
    const existing = await Payment.findOne({ transactionId });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Transaction already recorded.' });
    }

    const payment = await Payment.create({
      userEmail: req.user.email,
      userId: req.user._id,
      amount: amount / 100, // convert cents to dollars
      transactionId,
      type,
      recipeId: recipeId || undefined,
      paymentStatus: 'completed'
    });

    // Upgrade user to premium
    if (type === 'premium') {
      await User.findByIdAndUpdate(req.user._id, { isPremium: true });
    }

    res.json({ 
      status: 'success', 
      message: 'Payment successful! Premium activated.',
      payment 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get user's payment history
router.get('/my-payments', verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userEmail: req.user.email })
      .populate('recipeId', 'recipeName')
      .sort({ paidAt: -1 });
    res.json({ status: 'success', payments });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get purchased recipes for user
router.get('/purchased-recipes', verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ 
      userEmail: req.user.email,
      type: 'recipe',
      paymentStatus: 'completed'
    }).populate('recipeId');
    
    const recipes = payments.map(p => p.recipeId).filter(Boolean);
    res.json({ status: 'success', recipes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;