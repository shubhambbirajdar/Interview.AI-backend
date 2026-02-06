const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', protect, paymentController.createOrder);

// Verify payment signature
router.post('/verify-payment', protect, paymentController.verifyPayment);

// Get payment details
router.get('/payment/:payment_id', protect, paymentController.getPaymentDetails);

// Get order details
router.get('/order/:order_id', protect, paymentController.getOrderDetails);

// Capture payment (for authorized payments)
router.post('/capture/:payment_id', protect, paymentController.capturePayment);

// Create refund
router.post('/refund/:payment_id', protect, paymentController.createRefund);

module.exports = router;
