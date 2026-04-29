import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user_input: { type: String, required: true },
  analysis: { type: Object, default: {} },
  response: { type: String, default: '' },
});

const stressTrendSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  level: { type: String, enum: ['low', 'medium', 'high'], required: true },
});

const sessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true, index: true },
    messages: [messageSchema],
    memory: {
      repeated_keywords: { type: [String], default: [] },
      stress_trend: { type: [stressTrendSchema], default: [] },
      weekly_summary: { type: String, default: '' },
      window_start: { type: Date, default: Date.now },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('Session', sessionSchema);
