const express = require('express');
const { z } = require('zod');
const { Course } = require('../models/Course');
const { Lesson } = require('../models/Lesson');
const { Quiz } = require('../models/Quiz');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');

async function assertCanEditCourse(courseId, user) {
  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, 'Course not found');
  if (user.role === 'admin') return course;
  if (user.role === 'teacher' && String(course.ownerId) === String(user.sub)) return course;
  throw new HttpError(403, 'Forbidden');
}

function coursesRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  // Public list
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 });
      res.json({ courses });
    })
  );

  // Authenticated: get user's purchased courses
  router.get(
    '/my-courses',
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user.sub);
      if (!user) throw new HttpError(401, 'Unauthorized');

      const courseIds = [
        ...(user.purchasedCourseIds || []),
        ...(user.completedCourseIds || []),
        ...(user.activeCourseId ? [user.activeCourseId] : []),
      ];
      
      // Remove duplicates
      const uniqueIds = [...new Set(courseIds.map(id => String(id)))];
      
      const courses = await Course.find({ _id: { $in: uniqueIds } }).sort({ createdAt: -1 });
      res.json({ courses });
    })
  );

  // Public detail
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const course = await Course.findById(req.params.id);
      if (!course) throw new HttpError(404, 'Course not found');
      if (!course.isPublished) throw new HttpError(404, 'Course not found');

      const lessons = await Lesson.find({ courseId: course._id, isPublished: true }).sort({ order: 1, createdAt: 1 });
      const quizzes = await Quiz.find({ courseId: course._id, isPublished: true }).sort({ createdAt: -1 });

      res.json({ course, lessons, quizzes });
    })
  );

  // Student: start/enroll course (locks to a single active course)
  router.post(
    '/:id/start',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      const course = await Course.findById(req.params.id);
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      const user = await User.findById(req.user.sub);
      if (!user) throw new HttpError(401, 'Unauthorized');

      // Paid course gating: must be purchased unless price is 0
      const price = course.priceIdr || 0;
      if (price > 0) {
        const purchased = (user.purchasedCourseIds || []).some((x) => String(x) === String(course._id));
        if (!purchased) throw new HttpError(402, 'Course belum terbeli. Silakan checkout dulu.');
      }

      if (user.activeCourseId && String(user.activeCourseId) !== String(course._id)) {
        throw new HttpError(409, 'Selesaikan course aktif terlebih dahulu sebelum mulai course lain');
      }

      user.activeCourseId = course._id;
      await user.save();

      res.json({ ok: true, activeCourseId: user.activeCourseId });
    })
  );

  // Student: mark course as completed (unlocks taking other courses)
  router.post(
    '/:id/complete',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      const course = await Course.findById(req.params.id);
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      const user = await User.findById(req.user.sub);
      if (!user) throw new HttpError(401, 'Unauthorized');

      const already = (user.completedCourseIds || []).some((x) => String(x) === String(course._id));
      if (!already) user.completedCourseIds = [...(user.completedCourseIds || []), course._id];

      if (user.activeCourseId && String(user.activeCourseId) === String(course._id)) {
        user.activeCourseId = undefined;
      }
      await user.save();

      res.json({ ok: true, activeCourseId: user.activeCourseId || null, completedCourseIds: user.completedCourseIds || [] });
    })
  );

  // Teacher/Admin list own
  router.get(
    '/_manage/mine',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.sub };
      const courses = await Course.find(filter).sort({ createdAt: -1 });
      res.json({ courses });
    })
  );

  router.post(
    '/',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional().default(''),
        coverImageUrl: z.string().optional().default(''),
        priceIdr: z.coerce.number().int().min(0).optional().default(0),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const ownerId = req.user.role === 'admin' && req.body.ownerId ? req.body.ownerId : req.user.sub;
      const course = await Course.create({ ...data, ownerId });
      res.status(201).json({ course });
    })
  );

  router.put(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.id, req.user);
      const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional().default(''),
        coverImageUrl: z.string().optional().default(''),
        priceIdr: z.coerce.number().int().min(0).optional().default(0),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const course = await Course.findByIdAndUpdate(req.params.id, data, { new: true });
      res.json({ course });
    })
  );

  router.delete(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.id, req.user);
      await Lesson.deleteMany({ courseId: req.params.id });
      await Quiz.deleteMany({ courseId: req.params.id });
      await Course.findByIdAndDelete(req.params.id);
      res.status(204).end();
    })
  );

  // Lessons CRUD (teacher/admin)
  router.get(
    '/:courseId/lessons',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      const lessons = await Lesson.find({ courseId: req.params.courseId }).sort({ order: 1, createdAt: 1 });
      res.json({ lessons });
    })
  );

  router.post(
    '/:courseId/lessons',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      const schema = z.object({
        title: z.string().min(2),
        contentMarkdown: z.string().optional().default(''),
        contentHtml: z.string().optional().default(''),
        videoEmbedUrl: z.string().optional().default(''),
        attachments: z
          .array(
            z.object({
              type: z.enum(['link', 'file']),
              name: z.string().optional().default(''),
              url: z.string().min(1),
            })
          )
          .optional()
          .default([]),
        contentBlocks: z
          .array(
            z.object({
              type: z.enum(['video', 'content', 'attachments']),
              title: z.string().optional().default(''),
            })
          )
          .optional()
          .default([]),
        quizId: z.string().optional().nullable(),
        assignment: z
          .object({
            instructionsHtml: z.string().optional().default(''),
            openAt: z.coerce.date().optional(),
            closeAt: z.coerce.date().optional(),
            durationSec: z.coerce.number().optional(),
          })
          .optional(),
        order: z.coerce.number().optional().default(0),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const lesson = await Lesson.create({ ...data, courseId: req.params.courseId });
      res.status(201).json({ lesson });
    })
  );

  router.put(
    '/:courseId/lessons/:lessonId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      const schema = z.object({
        title: z.string().min(2),
        contentMarkdown: z.string().optional().default(''),
        contentHtml: z.string().optional().default(''),
        videoEmbedUrl: z.string().optional().default(''),
        attachments: z
          .array(
            z.object({
              type: z.enum(['link', 'file']),
              name: z.string().optional().default(''),
              url: z.string().min(1),
            })
          )
          .optional()
          .default([]),
        contentBlocks: z
          .array(
            z.object({
              type: z.enum(['video', 'content', 'attachments']),
              title: z.string().optional().default(''),
            })
          )
          .optional()
          .default([]),
        quizId: z.string().optional().nullable(),
        assignment: z
          .object({
            instructionsHtml: z.string().optional().default(''),
            openAt: z.coerce.date().optional(),
            closeAt: z.coerce.date().optional(),
            durationSec: z.coerce.number().optional(),
          })
          .optional(),
        order: z.coerce.number().optional().default(0),
        isPublished: z.coerce.boolean().optional().default(false),
      });
      const data = schema.parse(req.body);
      const lesson = await Lesson.findOneAndUpdate(
        { _id: req.params.lessonId, courseId: req.params.courseId },
        data,
        { new: true }
      );
      if (!lesson) throw new HttpError(404, 'Lesson not found');
      res.json({ lesson });
    })
  );

  router.delete(
    '/:courseId/lessons/:lessonId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await assertCanEditCourse(req.params.courseId, req.user);
      await Lesson.deleteOne({ _id: req.params.lessonId, courseId: req.params.courseId });
      res.status(204).end();
    })
  );

  return router;
}

module.exports = { coursesRouter };
