const express = require('express');
const { z } = require('zod');
const { HeroSlide } = require('../models/HeroSlide');
const { asyncHandler } = require('../utils/asyncHandler');

function heroesRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
      res.json({ slides });
    })
  );

  router.get(
    '/all',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
      res.json({ slides });
    })
  );

  router.post(
    '/',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const schema = z.object({
        title: z.string().min(1),
        subtitle: z.string().optional().default(''),
        ctaText: z.string().optional().default('Mulai'),
        ctaHref: z.string().optional().default('/courses'),
        imageUrl: z.string().optional().default(''),
        order: z.coerce.number().optional().default(0),
        isActive: z.coerce.boolean().optional().default(true),
      });
      const data = schema.parse(req.body);
      const slide = await HeroSlide.create(data);
      res.status(201).json({ slide });
    })
  );

  router.put(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const schema = z.object({
        title: z.string().min(1),
        subtitle: z.string().optional().default(''),
        ctaText: z.string().optional().default('Mulai'),
        ctaHref: z.string().optional().default('/courses'),
        imageUrl: z.string().optional().default(''),
        order: z.coerce.number().optional().default(0),
        isActive: z.coerce.boolean().optional().default(true),
      });
      const data = schema.parse(req.body);
      const slide = await HeroSlide.findByIdAndUpdate(req.params.id, data, { new: true });
      res.json({ slide });
    })
  );

  router.delete(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      await HeroSlide.findByIdAndDelete(req.params.id);
      res.status(204).end();
    })
  );

  return router;
}

module.exports = { heroesRouter };
