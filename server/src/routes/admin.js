const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User, ROLES } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { writeAuditLog } = require('../utils/audit');

function adminRouter({ requireAuth, requireRole }) {
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireRole('admin'));

  router.get(
    '/users',
    asyncHandler(async (req, res) => {
      const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 });
      res.json({ users });
    })
  );

  router.post(
    '/users',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(ROLES),
      });
      const { name, email, password, role } = schema.parse(req.body);

      const existing = await User.findOne({ email });
      if (existing) throw new HttpError(409, 'Email already registered');

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash, role });
      res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    })
  );

  router.put(
    '/users/:id',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        role: z.enum(ROLES),
      });
      const { role } = schema.parse(req.body);

      if (String(req.params.id) === String(req.user._id) && role !== req.user.role) {
        throw new HttpError(400, 'Tidak bisa mengubah role diri sendiri');
      }

      const target = await User.findById(req.params.id);
      if (!target) throw new HttpError(404, 'User not found');

      const prevRole = target.role;
      target.role = role;
      await target.save();

      await writeAuditLog({
        req,
        action: 'admin.user.role_updated',
        targetUserId: target._id,
        metadata: { from: prevRole, to: role },
      });

      res.json({ user: { _id: target._id, name: target.name, email: target.email, role: target.role } });
    })
  );

  return router;
}

module.exports = { adminRouter };
