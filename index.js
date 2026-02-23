const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require("node:dns/promises");
require('dotenv').config();

const connectDB = require('./src/config/database');
const routes = require('./src/routes');
const { PORT } = require('./src/config/constants');

dns.setServers(["1.1.1.1"]);
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);
app.use('/', routes); // Support root level endpoints for backward compatibility

// Lightweight liveness endpoint (no validation)
app.get('/is-live', (req, res) => {
    res.status(200).send('success web is active');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});