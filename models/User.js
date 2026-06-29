import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  image: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  provider: { type: String, default: 'credentials' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);