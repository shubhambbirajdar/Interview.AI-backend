const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
    audioUrl: {
        type: String,
        required: true
    },
    transcriptionId: {
        type: String,
        required: true
    },
    text: {
        type: String
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    },
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview'
    },
    error: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transcription', transcriptionSchema);
