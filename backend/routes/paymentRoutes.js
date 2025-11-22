const express = require("express");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ----------- CREATE ORDER (already have) -----------
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcpt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Razorpay create error:", err);
    res.status(500).json({ success: false, message: "Payment order creation failed" });
  }
});


// ----------- VERIFY PAYMENT & PLACE ORDER -----------
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cart,
      addressId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Create order in DB
    const newOrder = await Order.create({
      user: req.user._id,
      products: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount: cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
      shippingAddress: addressId,
      paymentId: razorpay_payment_id,
      status: "paid",
    });

    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
