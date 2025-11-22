const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// Fields to select from product model
const PRODUCT_POPULATE_FIELDS =
  "name price category description images sizes colors";
const USER_POPULATE_FIELDS = "name email";

// -------------------------------------
// 🔥 CREATE ORDER
// -------------------------------------
router.post("/", protect, async (req, res) => {
  try {
    const { products, totalAmount, shippingAddress, paymentId } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No products in order" });
    }

    if (!shippingAddress) {
      return res
        .status(400)
        .json({ message: "Shipping address is required" });
    }

    const order = await Order.create({
      user: req.user._id,
      products,
      totalAmount,
      shippingAddress,
      paymentId,
    });

    const populated = await Order.findById(order._id)
      .populate({
        path: "products.product",
        select: PRODUCT_POPULATE_FIELDS,
      })
      .populate("shippingAddress")
      .populate({
        path: "user",
        select: USER_POPULATE_FIELDS,
      });

    res.status(201).json({
      message: "Order created successfully",
      order: populated,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------------------------
// 🔥 GET ALL ORDERS (Admin optional)
// -------------------------------------
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "products.product",
        select: PRODUCT_POPULATE_FIELDS,
      })
      .populate("shippingAddress")
      .populate({
        path: "user",
        select: USER_POPULATE_FIELDS,
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------------
// 🔥 GET LOGGED-IN USER ORDERS
// -------------------------------------
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: "products.product",
        select: PRODUCT_POPULATE_FIELDS,
      })
      .populate("shippingAddress")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Fetch my orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
