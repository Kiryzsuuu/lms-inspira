const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: {
      type: [
        {
          questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
          choiceId: String,
          textAnswer: String,
          matchingAnswer: {
            type: [{ left: String, right: String }],
            default: undefined,
          },
        },
      ],
      default: [],
    },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

attemptSchema.index({ quizId: 1, userId: 1, createdAt: -1 });

module.exports = { Attempt: mongoose.model('Attempt', attemptSchema) };
