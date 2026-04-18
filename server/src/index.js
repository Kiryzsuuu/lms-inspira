const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { connectDb } = require('./db');
const { getEnv } = require('./utils/env');
const { notFound, errorHandler } = require('./utils/errors');
const { requireAuth, requireRole } = require('./middleware/auth');
const { authRouter } = require('./routes/auth');
const { heroesRouter } = require('./routes/heroes');
const { coursesRouter } = require('./routes/courses');
const { quizzesRouter } = require('./routes/quizzes');
const { adminRouter } = require('./routes/admin');
const { progressRouter } = require('./routes/progress');
const { uploadsRouter, UPLOAD_DIR } = require('./routes/uploads');
const { questionBankRouter } = require('./routes/questionBank');
const { assignmentsRouter } = require('./routes/assignments');
const { cartRouter } = require('./routes/cart');
const { paymentsRouter } = require('./routes/payments');
const { reportsRouter } = require('./routes/reports');

async function main() {
  dotenv.config();
  const env = getEnv();
  await connectDb(env.MONGO_URI);

  const app = express();

  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  const allowedOrigins = String(env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow non-browser clients / same-origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.includes('*')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: false,
    })
  );

  // Health
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Public static: uploaded images
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Root (helpful in dev when user opens backend URL)
  app.get('/', (req, res) => {
    if (allowedOrigins[0]) return res.redirect(allowedOrigins[0]);
    return res.json({ ok: true, message: 'API server running. Visit the client app for UI.' });
  });

  // Public/Auth
  app.use('/api/auth', authRouter({ jwtSecret: env.JWT_SECRET }));
  app.use('/api/heroes', heroesRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/courses', coursesRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/quizzes', quizzesRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/admin', adminRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/progress', progressRouter({ requireAuth: requireAuth(env.JWT_SECRET) }));
  app.use('/api/uploads', uploadsRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/question-bank', questionBankRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/assignments', assignmentsRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use('/api/cart', cartRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));
  app.use(
    '/api/payments',
    paymentsRouter({
      requireAuth: requireAuth(env.JWT_SECRET),
      requireRole,
      midtrans: {
        serverKey: env.MIDTRANS_SERVER_KEY,
        clientKey: env.MIDTRANS_CLIENT_KEY,
        isProduction: env.MIDTRANS_IS_PRODUCTION,
      },
    })
  );
  app.use('/api/reports', reportsRouter({ requireAuth: requireAuth(env.JWT_SECRET), requireRole }));

  // Serve built client in production (SPA fallback)
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    const indexHtml = path.join(clientDist, 'index.html');

    if (fs.existsSync(indexHtml)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res) => res.sendFile(indexHtml));
    }
  }

  // Dev: proxy all non-API traffic to the Vite dev server.
  // This keeps refresh working on the same origin (http://localhost:4000/*) without redirects.
  if (process.env.NODE_ENV !== 'production' && env.CLIENT_ORIGIN) {
    const viteUrl = env.CLIENT_ORIGIN;
    app.use(
      '/',(createProxyMiddleware({
        target: viteUrl,
        changeOrigin: true,
        ws: true,
        logLevel: 'silent',
        pathRewrite: (pathReq) => pathReq,
        filter: (req) => {
          if (req.path === '/') return false;
          if (req.path.startsWith('/api/')) return false;
          return true;
        },
      }))
    );
  }

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
