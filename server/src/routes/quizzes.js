const express = require('express');
const { z } = require('zod');
const { Course } = require('../models/Course');
const { Quiz, Question } = require('../models/Quiz');
const { Attempt } = require('../models/Attempt');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');

async function assertStudentCanAccessCourse(courseId, userPayload) {
  if (!userPayload || userPayload.role !== 'student') return;
  const user = await User.findById(userPayload.sub).select('activeCourseId');
  if (!user) throw new HttpError(401, 'Unauthorized');
  if (!user.activeCourseId) {
    throw new HttpError(409, 'Mulai course terlebih dahulu sebelum mengerjakan quiz');
  }
  if (String(user.activeCourseId) !== String(courseId)) {
    throw new HttpError(409, 'Selesaikan course aktif terlebih dahulu sebelum mengerjakan quiz course lain');
  }
}

async function assertCanEditCourse(courseId, user) {
  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, 'Course not found');
  if (user.role === 'admin') return course;
  if (user.role === 'teacher' && String(course.ownerId) === String(user.sub)) return course;
  throw new HttpError(403, 'Forbidden');
}

function quizzesRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  function shuffleCopy(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Teacher/Admin: list quizzes for a course
  router.get(
    '/course/:courseId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      const quizzes = await Quiz.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
      res.json({ quizzes });
    })
  );

  // Teacher/Admin: create quiz
  router.post(
    '/course/:courseId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional().default(''),
        timeLimitSec: z.coerce.number().optional().default(0),
        randomizeQuestions: z.coerce.boolean().optional().default(false),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const quiz = await Quiz.create({ ...data, courseId: req.params.courseId });
      res.status(201).json({ quiz });
    })
  );

  router.put(
    '/:quizId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional().default(''),
        timeLimitSec: z.coerce.number().optional().default(0),
        randomizeQuestions: z.coerce.boolean().optional().default(false),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const updated = await Quiz.findByIdAndUpdate(req.params.quizId, data, { new: true });
      res.json({ quiz: updated });
    })
  );

  router.delete(
    '/:quizId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      await Question.deleteMany({ quizId: quiz._id });
      await Attempt.deleteMany({ quizId: quiz._id });
      await Quiz.findByIdAndDelete(req.params.quizId);
      res.status(204).end();
    })
  );

  // Teacher/Admin: questions CRUD
  router.get(
    '/:quizId/questions',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });
      res.json({ questions });
    })
  );

  router.post(
    '/:quizId/questions',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      const schema = z
        .object({
          type: z.enum(['mcq', 'essay', 'matching']).optional().default('mcq'),
          prompt: z.string().optional().default(''),
          promptHtml: z.string().optional().default(''),
          choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional().default([]),
          correctChoiceId: z.string().optional().default(''),
          pairs: z
            .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
            .optional()
            .default([]),
          rubric: z.string().optional().default(''),
          order: z.coerce.number().optional().default(0),
        })
        .superRefine((val, ctx) => {
          const promptOk = (val.promptHtml && val.promptHtml.trim()) || (val.prompt && val.prompt.trim());
          if (!promptOk) ctx.addIssue({ code: 'custom', path: ['prompt'], message: 'prompt is required' });
          if (val.type === 'mcq') {
            if (!Array.isArray(val.choices) || val.choices.length < 2) {
              ctx.addIssue({ code: 'custom', path: ['choices'], message: 'choices must have at least 2 items' });
            }
            if (!val.correctChoiceId) {
              ctx.addIssue({ code: 'custom', path: ['correctChoiceId'], message: 'correctChoiceId is required' });
            }
          }
          if (val.type === 'matching') {
            if (!Array.isArray(val.pairs) || val.pairs.length < 2) {
              ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'pairs must have at least 2 items' });
            }
          }
        });
      const data = schema.parse(req.body);
      const question = await Question.create({ ...data, quizId: quiz._id });
      res.status(201).json({ question });
    })
  );

  router.put(
    '/:quizId/questions/:questionId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      const schema = z
        .object({
          type: z.enum(['mcq', 'essay', 'matching']).optional().default('mcq'),
          prompt: z.string().optional().default(''),
          promptHtml: z.string().optional().default(''),
          choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional().default([]),
          correctChoiceId: z.string().optional().default(''),
          pairs: z
            .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
            .optional()
            .default([]),
          rubric: z.string().optional().default(''),
          order: z.coerce.number().optional().default(0),
        })
        .superRefine((val, ctx) => {
          const promptOk = (val.promptHtml && val.promptHtml.trim()) || (val.prompt && val.prompt.trim());
          if (!promptOk) ctx.addIssue({ code: 'custom', path: ['prompt'], message: 'prompt is required' });
          if (val.type === 'mcq') {
            if (!Array.isArray(val.choices) || val.choices.length < 2) {
              ctx.addIssue({ code: 'custom', path: ['choices'], message: 'choices must have at least 2 items' });
            }
            if (!val.correctChoiceId) {
              ctx.addIssue({ code: 'custom', path: ['correctChoiceId'], message: 'correctChoiceId is required' });
            }
          }
          if (val.type === 'matching') {
            if (!Array.isArray(val.pairs) || val.pairs.length < 2) {
              ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'pairs must have at least 2 items' });
            }
          }
        });
      const data = schema.parse(req.body);

      const question = await Question.findOneAndUpdate(
        { _id: req.params.questionId, quizId: quiz._id },
        data,
        { new: true }
      );
      if (!question) throw new HttpError(404, 'Question not found');
      res.json({ question });
    })
  );

  router.delete(
    '/:quizId/questions/:questionId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) throw new HttpError(404, 'Quiz not found');
      await assertCanEditCourse(quiz.courseId, req.user);

      await Question.deleteOne({ _id: req.params.questionId, quizId: quiz._id });
      res.status(204).end();
    })
  );

  // Student: get quiz for play (published only)
  router.get(
    '/play/:quizId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz || !quiz.isPublished) throw new HttpError(404, 'Quiz not found');

      await assertStudentCanAccessCourse(quiz.courseId, req.user);

      const questionsRaw = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });
      const questions = quiz.randomizeQuestions ? shuffleCopy(questionsRaw) : questionsRaw;

      // Hide correct answers
      res.json({
        quiz: {
          _id: quiz._id,
          courseId: quiz.courseId,
          title: quiz.title,
          description: quiz.description,
          timeLimitSec: quiz.timeLimitSec,
          randomizeQuestions: Boolean(quiz.randomizeQuestions),
        },
        questions: questions.map((q) => ({
          _id: q._id,
          type: q.type || 'mcq',
          prompt: q.prompt,
          promptHtml: q.promptHtml,
          choices: q.type === 'mcq' ? q.choices : [],
          pairs: q.type === 'matching' ? q.pairs : [],
          order: q.order,
        })),
      });
    })
  );

  // Student: submit quiz
  router.post(
    '/play/:quizId/submit',
    requireAuth,
    asyncHandler(async (req, res) => {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz || !quiz.isPublished) throw new HttpError(404, 'Quiz not found');

      await assertStudentCanAccessCourse(quiz.courseId, req.user);

      const schema = z.object({
        answers: z.array(
          z.object({
            questionId: z.string().min(1),
            choiceId: z.string().optional(),
            textAnswer: z.string().optional(),
            matchingAnswer: z
              .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
              .optional(),
          })
        ),
      });
      const { answers } = schema.parse(req.body);

      const questions = await Question.find({ quizId: quiz._id });
      const byId = new Map(questions.map((q) => [String(q._id), q]));

      let score = 0;
      let maxScore = 0;

      for (const q of questions) {
        if ((q.type || 'mcq') === 'mcq') maxScore += 1;
      }

      for (const a of answers) {
        const q = byId.get(String(a.questionId));
        if (!q) continue;
        const type = q.type || 'mcq';
        if (type !== 'mcq') continue;
        if (q.correctChoiceId && a.choiceId && q.correctChoiceId === a.choiceId) score += 1;
      }

      const attempt = await Attempt.create({
        quizId: quiz._id,
        userId: req.user.sub,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          choiceId: a.choiceId,
          textAnswer: a.textAnswer,
          matchingAnswer: a.matchingAnswer,
        })),
        score,
        maxScore,
        submittedAt: new Date(),
      });

      res.json({
        attempt: {
          _id: attempt._id,
          score: attempt.score,
          maxScore: attempt.maxScore,
          submittedAt: attempt.submittedAt,
        },
      });
    })
  );

  // Student: my attempts
  router.get(
    '/:quizId/my-attempts',
    requireAuth,
    asyncHandler(async (req, res) => {
      const attempts = await Attempt.find({ quizId: req.params.quizId, userId: req.user.sub })
        .sort({ createdAt: -1 })
        .limit(20);
      res.json({ attempts });
    })
  );

  return router;
}

module.exports = { quizzesRouter };
