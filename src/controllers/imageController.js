const axios = require('axios');
const FormData = require('form-data');
const { HUGGINGFACE_API_KEY, HUGGINGFACE_API_URL, IMGBB_API_KEY } = require('../config/constants');

// Generate image using AI
exports.createImage = async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            `${HUGGINGFACE_API_URL}meta-llama/Llama-3.3-70B-Instruct`,
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                responseType: "arraybuffer"
            }
        );
        const url = await uploadImageToImgbb(response.data);
        return res.status(200).json({ data: url });
    } catch (error) {
        return res.status(500).json({ error: 'Image generation error', details: error.message });
    }
};

// Upload image to Imgbb
const uploadImageToImgbb = async (imageBuffer) => {
    const form = new FormData();
    form.append('image', imageBuffer, { filename: 'image.jpg' });
    try {
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?expiration=600&key=${IMGBB_API_KEY}`, 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                },
            }
        );
        const imageUrl = response.data.data.url;
        return imageUrl;
    } catch (error) {
        throw new Error(`Image upload error: ${error.message}`);
    }
};

module.exports.uploadImageToImgbb = uploadImageToImgbb;
