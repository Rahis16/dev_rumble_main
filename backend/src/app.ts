import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import courseRoutes from './routes/courseRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
// Enable CORS for frontend client
app.use(cors({
  origin: 'http://localhost:3000', // Match your Next.js dev server URL
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/courses', courseRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    name: 'Mcode-Agent API',
    description: 'Advanced Agent-Based Live Coding Tutor & Co-Developer REST API',
    version: '2.0.0'
  });
});

// Fallback Route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

export default app;
