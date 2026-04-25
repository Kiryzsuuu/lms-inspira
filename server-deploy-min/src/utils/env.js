const { z } = require('zod');

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z
    .preprocess((v) => {
      if (v === undefined) return false;
      if (typeof v === 'boolean') return v;
      const s = String(v).toLowerCase();
      return s === '1' || s === 'true' || s === 'yes';
    }, z.boolean())
    .optional()
    .default(false),
  // Optional: fee estimate percentage for accounting (0-100)
  MIDTRANS_FEE_PERCENT: z.coerce.number().min(0).max(100).optional().default(0),
  // Optional: per-payment-type fee rules JSON. Example:
  // {"default":{"percent":2.9},"qris":{"percent":0.7},"bank_transfer":{"flat":4000}}
  MIDTRANS_FEE_RULES_JSON: z.string().optional(),
  // Optional SMTP configuration (for future email features: reset password, notifications, etc.)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}

module.exports = { getEnv };
