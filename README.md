# Interview.AI Backend

A Node.js/Express backend application for AI-powered interview assessments with MongoDB integration.

## Project Structure

```
interview.ai-b/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection configuration
│   │   ├── constants.js      # Application constants and environment variables
│   │   └── seed.js          # Database seeding script
│   ├── models/
│   │   ├── Question.js      # Question schema
│   │   ├── Interview.js     # Interview session schema
│   │   └── Transcription.js # Audio transcription schema
│   ├── controllers/
│   │   ├── questionController.js      # Question CRUD operations
│   │   ├── interviewController.js     # Interview management
│   │   ├── transcriptionController.js # Audio transcription & AI evaluation
│   │   └── imageController.js         # AI image generation
│   └── routes/
│       ├── questionRoutes.js
│       ├── interviewRoutes.js
│       ├── transcriptionRoutes.js
│       ├── imageRoutes.js
│       └── index.js          # Route aggregator
├── index.js                  # Application entry point
├── package.json
└── .env

```

## Features

- **MongoDB Integration**: Persistent storage for questions, interviews, and transcriptions
- **RESTful API**: Well-organized routes with proper separation of concerns
- **Audio Transcription**: Integration with AssemblyAI for audio-to-text conversion
- **AI Evaluation**: Automated answer evaluation using OpenRouter AI
- **Image Generation**: AI-powered image generation using HuggingFace models
- **MVC Architecture**: Clean separation of models, controllers, and routes

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install MongoDB (if not already installed)

3. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/interview-ai
ASSEMBLYAI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
IMGBB_API_KEY=your_key_here
PORT=5000
NODE_ENV=development
```

4. Seed the database with initial questions:
```bash
npm run seed
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get question by ID
- `GET /api/questions/category/:category` - Get questions by category
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question (soft delete)

### Interviews
- `GET /api/interviews` - Get all interviews
- `GET /api/interviews/:id` - Get interview by ID
- `POST /api/interviews` - Create new interview
- `PUT /api/interviews/:id` - Update interview
- `POST /api/interviews/:id/complete` - Mark interview as complete
- `DELETE /api/interviews/:id` - Delete interview

### Transcription
- `POST /api/transcribe` - Transcribe audio and evaluate answer

### Image Generation
- `POST /api/image/create` - Generate AI image

### Health Check
- `GET /health` - Server health check

## Models

### Question
- category: String
- question: String
- difficulty: String (easy/medium/hard)
- isActive: Boolean
- timestamps

### Interview
- candidateName: String
- candidateEmail: String
- questions: Array of question responses
- totalScore: Number
- status: String (in-progress/completed/abandoned)
- startedAt: Date
- completedAt: Date
- timestamps

### Transcription
- audioUrl: String
- transcriptionId: String
- text: String
- status: String (processing/completed/failed)
- questionId: ObjectId
- interviewId: ObjectId
- error: String
- timestamps

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **AssemblyAI** - Audio transcription
- **OpenRouter AI** - Answer evaluation
- **HuggingFace** - AI model integration
- **Axios** - HTTP client

## License

ISC
"# Interview.AI-backend" 
