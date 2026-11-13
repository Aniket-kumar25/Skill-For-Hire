import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 800, default: '' },
  technologies: [{ type: String, trim: true, maxlength: 40 }],
  projectUrl: { type: String, trim: true, maxlength: 300, default: '' },
  imageUrl: { type: String, trim: true, maxlength: 500, default: '' }
}, { _id: true });

const studentProfileSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, trim: true, maxlength: 100, default: '' },
  headline: { type: String, trim: true, maxlength: 120, default: '' },
  bio: { type: String, trim: true, maxlength: 1000, default: '' },
  department: { type: String, trim: true, maxlength: 100, default: '' },
  studyYear: { type: String, enum: ['', '1st year', '2nd year', '3rd year', '4th year', 'Postgraduate'], default: '' },
  location: { type: String, trim: true, maxlength: 100, default: '' },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  avatarUrl: { type: String, trim: true, maxlength: 500, default: '' },
  skills: { type: [skillSchema], default: [] },
  portfolio: { type: [projectSchema], default: [] },
  availability: { type: String, enum: ['Available', 'Busy', 'Unavailable'], default: 'Available' },
  weeklyHours: { type: Number, min: 0, max: 80, default: 5 }
}, { timestamps: true });

export default mongoose.model('StudentProfile', studentProfileSchema);
