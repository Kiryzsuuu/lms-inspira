const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImageUrl: { type: String, default: '' },
    priceIdr: { type: Number, default: 0, min: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = { Course: mongoose.model('Course', courseSchema) };
