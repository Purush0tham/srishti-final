import mongoose from 'mongoose';
import { MONGO_URI, warnIfMongoMissing } from './env.js';

export async function connectDB() {
  warnIfMongoMissing();

  try {
    const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB Connected:', conn.connection.host);
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}
