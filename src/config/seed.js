require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

const questions = [
    {
        category: 'JavaScript',
        question: 'Explain the concept of closure in JavaScript and provide an example.',
        difficulty: 'medium'
    },
    {
        category: 'React',
        question: 'Describe the lifecycle methods of a React component and their use cases.',
        difficulty: 'medium'
    },
    {
        category: 'JavaScript',
        question: 'What is the difference between null and undefined in JavaScript? Provide examples.',
        difficulty: 'easy'
    },
    {
        category: 'React',
        question: 'Explain the concept of state and props in React and how they differ.',
        difficulty: 'easy'
    },
    {
        category: 'JavaScript',
        question: 'Describe the differences between var, let, and const in JavaScript.',
        difficulty: 'easy'
    },
    {
        category: 'React',
        question: 'What is the purpose of the useContext hook in React? Provide an example.',
        difficulty: 'medium'
    },
    {
        category: 'JavaScript',
        question: 'Explain the concept of asynchronous programming in JavaScript and provide an example.',
        difficulty: 'medium'
    },
    {
        category: 'React',
        question: 'Describe the differences between functional and class components in React.',
        difficulty: 'easy'
    },
    {
        category: 'JavaScript',
        question: 'What is the purpose of the this keyword in JavaScript? Provide examples.',
        difficulty: 'medium'
    },
    {
        category: 'React',
        question: 'Explain the concept of React hooks and provide examples of their usage.',
        difficulty: 'medium'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-ai', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // Clear existing questions
        await Question.deleteMany({});
        console.log('Cleared existing questions');

        // Insert new questions
        await Question.insertMany(questions);
        console.log('Questions seeded successfully');

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
