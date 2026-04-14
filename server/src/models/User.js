const mongoose = require('mongoose');

const ROLES = ['admin', 'teacher', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'student', index: true },

    activeCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    purchasedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
