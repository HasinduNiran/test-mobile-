const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/customers
// @desc    Add a new customer
// @access  Private (Representative, Admin)
router.post('/', protect, authorize(['representative', 'admin']), async (req, res) => {
  const { name, route, telephone, creditLimit } = req.body;
  try {
    const newCustomer = new Customer({
      name,
      route,
      telephone,
      creditLimit,
      currentCredits: 0, // Initial credits are 0
      addedBy: req.user.id,
    });
    const customer = await newCustomer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error adding customer:', error.message);
    if (error.code === 11000) { // Duplicate key error (e.g., telephone)
        return res.status(400).json({ message: 'Customer with this telephone already exists.' });
    }
    res.status(500).json({ message: 'Server error while adding customer.' });
  }
});

// @route   GET /api/customers
// @desc    Get all customers (admin) or customers added by the representative
// @access  Private (Representative, Admin)
router.get('/', protect, authorize(['representative', 'admin']), async (req, res) => {
  try {
    let customers;
    if (req.user.role === 'admin') {
      customers = await Customer.find().populate('addedBy', 'username');
    } else {
      customers = await Customer.find({ addedBy: req.user.id }).populate('addedBy', 'username');
    }
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ message: 'Server error while fetching customers.' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get a single customer by ID
// @access  Private (Representative, Admin)
router.get('/:id', protect, authorize(['representative', 'admin']), async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id).populate('addedBy', 'username');
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      // Admin can see any customer, representative can only see their own customers
      if (req.user.role === 'representative' && customer.addedBy._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this customer' });
      }
      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error.message);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
      }
      res.status(500).json({ message: 'Server error while fetching customer.' });
    }
  });

// @route   PUT /api/customers/:id
// @desc    Update a customer
// @access  Private (Representative, Admin)
router.put('/:id', protect, authorize(['representative', 'admin']), async (req, res) => {
  const { name, route, telephone, creditLimit, currentCredits } = req.body;
  try {
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Representative can only update their own customers
    if (req.user.role === 'representative' && customer.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    // Admin can update currentCredits, representative cannot directly (should be through transactions ideally)
    // For now, let admin update it, but this might need a more robust system for credit tracking.
    const updateFields = {
        name: name || customer.name,
        route: route || customer.route,
        telephone: telephone || customer.telephone,
        creditLimit: creditLimit !== undefined ? creditLimit : customer.creditLimit,
    };

    if (req.user.role === 'admin' && currentCredits !== undefined) {
        updateFields.currentCredits = currentCredits;
    }

    customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error.message);
    if (error.code === 11000) { 
        return res.status(400).json({ message: 'Customer with this telephone already exists.' });
    }
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while updating customer.' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
// @access  Private (Admin only)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Add any checks here if a customer cannot be deleted (e.g., if they have outstanding orders/credits)

    await customer.deleteOne(); // Using deleteOne() which is the current Mongoose way
    res.json({ message: 'Customer removed' });
  } catch (error) {
    console.error('Error deleting customer:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while deleting customer.' });
  }
});

module.exports = router;
