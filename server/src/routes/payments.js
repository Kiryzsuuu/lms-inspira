const express = require('express');
const crypto = require('crypto');
const midtransClient = require('midtrans-client');
const { Cart } = require('../models/Cart');
const { Course } = require('../models/Course');
const { Order } = require('../models/Order');
const { User } = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { getEnv } = require('../utils/env');
const { sendPurchaseNotification, sendPurchaseConfirmation } = require('../utils/emailNotifications');

function makeOrderCode() {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString('hex');
  return `ORD-${ts}-${rand}`;
}

function computeMidtransSignature({ orderId, statusCode, grossAmount, serverKey }) {
  return crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
}

function isPaidStatus(transactionStatus) {
  // Unlock course only when Midtrans confirms settlement.
  // ("capture" can happen before settlement for certain methods and should not unlock access.)
  return transactionStatus === 'settlement';
}

function isTerminalFailedStatus(transactionStatus) {
  return transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire' || transactionStatus === 'failure';
}

function paymentsRouter({ requireAuth, requireRole, midtrans }) {
  const router = express.Router();

  router.get(
    '/config',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      res.json({
        clientKey: midtrans.clientKey || '',
        isProduction: Boolean(midtrans.isProduction),
      });
    })
  );

  // Create Midtrans Snap transaction from current cart
  router.post(
    '/checkout',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      if (!midtrans.serverKey || !midtrans.clientKey) {
        throw new HttpError(500, 'Midtrans belum dikonfigurasi (server key/client key)');
      }

      const cart = await Cart.findOne({ userId: req.user.sub }).lean();
      const ids = (cart?.items || []).map((i) => i.courseId);
      if (!ids.length) throw new HttpError(400, 'Cart kosong');

      const courses = await Course.find({ _id: { $in: ids }, isPublished: true }).lean();
      if (!courses.length) throw new HttpError(400, 'Cart kosong');

      const user = await User.findById(req.user.sub).lean();
      if (!user) throw new HttpError(401, 'Unauthorized');

      // filter already purchased
      const purchasedSet = new Set((user.purchasedCourseIds || []).map((x) => String(x)));
      const payable = courses.filter((c) => !purchasedSet.has(String(c._id)) && (c.priceIdr || 0) > 0);
      const freeToGrant = courses.filter((c) => !purchasedSet.has(String(c._id)) && (c.priceIdr || 0) === 0);

      if (freeToGrant.length) {
        await User.updateOne(
          { _id: req.user.sub },
          { $addToSet: { purchasedCourseIds: { $each: freeToGrant.map((c) => c._id) } } }
        );
      }

      if (!payable.length) {
        // Clear cart and return
        await Cart.updateOne({ userId: req.user.sub }, { $set: { items: [] } });
        return res.json({ ok: true, paid: true, message: 'Semua course di cart sudah gratis / sudah terbeli' });
      }

      const orderCode = makeOrderCode();
      const amountIdr = payable.reduce((sum, c) => sum + (c.priceIdr || 0), 0);

      const items = payable.map((c) => ({
        courseId: c._id,
        title: c.title,
        priceIdr: c.priceIdr || 0,
      }));

      const order = await Order.create({
        userId: req.user.sub,
        orderCode,
        status: 'pending',
        items,
        amountIdr,
        midtrans: {
          orderId: orderCode,
        },
      });

      // Send purchase notification email
      const env = getEnv();
      try {
        for (const course of payable) {
          await sendPurchaseNotification(env, {
            userEmail: user.email,
            userName: user.fullName || user.name,
            courseName: course.title,
            coursePrice: course.priceIdr || 0,
          });
        }
      } catch (emailErr) {
        console.error('Failed to send purchase notification:', emailErr);
        // Don't fail checkout if email fails
      }

      const snap = new midtransClient.Snap({
        isProduction: Boolean(midtrans.isProduction),
        serverKey: midtrans.serverKey,
        clientKey: midtrans.clientKey,
      });

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: orderCode,
          gross_amount: amountIdr,
        },
        item_details: items.map((it) => ({
          id: String(it.courseId),
          price: it.priceIdr,
          quantity: 1,
          name: it.title.slice(0, 50),
        })),
        customer_details: {
          first_name: (user.name || 'User').slice(0, 50),
          email: user.email,
        },
        enabled_payments: ['qris', 'bank_transfer'],
      });

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            'midtrans.snapToken': transaction.token,
            'midtrans.redirectUrl': transaction.redirect_url,
          },
        }
      );

      res.json({
        ok: true,
        orderId: String(order._id),
        orderCode,
        amountIdr,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
      });
    })
  );

  // Midtrans payment notification (webhook)
  router.post(
    '/midtrans/notification',
    asyncHandler(async (req, res) => {
      if (!midtrans.serverKey) throw new HttpError(500, 'Midtrans belum dikonfigurasi (server key)');

      const n = req.body || {};
      const orderId = n.order_id;
      if (!orderId) throw new HttpError(400, 'Invalid notification');

      const expected = computeMidtransSignature({
        orderId: String(n.order_id || ''),
        statusCode: String(n.status_code || ''),
        grossAmount: String(n.gross_amount || ''),
        serverKey: midtrans.serverKey,
      });

      const signatureOk = String(n.signature_key || '').toLowerCase() === expected.toLowerCase();
      if (!signatureOk) throw new HttpError(401, 'Invalid signature');

      const order = await Order.findOne({ orderCode: orderId });
      if (!order) throw new HttpError(404, 'Order not found');

      const txStatus = String(n.transaction_status || '');
      const paymentType = String(n.payment_type || '');
      const fraudStatus = String(n.fraud_status || '');

      const update = {
        'midtrans.transactionStatus': txStatus,
        'midtrans.paymentType': paymentType,
        'midtrans.fraudStatus': fraudStatus,
        'midtrans.rawNotification': n,
      };

      let newStatus = order.status;
      if (isPaidStatus(txStatus) && fraudStatus !== 'deny') {
        newStatus = 'paid';
        update['midtrans.settlementTime'] = n.settlement_time ? new Date(n.settlement_time) : new Date();

        // Fee is not provided by Midtrans notification by default.
        // We store an estimated fee (optional) based on env rules.
        const env = getEnv();

        function safeParseFeeRules(json) {
          if (!json) return null;
          try {
            const parsed = JSON.parse(json);
            return parsed && typeof parsed === 'object' ? parsed : null;
          } catch {
            return null;
          }
        }

        function computeFeeIdr({ amountIdr, paymentType }) {
          const amt = Math.max(0, Number(amountIdr || 0));
          const rules = safeParseFeeRules(env.MIDTRANS_FEE_RULES_JSON);

          const rule =
            (rules && paymentType && rules[paymentType]) ||
            (rules && rules.default) ||
            null;

          const percent = Math.max(0, Math.min(100, Number(rule?.percent ?? env.MIDTRANS_FEE_PERCENT ?? 0)));
          const flat = Math.max(0, Math.round(Number(rule?.flat ?? 0)));

          return Math.max(0, Math.round((amt * percent) / 100) + flat);
        }

        update['midtrans.feeIdr'] = computeFeeIdr({ amountIdr: order.amountIdr, paymentType });
      } else if (isTerminalFailedStatus(txStatus)) {
        newStatus = txStatus === 'expire' ? 'expired' : txStatus === 'cancel' ? 'canceled' : 'failed';
      }

      await Order.updateOne({ _id: order._id }, { $set: { status: newStatus, ...update } });

      if (newStatus === 'paid') {
        const courseIds = (order.items || []).map((it) => it.courseId);
        if (courseIds.length) {
          await User.updateOne(
            { _id: order.userId },
            { $addToSet: { purchasedCourseIds: { $each: courseIds } } }
          );

          // Send purchase confirmation email
          const env = getEnv();
          const user = await User.findById(order.userId).lean();
          try {
            for (const item of order.items) {
              await sendPurchaseConfirmation(env, {
                userEmail: user.email,
                userName: user.fullName || user.name,
                courseName: item.title,
                purchaseDate: new Date(),
              });
            }
          } catch (emailErr) {
            console.error('Failed to send purchase confirmation:', emailErr);
            // Don't fail webhook if email fails
          }
        }
        await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
      }

      res.json({ ok: true });
    })
  );

  // Student: list own orders
  router.get(
    '/orders',
    requireAuth,
    requireRole('student'),
    asyncHandler(async (req, res) => {
      const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 }).limit(50);
      res.json({ orders });
    })
  );

  return router;
}

module.exports = { paymentsRouter };
