import mongoose from 'mongoose';

// Favorite Schema
const favoriteSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  addedAt: { type: Date, default: Date.now }
});

favoriteSchema.index({ userEmail: 1, recipeId: 1 }, { unique: true });

// Report Schema
const reportSchema = new mongoose.Schema({
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  reporterEmail: { type: String, required: true },
  reason: { 
    type: String, 
    required: true,
    enum: ['Spam', 'Offensive Content', 'Copyright Issue', 'Misleading', 'Other']
  },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' }
}, { timestamps: true });

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  type: { type: String, enum: ['premium', 'recipe'], default: 'premium' },
  transactionId: { type: String, required: true, unique: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
export const Report = mongoose.model('Report', reportSchema);
export const Payment = mongoose.model('Payment', paymentSchema);