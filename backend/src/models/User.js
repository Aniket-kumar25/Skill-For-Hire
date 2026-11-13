import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  // A user has exactly one account type: student OR client.
  roles: { type: [{ type: String, enum: ['student', 'client'] }], required: true, default: ['student'], validate: { validator: value => Array.isArray(value) && value.length === 1, message: 'An account must have exactly one role.' } }
}, { timestamps: true });

userSchema.pre('validate', function(next) {
  // Safely normalize legacy accounts that previously enabled both workspaces.
  if (!Array.isArray(this.roles) || this.roles.length === 0) this.roles = ['student'];
  if (this.roles.length > 1) this.roles = [this.roles.includes(this.legacyActiveRole) ? this.legacyActiveRole : this.roles[0]];
  next();
});

export default mongoose.model('User', userSchema);
