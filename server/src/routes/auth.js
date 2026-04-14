const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { getEnv } = require('../utils/env');
const { sha256Hex, randomTokenHex } = require('../utils/crypto');
const { hasSmtpConfigured, sendMail } = require('../utils/mailer');
const { buildClientUrl } = require('../utils/urls');

function authRouter({ jwtSecret }) {
  const router = express.Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      });
      const { name, email, password } = schema.parse(req.body);

      const existing = await User.findOne({ email });
      if (existing) throw new HttpError(409, 'Email already registered');

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash, role: 'student' });

      const token = jwt.sign({ sub: String(user._id), role: user.role, name: user.name }, jwtSecret, {
        expiresIn: '7d',
      });

      res.status(201).json({ token });
    })
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const { email, password } = schema.parse(req.body);

      const user = await User.findOne({ email });
      if (!user) throw new HttpError(401, 'Invalid credentials');

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new HttpError(401, 'Invalid credentials');

      const token = jwt.sign({ sub: String(user._id), role: user.role, name: user.name }, jwtSecret, {
        expiresIn: '7d',
      });

      res.json({ token });
    })
  );

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const header = req.headers.authorization || '';
      const [type, token] = header.split(' ');
      if (type !== 'Bearer' || !token) throw new HttpError(401, 'Unauthorized');

      let payload;
      try {
        payload = jwt.verify(token, jwtSecret);
      } catch {
        throw new HttpError(401, 'Invalid token');
      }

      const user = await User.findById(payload.sub).select(
        'name email role createdAt activeCourseId completedCourseIds purchasedCourseIds'
      );
      if (!user) throw new HttpError(401, 'Unauthorized');

      res.json({ user });
    })
  );

  router.post(
    '/forgot-password',
    asyncHandler(async (req, res) => {
      const env = getEnv();
      const schema = z.object({ email: z.string().email() });
      const { email } = schema.parse(req.body);

      // Always respond ok to avoid account enumeration.
      const user = await User.findOne({ email });
      if (!user) return res.json({ ok: true });

      const rawToken = randomTokenHex(32);
      user.passwordResetTokenHash = sha256Hex(rawToken);
      user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
      await user.save();

      const resetUrl = buildClientUrl(env, `/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`);
      const subject = 'Reset password';
      const text = `Link reset password (berlaku 30 menit):\n${resetUrl}`;

      if (hasSmtpConfigured(env)) {
        await sendMail(env, { to: email, subject, text });
        if (process.env.NODE_ENV !== 'production') {
          return res.json({ ok: true, devResetUrl: resetUrl });
        }
        return res.json({ ok: true });
      }

      // Dev fallback to test end-to-end without SMTP.
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ ok: true, devResetUrl: resetUrl });
      }

      return res.json({ ok: true });
    })
  );

  router.post(
    '/reset-password',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        token: z.string().min(10),
        newPassword: z.string().min(6),
      });
      const { email, token, newPassword } = schema.parse(req.body);

      const user = await User.findOne({ email });
      if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        throw new HttpError(400, 'Invalid reset token');
      }
      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        throw new HttpError(400, 'Reset token expired');
      }

      const tokenHash = sha256Hex(token);
      if (tokenHash !== user.passwordResetTokenHash) {
        throw new HttpError(400, 'Invalid reset token');
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { authRouter };
