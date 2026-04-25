const mongoose = require('mongoose');

const ROLES = ['admin', 'teacher', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // username
    fullName: { type: String, trim: true }, // nama lengkap untuk sertifikat
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'student', index: true },

    // Profile informasi tambahan
    institution: { type: String, trim: true }, // Asal Lembaga/Instansi
    whatsappNumber: { type: String, trim: true }, // No Whatssapp
    referralSource: { type: String, trim: true }, // Dari mana tahunya
    reason: { type: String, trim: true }, // Alasan
    educationLevel: { type: String, trim: true }, // Pendidikan Terakhir

    activeCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    purchasedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    emailVerified: { type: Boolean, default: false, index: true },

    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
