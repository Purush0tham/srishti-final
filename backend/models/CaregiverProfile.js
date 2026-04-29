import mongoose from 'mongoose';

const caregiverProfileSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true, index: true },
    fatigue_count: { type: Number, default: 0 },
    overwhelm_count: { type: Number, default: 0 },
    isolation_count: { type: Number, default: 0 },
    unsaid_count: { type: Number, default: 0 },
    last_updated: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('CaregiverProfile', caregiverProfileSchema);
