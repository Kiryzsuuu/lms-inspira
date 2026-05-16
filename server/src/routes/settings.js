const express = require('express');
const { Setting } = require('../models/Setting');
const { asyncHandler } = require('../utils/asyncHandler');

const HOME_DEFAULTS = {
  // Hero section
  heroBadgePrefix: 'Platform Belajar #1 Indonesia',
  heroTitle: 'Kuasai Skill\nyang Dibutuhkan',
  heroAccent: 'Industri Sekarang',
  heroDesc: 'Belajar dari praktisi terbaik. Kurikulum dirancang langsung dari kebutuhan industri — bukan teori kosong.',
  // Floating badges
  heroBadge1Title: 'Sertifikat Diterima',
  heroBadge1Sub: 'Gojek · Tokopedia',
  heroBadge2Title: 'Baru bergabung',
  heroBadge2Sub: 'Budi S. · 2 menit lalu',
  // Running text ticker
  tickerItems: ['Programming & Dev', 'Data Science', 'UI/UX Design', 'AI & Machine Learning', 'Cybersecurity', 'Digital Marketing', 'Bisnis & Karir', 'Mobile Dev', 'Cloud & DevOps', 'Video & Konten'],
  // Stats bar
  stats: [
    { num: '500+', label: 'Kursus Premium' },
    { num: '50K+', label: 'Pelajar Aktif' },
    { num: '120+', label: 'Instruktur Expert' },
    { num: '98%', label: 'Tingkat Kepuasan' },
  ],
  // Certificate sample
  certSampleName: 'Arya Ramadhan',
  certSampleCourse: 'Python untuk Data Science & ML',
  partners: ['Tokopedia', 'Gojek', 'Traveloka', 'BCA Digital'],
  partnerCountText: 'Diakui oleh 300+ perusahaan termasuk',
  // Alumni partners section
  alumniSectionTitle: 'Alumni kami bekerja di lebih dari 300 perusahaan',
  alumniPartners: ['Tokopedia', 'Gojek', 'Traveloka', 'Bukalapak', 'Telkom', 'BCA Digital', 'Shopee', 'Halodoc', 'Akseleran', 'Blibli'],
  // Testimonials sidebar
  testimonialStat: '50K+',
  testimonialStatLabel: 'Pelajar bergabung',
  testimonialQuote: 'Lulusan InspiraLearn 3× lebih cepat mendapat pekerjaan dibanding rata-rata fresh graduate Indonesia.',
  ratingNum: '4.9',
  ratingLabel: 'dari 28.000+ ulasan',
  // Footer
  footerTagline: 'Platform belajar online untuk profesional Indonesia yang ingin naik level karir dengan skill nyata dari industri.',
  footerSocials: [
    { label: 'IG', href: '#' },
    { label: 'YT', href: '#' },
    { label: 'in', href: '#' },
    { label: 'X', href: '#' },
  ],
  footerNavCols: [
    { title: 'Produk', links: [
      { label: 'Online Courses', href: '/courses' },
      { label: 'Sertifikasi', href: '/' },
      { label: 'Program Korporat', href: '/' },
    ]},
    { title: 'Perusahaan', links: [
      { label: 'Tentang Kami', href: '/tentang-kami' },
      { label: 'Blog', href: '/' },
      { label: 'Karir', href: '/' },
    ]},
    { title: 'Bantuan', links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Hubungi Kami', href: 'mailto:support@inspiratekno.com' },
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
      { label: 'Syarat & Ketentuan', href: '/' },
    ]},
  ],
  footerBottomLinks: [
    { label: 'Privasi', href: '#' },
    { label: 'Syarat', href: '#' },
    { label: 'Cookie', href: '#' },
  ],
  footerCopyright: 'InspiraLearn by Inspiratekno. All rights reserved.',
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
