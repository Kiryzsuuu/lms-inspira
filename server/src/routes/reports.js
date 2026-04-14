const express = require('express');
const PDFDocument = require('pdfkit');
const { Course } = require('../models/Course');
const { Lesson } = require('../models/Lesson');
const { LessonProgress } = require('../models/LessonProgress');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');

function formatIdr(n) {
  try {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  } catch {
    return String(n || 0);
  }
}

function reportsRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  // Student: export PDF progress + achievements for a course
  router.get(
    '/courses/:courseId/progress.pdf',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      const course = await Course.findById(req.params.courseId).lean();
      if (!course || !course.isPublished) throw new HttpError(404, 'Course not found');

      const user = await User.findById(req.user.sub).lean();
      if (!user) throw new HttpError(401, 'Unauthorized');

      const price = course.priceIdr || 0;
      if (price > 0) {
        const purchased = (user.purchasedCourseIds || []).some((x) => String(x) === String(course._id));
        if (!purchased) throw new HttpError(402, 'Course belum terbeli.');
      }

      const lessons = await Lesson.find({ courseId: course._id, isPublished: true }).sort({ order: 1, createdAt: 1 }).lean();
      const progress = await LessonProgress.find({ userId: req.user.sub, courseId: course._id }).lean();
      const byLessonId = new Map(progress.map((p) => [String(p.lessonId), p]));

      const totalLessons = lessons.length;
      const completedLessons = lessons.filter((l) => byLessonId.get(String(l._id))?.isCompleted).length;
      const certEligible = totalLessons > 0 && completedLessons === totalLessons;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const safeTitle = (course.title || 'course').replace(/[^a-z0-9\- _]/gi, '').slice(0, 60) || 'course';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="progress-${safeTitle}.pdf"`);
      doc.pipe(res);

      doc.fontSize(18).text('Laporan Progress Belajar', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333333').text(`Nama: ${user.name || '-'}`);
      doc.text(`Email: ${user.email || '-'}`);
      doc.text(`Course: ${course.title}`);
      doc.text(`Harga: Rp ${formatIdr(price)}`);
      doc.text(`Tanggal cetak: ${new Date().toLocaleString('id-ID')}`);

      doc.moveDown();
      doc.fontSize(14).fillColor('#000000').text('Ringkasan', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333333').text(`Total lesson: ${totalLessons}`);
      doc.text(`Lesson selesai: ${completedLessons}`);
      doc.text(`Sertifikat: ${certEligible ? 'Eligible (semua lesson selesai)' : 'Belum eligible'}`);

      doc.moveDown();
      doc.fontSize(14).fillColor('#000000').text('Detail Lesson', { underline: true });
      doc.moveDown(0.5);

      lessons.forEach((l, idx) => {
        const p = byLessonId.get(String(l._id));
        const done = Boolean(p?.isCompleted);
        const doneAt = p?.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '';
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(`${idx + 1}. ${l.title}  —  ${done ? `SELESAI${doneAt ? ' (' + doneAt + ')' : ''}` : 'BELUM'}`);
      });

      doc.moveDown();
      doc.fontSize(14).fillColor('#000000').text('Achievement', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333333');

      const achievements = [];
      lessons.forEach((l) => {
        const p = byLessonId.get(String(l._id));
        if (p?.isCompleted) achievements.push(`Badge lesson: ${l.title}`);
      });
      if (certEligible) achievements.push('Certificate: Course completed');

      if (!achievements.length) {
        doc.text('Belum ada achievement.');
      } else {
        achievements.forEach((a) => doc.text(`- ${a}`));
      }

      doc.end();
    })
  );

  return router;
}

module.exports = { reportsRouter };
