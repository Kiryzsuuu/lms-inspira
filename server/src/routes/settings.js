const express = require('express');
const { Setting } = require('../models/Setting');
const { asyncHandler } = require('../utils/asyncHandler');

const HOME_DEFAULTS = {
  stats: [
    { num: '500+', label: 'Kursus Premium' },
    { num: '50K+', label: 'Pelajar Aktif' },
    { num: '120+', label: 'Instruktur Expert' },
    { num: '98%', label: 'Tingkat Kepuasan' },
  ],
  heroBadge1Title: 'Sertifikat Diterima',
  heroBadge1Sub: 'Gojek · Tokopedia',
  heroBadge2Title: 'Baru bergabung',
  heroBadge2Sub: 'Budi S. · 2 menit lalu',
  certSampleName: 'Arya Ramadhan',
  certSampleCourse: 'Python untuk Data Science & ML',
  partners: ['Tokopedia', 'Gojek', 'Traveloka', 'BCA Digital'],
  partnerCountText: 'Diakui oleh 300+ perusahaan termasuk',
  testimonialStat: '50K+',
  testimonialStatLabel: 'Pelajar bergabung',
  testimonialQuote: 'Lulusan InspiraLearn 3× lebih cepat mendapat pekerjaan dibanding rata-rata fresh graduate Indonesia.',
  ratingNum: '4.9',
  ratingLabel: 'dari 28.000+ ulasan',
};

function settingsRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  // GET /api/settings/:key — public
  router.get('/:key', asyncHandler(async (req, res) => {
    const { key } = req.params;
    const doc = await Setting.findOne({ key });
    let value = {};
    if (key === 'homePage') {
      value = { ...HOME_DEFAULTS, ...(doc?.value || {}) };
    } else {
      value = doc?.value ?? null;
    }
    res.json({ key, value });
  }));

  // PUT /api/settings/:key — admin only
  router.put('/:key', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
    const { key } = req.params;
    await Setting.findOneAndUpdate({ key }, { $set: { value: req.body } }, { upsert: true, new: true });
    res.json({ ok: true });
  }));

  return router;
}

module.exports = { settingsRouter };
