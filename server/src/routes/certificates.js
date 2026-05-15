const express = require('express');
const { Certificate } = require('../models/Certificate');
const { Course } = require('../models/Course');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');

function certificatesRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  // Generate certificate number
  function generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  // Student: get my certificates
  router.get(
    '/my-certificates',
    requireAuth,
    asyncHandler(async (req, res) => {
      const certificates = await Certificate.find({ userId: req.user.sub })
        .populate('courseId', 'title')
        .sort({ issuedAt: -1 });
      res.json({ certificates });
    })
  );

  // Student: get certificate for a specific course
  router.get(
    '/course/:courseId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const certificate = await Certificate.findOne({
        userId: req.user.sub,
        courseId: req.params.courseId,
      }).populate('courseId', 'title');

      if (!certificate) throw new HttpError(404, 'Certificate not found');
      res.json({ certificate });
    })
  );

  // Student: request certificate (auto-generated when course completed)
  router.post(
    '/generate/:courseId',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      const course = await Course.findById(req.params.courseId).populate('ownerId', 'fullName name');
      if (!course) throw new HttpError(404, 'Course not found');

      const user = await User.findById(req.user.sub);
      if (!user) throw new HttpError(401, 'Unauthorized');

      // Check if course is completed
      const isCompleted = (user.completedCourseIds || []).some(
        (id) => String(id) === String(course._id)
      );
      if (!isCompleted) {
        throw new HttpError(409, 'Course belum diselesaikan');
      }

      // Check if certificate already exists
      let certificate = await Certificate.findOne({
        userId: user._id,
        courseId: course._id,
      });

      if (!certificate) {
        certificate = await Certificate.create({
          userId: user._id,
          courseId: course._id,
          certificateNumber: generateCertificateNumber(),
          completionDate: new Date(),
          metadata: {
            userName: user.fullName || user.name,
            courseName: course.title,
            instructorName: course.ownerId?.fullName || course.ownerId?.name || 'LMS Inspira',
          },
        });
      }

      res.json({ certificate });
    })
  );

  // Admin/Teacher: list all certificates
  router.get(
    '/all',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const certificates = await Certificate.find()
        .populate('userId', 'name email fullName')
        .populate('courseId', 'title')
        .sort({ issuedAt: -1 })
        .limit(100);
      res.json({ certificates });
    })
  );

  return router;
}

module.exports = { certificatesRouter };
