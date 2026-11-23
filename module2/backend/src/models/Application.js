import mongoose from '../../../../backend/node_modules/mongoose/index.js';

const applicationSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    proposal: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 3000
    },
    proposedBudget: {
      type: Number,
      min: 0
    },
    estimatedDays: {
      type: Number,
      min: 1
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

applicationSchema.index({ gigId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model('Application', applicationSchema);

