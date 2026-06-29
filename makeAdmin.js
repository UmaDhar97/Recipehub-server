import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected!');

const result = await User.updateOne(
  { email: 'admin@recipehub.com' },
  { $set: { role: 'admin' } }
);

console.log('Result:', result);
process.exit(0);