const mongoose = require('mongoose');

const ORDER_STATUS = ['pending', 'paid', 'failed', 'expired', 'canceled'];

const orderItemSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    priceIdr: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderCode: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },

    items: { type: [orderItemSchema], default: [] },
    amountIdr: { type: Number, required: true, min: 0 },

    midtrans: {
      orderId: { type: String },
      snapToken: { type: String },
      redirectUrl: { type: String },
      transactionStatus: { type: String },
      paymentType: { type: String },
      fraudStatus: { type: String },
      settlementTime: { type: Date },
      rawNotification: { type: Object },
    },
  },
  { timestamps: true }
);

module.exports = {
  Order: mongoose.model('Order', orderSchema),
  ORDER_STATUS,
};
