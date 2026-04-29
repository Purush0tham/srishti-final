import mongoose from 'mongoose';
import { MONGO_URI, warnIfMongoMissing } from './env.js';

export async function connectDB() {
  warnIfMongoMissing();

  try {
    const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB Connected:', conn.connection.host);
    return true;
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    console.warn('Continuing without MongoDB persistence (degraded mode).');
    return false;
  }
}
