const mongoose = require('mongoose');

const assignmentAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },

    startedAt: { type: Date, required: true },
    dueAt: { type: Date },

    submittedAt: { type: Date },
    textAnswer: { type: String, default: '' },
  },
  { timestamps: true }
);

assignmentAttemptSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = { AssignmentAttempt: mongoose.model('AssignmentAttempt', assignmentAttemptSchema) };
