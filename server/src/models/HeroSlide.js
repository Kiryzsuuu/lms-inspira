const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    ctaText: { type: String, default: 'Mulai' },
    ctaHref: { type: String, default: '/courses' },
    imageUrl: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = { HeroSlide: mongoose.model('HeroSlide', heroSlideSchema) };
