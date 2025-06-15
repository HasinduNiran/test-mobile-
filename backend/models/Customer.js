const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  route: {
    type: String,
    trim: true,
  },
  telephone: {
    type: String,
    required: [true, 'Telephone number is required'],
    trim: true,
    unique: true, // Assuming telephone should be unique
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  currentCredits: { // This would represent the outstanding credit amount
    type: Number,
    default: 0,
  },
  addedBy: { // To track which representative added the customer
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // You might also want to add address fields, notes, etc. later
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
