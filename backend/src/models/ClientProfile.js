import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 120 },
  companyName: { type: String, trim: true, maxlength: 120, default: '' },
  clientType: { type: String, enum: ['Individual', 'Startup', 'Company', 'Educational institution', 'Non-profit', 'Other'], default: 'Individual' },
  industry: { type: String, trim: true, maxlength: 100, default: '' },
  bio: { type: String, trim: true, maxlength: 1200, default: '' },
  website: { type: String, trim: true, maxlength: 300, default: '' },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  contactPhone: { type: String, trim: true, maxlength: 30, default: '' }
}, { timestamps: true });
export default mongoose.model('ClientProfile', schema);
