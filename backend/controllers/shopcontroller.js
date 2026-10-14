const Shop = require("../models/shop");
const Supply = require("../models/supply");

const DUPLICATE = "A shop with this name and phone number already exists";

// Add a shop
exports.createShop = async (req, res) => {
  try {
    const shop = await Shop.create(req.body);
    res.status(201).json(shop);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: DUPLICATE });
    res.status(400).json({ message: err.message });
  }
};

// Get all shops
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get one shop
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (err) {
    res.status(400).json({ message: "Invalid shop id" });
  }
};

// Update a shop
exports.updateShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: DUPLICATE });
    res.status(400).json({ message: err.message });
  }
};

// Delete a shop (not allowed when it already has supplies)
exports.deleteShop = async (req, res) => {
  try {
    const hasSupplies = await Supply.exists({ shop: req.params.id });
    if (hasSupplies) {
      return res.status(400).json({
        message: "This shop has supply records, so it cannot be deleted",
      });
    }

    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json({ message: "Shop deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid shop id" });
  }
};