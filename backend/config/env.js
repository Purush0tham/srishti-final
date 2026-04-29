import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3001;
export const MONGO_URI = process.env.MONGO_URI || '';

export function warnIfMongoMissing() {
  if (!MONGO_URI || !MONGO_URI.startsWith('mongodb://')) {
    console.warn('\nWARNING: MONGO_URI not set correctly in backend/.env');
    console.warn('Use a non-SRV Mongo URI that starts with mongodb://');
  }
}
