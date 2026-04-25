const nodemailer = require('nodemailer');

function hasSmtpConfigured(env) {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
}

function createTransport(env) {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

async function sendMail(env, { to, subject, text, html }) {
  if (!hasSmtpConfigured(env)) {
    const err = new Error('SMTP is not configured');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const transporter = createTransport(env);
  const from = env.SMTP_FROM || env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { hasSmtpConfigured, sendMail };
