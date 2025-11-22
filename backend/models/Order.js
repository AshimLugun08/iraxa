const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  products: {
    type: [orderItemSchema],
    validate: v => Array.isArray(v) && v.length > 0,
  },

  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },

  paymentId: { type: String, default: null },

  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",   // ⭐ Correct for population
    required: true,
  },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
