const axios = require('axios');
const FormData = require('form-data');
const { OPENROUTER_API_KEY, OPENROUTER_API_URL, IMGBB_API_KEY } = require('../config/constants');

// Generate image description/prompt using AI
exports.createImage = async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            OPENROUTER_API_URL,
            { 
                model: 'mistralai/mistral-7b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative AI assistant. Generate a detailed image prompt based on the user request. Return only the image prompt, nothing else.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        
        // For now, return the generated prompt. To generate actual images, use a dedicated image API
        const generatedPrompt = response.data.choices[0]?.message?.content || prompt;
        return res.status(200).json({ data: generatedPrompt, message: 'Image prompt generated. Use with image generation API (DALL-E, Stability AI, etc.)' });
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
