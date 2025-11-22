const express = require("express");
const Address = require("../models/Address");
const { protect } = require("../middleware/auth");

const router = express.Router();

// CREATE ADDRESS
router.post("/", protect, async (req, res) => {
  try {
    const address = await Address.create({
      ...req.body,
      user: req.user._id,
    });

    res.json({ success: true, address });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET ALL ADDRESSES
router.get("/", protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id });
    res.json({ success: true, addresses });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE ADDRESS
router.put("/:id", protect, async (req, res) => {
  try {
    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    res.json({ success: true, address: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE ADDRESS
router.delete("/:id", protect, async (req, res) => {
  try {
    await Address.deleteOne({ _id: req.params.id, user: req.user._id });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// SET DEFAULT ADDRESS
router.put("/:id/default", protect, async (req, res) => {
  try {
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    const updated = await Address.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );

    res.json({ success: true, address: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
