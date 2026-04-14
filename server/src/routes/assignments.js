const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { Lesson } = require('../models/Lesson');
const { Course } = require('../models/Course');
const { User } = require('../models/User');
const { AssignmentAttempt } = require('../models/AssignmentAttempt');

async function assertStudentCanAccessCourse(courseId, userPayload) {
  if (!userPayload || userPayload.role !== 'student') return;
  const user = await User.findById(userPayload.sub).select('activeCourseId');
  if (!user) throw new HttpError(401, 'Unauthorized');
  if (!user.activeCourseId) {
    throw new HttpError(409, 'Mulai course terlebih dahulu sebelum mengerjakan assignment');
  }
  if (String(user.activeCourseId) !== String(courseId)) {
    throw new HttpError(409, 'Selesaikan course aktif terlebih dahulu sebelum mengerjakan assignment course lain');
  }
}

function computeAvailability(lesson) {
  const cfg = lesson.assignment || {};
  const now = new Date();
  const openAt = cfg.openAt ? new Date(cfg.openAt) : null;
  const closeAt = cfg.closeAt ? new Date(cfg.closeAt) : null;
  const isOpen = (!openAt || now >= openAt) && (!closeAt || now <= closeAt);
  return { now, openAt, closeAt, isOpen };
}

function assignmentsRouter({ requireAuth }) {
  const router = express.Router();

  // Get my assignment attempt for a lesson
  router.get(
    '/lessons/:lessonId/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const lesson = await Lesson.findById(req.params.lessonId);
      if (!lesson || !lesson.isPublished) throw new HttpError(404, 'Lesson not found');

      const course = await Course.findById(lesson.courseId);
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      await assertStudentCanAccessCourse(course._id, req.user);

      const attempt = await AssignmentAttempt.findOne({ userId: req.user.sub, lessonId: lesson._id });
      res.json({
        lessonId: lesson._id,
        assignment: lesson.assignment || null,
        attempt: attempt
          ? {
              startedAt: attempt.startedAt,
              dueAt: attempt.dueAt || null,
              submittedAt: attempt.submittedAt || null,
              textAnswer: attempt.textAnswer || '',
            }
          : null,
      });
    })
  );

  // Start assignment timer (creates attempt)
  router.post(
    '/lessons/:lessonId/start',
    requireAuth,
    asyncHandler(async (req, res) => {
      const lesson = await Lesson.findById(req.params.lessonId);
      if (!lesson || !lesson.isPublished) throw new HttpError(404, 'Lesson not found');

      const course = await Course.findById(lesson.courseId);
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      await assertStudentCanAccessCourse(course._id, req.user);

      const { isOpen, now, closeAt } = computeAvailability(lesson);
      if (!isOpen) throw new HttpError(409, 'Assignment belum dibuka / sudah ditutup');

      const durationSec = lesson.assignment?.durationSec;
      const dueAt = durationSec ? new Date(now.getTime() + Number(durationSec) * 1000) : null;

      const attempt = await AssignmentAttempt.findOneAndUpdate(
        { userId: req.user.sub, courseId: course._id, lessonId: lesson._id },
        { $setOnInsert: { startedAt: now, dueAt } },
        { upsert: true, new: true }
      );

      // Clamp dueAt to closeAt if both exist
      let effectiveDueAt = attempt.dueAt;
      if (effectiveDueAt && closeAt && effectiveDueAt > closeAt) effectiveDueAt = closeAt;

      res.json({
        ok: true,
        attempt: {
          startedAt: attempt.startedAt,
          dueAt: effectiveDueAt || null,
          submittedAt: attempt.submittedAt || null,
        },
      });
    })
  );

  // Submit assignment
  router.post(
    '/lessons/:lessonId/submit',
    requireAuth,
    asyncHandler(async (req, res) => {
      const lesson = await Lesson.findById(req.params.lessonId);
      if (!lesson || !lesson.isPublished) throw new HttpError(404, 'Lesson not found');

      const course = await Course.findById(lesson.courseId);
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      await assertStudentCanAccessCourse(course._id, req.user);

      const { isOpen, now, closeAt } = computeAvailability(lesson);
      if (!isOpen) throw new HttpError(409, 'Assignment belum dibuka / sudah ditutup');

      const attempt = await AssignmentAttempt.findOne({ userId: req.user.sub, lessonId: lesson._id });
      if (!attempt) throw new HttpError(409, 'Klik Start dulu sebelum submit');
      if (attempt.submittedAt) throw new HttpError(409, 'Assignment sudah disubmit');

      const durationSec = lesson.assignment?.durationSec;
      let effectiveDueAt = attempt.dueAt;
      if (durationSec && !effectiveDueAt) {
        effectiveDueAt = new Date(attempt.startedAt.getTime() + Number(durationSec) * 1000);
      }
      if (effectiveDueAt && closeAt && effectiveDueAt > closeAt) effectiveDueAt = closeAt;

      if (effectiveDueAt && now > effectiveDueAt) throw new HttpError(409, 'Waktu pengerjaan habis');

      const textAnswer = String(req.body?.textAnswer || '').trim();
      if (!textAnswer) throw new HttpError(400, 'textAnswer is required');

      attempt.textAnswer = textAnswer;
      attempt.submittedAt = now;
      await attempt.save();

      res.json({
        ok: true,
        attempt: {
          startedAt: attempt.startedAt,
          dueAt: effectiveDueAt || null,
          submittedAt: attempt.submittedAt,
        },
      });
    })
  );

  return router;
}

module.exports = { assignmentsRouter };
