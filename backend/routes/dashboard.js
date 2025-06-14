const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Sample dashboard data with 5 tiles
router.get('/', auth, async (req, res) => {
  try {
    // Get current time in Sri Lanka timezone
    const sriLankaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo'
    });
    
    // Sample data for dashboard tiles
    const dashboardData = {
      currentTime: sriLankaTime,
      tiles: [
        {
          id: 1,
          title: "Today's Appointments",
          count: 12,
          icon: "calendar",
          color: "#4CAF50"
        },
        {
          id: 2,
          title: "Pending Tasks",
          count: 5,
          icon: "clipboard",
          color: "#FFC107"
        },
        {
          id: 3,
          title: "Recent Clients",
          count: 8,
          icon: "users",
          color: "#2196F3"
        },        {
          id: 4,
          title: "Performance",
          data: "85%",
          icon: "bar-chart",
          color: "#9C27B0"
        },
        {
          id: 5,
          title: "Announcements",
          count: 3,
          icon: "bullhorn",
          color: "#FF5722"
        }
      ],
      user: {
        username: req.user.username,
        role: req.user.role
      }
    };

    res.json(dashboardData);  } catch (error) {
    console.error('Dashboard error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

module.exports = router;
