import mongoose from '../../../../backend/node_modules/mongoose/index.js';

const gigSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 5000
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    requiredSkills: {
      type: [String],
      required: true,
      validate: {
        validator: (skills) => Array.isArray(skills) && skills.length > 0,
        message: 'At least one required skill is required.'
      }
    },
    budgetMin: {
      type: Number,
      required: true,
      min: 0
    },
    budgetMax: {
      type: Number,
      required: true,
      min: 0
    },
    deadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'paused', 'closed'],
      default: 'open',
      index: true
    }
  },
  { timestamps: true }
);

gigSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

gigSchema.pre('validate', function (next) {
  if (
    typeof this.budgetMin === 'number' &&
    typeof this.budgetMax === 'number' &&
    this.budgetMax < this.budgetMin
  ) {
    this.invalidate('budgetMax', 'Maximum budget must be at least the minimum.');
  }
  next();
});

export default mongoose.models.Gig || mongoose.model('Gig', gigSchema);

