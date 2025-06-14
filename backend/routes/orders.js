const express = require('express');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is authenticated (both admin and representative)
const checkAuth = async (req, res, next) => {
  try {
    // auth middleware already verified the token and set req.user
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (admin can see all, representatives see only their own)
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    const { representativeId, date } = req.query; // Get both representativeId and date from query params

    // Base query
    let query = {};

    // Add date filter if provided
    if (date) {
      // Parse the date and create a range for the entire day
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1); // Next day
      
      query.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (req.user.role === 'admin') {
      // Admin can see all orders or filter by representative
      if (representativeId) {
        query.soldBy = representativeId;
      }
      orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('soldBy', 'username email role'); // Populate role as well
    } else {
      // Representatives only see their own orders
      query.soldBy = req.user.id;
      orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('soldBy', 'username email role'); // Populate role for consistency
    }
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('soldBy', 'username email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only admin or the rep who created the order can access it
    if (req.user.role !== 'admin' && order.soldBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order (both admin and representatives can create)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      items, 
      subtotal, 
      tax = 0, // Default tax to 0 
      total, 
      paymentMethod, 
      status, 
      customerName 
    } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    if (subtotal === undefined || tax === undefined || total === undefined) {
      return res.status(400).json({ message: 'Order must include subtotal, tax, and total' });
    }
    
    // Create new order
    const newOrder = new Order({
      items,
      subtotal,
      tax,
      total,
      paymentMethod: paymentMethod || 'Cash',
      status: status || 'Completed',
      customerName: customerName || 'Walk-in Customer',
      soldBy: req.user.id
    });
    
    // Update stock quantities
    for (const item of items) {
      const stock = await Stock.findById(item.productId);
      
      if (!stock) {
        return res.status(400).json({ 
          message: `Product ${item.productName} not found in inventory` 
        });
      }
      
      if (stock.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${item.productName}. Available: ${stock.quantity}` 
        });
      }
      
      // Update stock quantity
      stock.quantity -= item.quantity;
      await stock.save();
    }
    
    const order = await newOrder.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Only admin can update order status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    if (!status || !['Pending', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If changing from Completed to Cancelled, restore inventory
    if (order.status === 'Completed' && status === 'Cancelled') {
      for (const item of order.items) {
        const stock = await Stock.findById(item.productId);
        if (stock) {
          stock.quantity += item.quantity;
          await stock.save();
        }
      }
    }
    
    // If changing from Cancelled to Completed, reduce inventory
    if (order.status === 'Cancelled' && status === 'Completed') {
      for (const item of order.items) {
        const stock = await Stock.findById(item.productId);
        if (stock) {
          if (stock.quantity < item.quantity) {
            return res.status(400).json({ 
              message: `Cannot complete order: Insufficient quantity for ${item.productName}`
            });
          }
          stock.quantity -= item.quantity;
          await stock.save();
        }
      }
    }
    
    order.status = status;
    const updatedOrder = await order.save();
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders summary (admin only)
router.get('/summary/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.find({
      createdAt: { $gte: today },
      status: 'Completed'
    });
    
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const todayCount = todayOrders.length;
    
    // Get sales for last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    
    const weekOrders = await Order.find({
      createdAt: { $gte: last7Days },
      status: 'Completed'
    });
    
    const weekSales = weekOrders.reduce((sum, order) => sum + order.total, 0);
    const weekCount = weekOrders.length;
    
    res.json({
      today: {
        sales: todaySales,
        count: todayCount
      },
      week: {
        sales: weekSales,
        count: weekCount
      }
    });
  } catch (err) {
    console.error('Error fetching orders summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
