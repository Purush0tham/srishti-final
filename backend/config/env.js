import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3001;
export const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

export function warnIfMongoMissing() {
  if (!MONGO_URI || !MONGO_URI.startsWith('mongodb')) {
    console.warn('\n⚠️  WARNING: MONGODB_URI not set correctly in backend/.env');
    console.warn('   Provide your MongoDB Atlas connection string (starts with mongodb+srv://)');
    console.warn('   or local MongoDB URI (starts with mongodb://)');
  }
}
