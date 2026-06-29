import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  recipeName: { type: String, required: true, trim: true },
  recipeImage: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Appetizer', 'Dessert', 'Snack', 'Beverage', 'Salad', 'Soup', 'Vegan']
  },
  cuisineType: { type: String, required: true },
  difficultyLevel: { 
    type: String, 
    required: true, 
    enum: ['Easy', 'Medium', 'Hard'] 
  },
  preparationTime: { type: Number, required: true },
  ingredients: [{ type: String, required: true }],
  instructions: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  likesCount: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isPurchased: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' }
}, { timestamps: true });

recipeSchema.index({ category: 1, recipeName: 'text', cuisineType: 'text' });

export default mongoose.model('Recipe', recipeSchema);