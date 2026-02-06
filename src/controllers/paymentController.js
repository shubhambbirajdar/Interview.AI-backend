const Razorpay = require('razorpay');
const crypto = require('crypto');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config/constants');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        if (!amount) {
            return res.status(400).json({ 
                error: 'Amount is required',
                details: 'Please provide amount in smallest currency unit (paise for INR)'
            });
        }

        const options = {
            amount: amount, // amount in smallest currency unit (paise for INR)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {}
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: {
                id: order.id,
                entity: order.entity,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                created_at: order.created_at
            },
            key_id: RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ 
            error: 'Error creating order',
            details: error.message 
        });
    }
};

// Verify Razorpay payment signature
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                error: 'Missing payment verification parameters',
                details: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
            });
        }

        // Create signature string
        const sign = razorpay_order_id + '|' + razorpay_payment_id;

        // Create expected signature
        const expectedSign = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        // Compare signatures
        if (razorpay_signature === expectedSign) {
            // Signature verified - Payment is successful
            // Here you can update your database, send confirmation emails, etc.
            
            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Invalid signature',
                details: 'Payment verification failed'
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            error: 'Error verifying payment',
            details: error.message 
        });
    }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
    try {
        const { payment_id } = req.params;

        if (!payment_id) {
            return res.status(400).json({ 
                error: 'Payment ID is required'
            });
        }

        const payment = await razorpay.payments.fetch(payment_id);

        res.json({
            success: true,
            payment: {
                id: payment.id,
                entity: payment.entity,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                order_id: payment.order_id,
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                created_at: payment.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ 
            error: 'Error fetching payment details',
            details: error.message 
        });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const { order_id } = req.params;

        if (!order_id) {
            return res.status(400).json({ 
                error: 'Order ID is required'
            });
        }

        const order = await razorpay.orders.fetch(order_id);

        res.json({
            success: true,
            order: {
                id: order.id,
                entity: order.entity,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                attempts: order.attempts,
                created_at: order.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ 
            error: 'Error fetching order details',
            details: error.message 
        });
    }
};

// Capture payment (for authorized payments)
exports.capturePayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { amount, currency = 'INR' } = req.body;

        if (!payment_id || !amount) {
            return res.status(400).json({ 
                error: 'Payment ID and amount are required'
            });
        }

        const payment = await razorpay.payments.capture(payment_id, amount, currency);

        res.json({
            success: true,
            message: 'Payment captured successfully',
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Error capturing payment:', error);
        res.status(500).json({ 
            error: 'Error capturing payment',
            details: error.message 
        });
    }
};

// Create refund
exports.createRefund = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { amount, notes } = req.body;

        if (!payment_id) {
            return res.status(400).json({ 
                error: 'Payment ID is required'
            });
        }

        const refundOptions = {
            payment_id: payment_id
        };

        if (amount) {
            refundOptions.amount = amount; // Partial refund
        }

        if (notes) {
            refundOptions.notes = notes;
        }

        const refund = await razorpay.payments.refund(payment_id, refundOptions);

        res.json({
            success: true,
            message: 'Refund initiated successfully',
            refund: {
                id: refund.id,
                entity: refund.entity,
                amount: refund.amount,
                currency: refund.currency,
                payment_id: refund.payment_id,
                status: refund.status,
                created_at: refund.created_at
            }
        });

    } catch (error) {
        console.error('Error creating refund:', error);
        res.status(500).json({ 
            error: 'Error creating refund',
            details: error.message 
        });
    }
};
