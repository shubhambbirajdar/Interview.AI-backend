require('dotenv').config();

module.exports = {
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    IMGBB_API_KEY: process.env.IMGBB_API_KEY,
    HUGGINGFACE_API_URL: 'https://api-inference.huggingface.co/models/',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    PORT: process.env.PORT || 5000
};
