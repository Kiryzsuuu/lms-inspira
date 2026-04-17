const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { BankQuestion } = require('../models/QuestionBank');
const { QuestionBankCollection } = require('../models/QuestionBankCollection');

function questionBankRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  // =============================
  // Collections
  // =============================

  router.get(
    '/collections',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.sub };
      const collections = await QuestionBankCollection.find(filter).sort({ createdAt: -1 }).limit(500);
      res.json({ collections });
    })
  );

  router.post(
    '/collections',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const schema = z.object({
        title: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional().default(''),
        tags: z.array(z.string()).optional().default([]),
      });

      const data = schema.parse(req.body);
      const title = (data.title || data.name || '').trim();
      if (!title) throw new HttpError(400, 'Title is required');

      const collection = await QuestionBankCollection.create({
        title,
        description: data.description,
        tags: data.tags,
        createdBy: req.user.sub,
        questions: [],
        numQuestions: 0,
      });

      res.status(201).json({ collection });
    })
  );

  router.delete(
    '/collections/:collectionId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const collection = await QuestionBankCollection.findById(req.params.collectionId);
      if (!collection) throw new HttpError(404, 'Collection not found');
      if (req.user.role !== 'admin' && String(collection.createdBy) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      // Delete questions referenced by this collection (best-effort; keep scope simple)
      if (Array.isArray(collection.questions) && collection.questions.length > 0) {
        await BankQuestion.deleteMany({ _id: { $in: collection.questions } });
      }

      await QuestionBankCollection.deleteOne({ _id: collection._id });
      res.status(204).end();
    })
  );

  router.get(
    '/collections/:collectionId/questions',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const collection = await QuestionBankCollection.findById(req.params.collectionId).populate('questions');
      if (!collection) throw new HttpError(404, 'Collection not found');
      if (req.user.role !== 'admin' && String(collection.createdBy) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');
      res.json({ questions: collection.questions || [] });
    })
  );

  router.post(
    '/collections/:collectionId/questions',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const collection = await QuestionBankCollection.findById(req.params.collectionId);
      if (!collection) throw new HttpError(404, 'Collection not found');
      if (req.user.role !== 'admin' && String(collection.createdBy) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      const schema = z
        .object({
          type: z.enum(['mcq', 'essay', 'matching']).optional().default('mcq'),
          promptHtml: z.string().optional().default(''),
          choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional().default([]),
          correctChoiceId: z.string().optional().default(''),
          pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).optional().default([]),
          rubric: z.string().optional().default(''),
          tags: z.array(z.string()).optional().default([]),
        })
        .superRefine((val, ctx) => {
          if (!val.promptHtml || !val.promptHtml.trim()) {
            ctx.addIssue({ code: 'custom', path: ['promptHtml'], message: 'promptHtml is required' });
          }
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
      const ownerId = req.user.role === 'admin' && req.body.ownerId ? req.body.ownerId : req.user.sub;
      const item = await BankQuestion.create({ ...data, ownerId });

      collection.questions = collection.questions || [];
      collection.questions.push(item._id);
      collection.numQuestions = collection.questions.length;
      await collection.save();

      res.status(201).json({ item });
    })
  );

  router.delete(
    '/collections/:collectionId/questions/:questionId',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const collection = await QuestionBankCollection.findById(req.params.collectionId);
      if (!collection) throw new HttpError(404, 'Collection not found');
      if (req.user.role !== 'admin' && String(collection.createdBy) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      const existing = await BankQuestion.findById(req.params.questionId);
      if (!existing) throw new HttpError(404, 'Bank question not found');
      if (req.user.role !== 'admin' && String(existing.ownerId) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      collection.questions = (collection.questions || []).filter((id) => String(id) !== String(existing._id));
      collection.numQuestions = collection.questions.length;
      await collection.save();

      await BankQuestion.deleteOne({ _id: existing._id });
      res.status(204).end();
    })
  );

  // List my bank questions
  router.get(
    '/',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.sub };
      const items = await BankQuestion.find(filter).sort({ createdAt: -1 }).limit(500);
      res.json({ items });
    })
  );

  // Create
  router.post(
    '/',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const schema = z
        .object({
          type: z.enum(['mcq', 'essay', 'matching']).optional().default('mcq'),
          promptHtml: z.string().optional().default(''),
          choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional().default([]),
          correctChoiceId: z.string().optional().default(''),
          pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).optional().default([]),
          rubric: z.string().optional().default(''),
          tags: z.array(z.string()).optional().default([]),
        })
        .superRefine((val, ctx) => {
          if (!val.promptHtml || !val.promptHtml.trim()) {
            ctx.addIssue({ code: 'custom', path: ['promptHtml'], message: 'promptHtml is required' });
          }
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
      const ownerId = req.user.role === 'admin' && req.body.ownerId ? req.body.ownerId : req.user.sub;
      const item = await BankQuestion.create({ ...data, ownerId });
      res.status(201).json({ item });
    })
  );

  // Update
  router.put(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const existing = await BankQuestion.findById(req.params.id);
      if (!existing) throw new HttpError(404, 'Bank question not found');
      if (req.user.role !== 'admin' && String(existing.ownerId) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      const schema = z
        .object({
          type: z.enum(['mcq', 'essay', 'matching']).optional().default(existing.type),
          promptHtml: z.string().optional().default(existing.promptHtml),
          choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional().default(existing.choices || []),
          correctChoiceId: z.string().optional().default(existing.correctChoiceId || ''),
          pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).optional().default(existing.pairs || []),
          rubric: z.string().optional().default(existing.rubric || ''),
          tags: z.array(z.string()).optional().default(existing.tags || []),
        })
        .superRefine((val, ctx) => {
          if (!val.promptHtml || !val.promptHtml.trim()) {
            ctx.addIssue({ code: 'custom', path: ['promptHtml'], message: 'promptHtml is required' });
          }
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
      const updated = await BankQuestion.findByIdAndUpdate(req.params.id, data, { new: true });
      res.json({ item: updated });
    })
  );

  // Delete
  router.delete(
    '/:id',
    requireAuth,
    requireRole('admin', 'teacher'),
    asyncHandler(async (req, res) => {
      const existing = await BankQuestion.findById(req.params.id);
      if (!existing) throw new HttpError(404, 'Bank question not found');
      if (req.user.role !== 'admin' && String(existing.ownerId) !== String(req.user.sub)) throw new HttpError(403, 'Forbidden');

      await BankQuestion.deleteOne({ _id: existing._id });
      res.status(204).end();
    })
  );

  return router;
}

module.exports = { questionBankRouter };
