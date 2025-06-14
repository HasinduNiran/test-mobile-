const express = require('express');
const Stock = require('../models/Stock');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all stock items (accessible by both admin and representative)
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search stock items by name, barcode, or category
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Create a regex search for name, description, category, or exact barcode match
    const stocks = await Stock.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { barcode: query } // Exact match for barcode
      ]
    }).sort({ name: 1 });
    
    res.json(stocks);
  } catch (err) {
    console.error('Error searching stock items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single stock item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json(stock);
  } catch (err) {
    console.error('Error fetching stock item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new stock item (admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
  try {
    const { name, barcode, description, quantity, price, category, imageUrl } = req.body;
    
    const newStock = new Stock({
      name,
      barcode,
      description,
      quantity,
      price,
      category,
      imageUrl,
      createdBy: req.user.id
    });
    
    const stock = await newStock.save();
    res.status(201).json(stock);
  } catch (err) {
    console.error('Error creating stock item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stock item (admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const { name, barcode, description, quantity, price, category, imageUrl } = req.body;
    
    // Build stock object
    const stockFields = {};
    if (name) stockFields.name = name;
    if (barcode !== undefined) stockFields.barcode = barcode;
    if (description !== undefined) stockFields.description = description;
    if (quantity !== undefined) stockFields.quantity = quantity;
    if (price !== undefined) stockFields.price = price;
    if (category) stockFields.category = category;
    if (imageUrl !== undefined) stockFields.imageUrl = imageUrl;
    stockFields.updatedAt = Date.now();
    
    let stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    // Update
    stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { $set: stockFields },
      { new: true }
    );
    
    res.json(stock);
  } catch (err) {
    console.error('Error updating stock item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete stock item (admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    await Stock.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Stock item removed' });
  } catch (err) {
    console.error('Error deleting stock item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
