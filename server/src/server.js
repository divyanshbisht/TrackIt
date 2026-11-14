const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, getDBStatus } = require('./config/db');
const { isOpenAIConfigured } = require('./config/openai');
const { optionalAuth } = require('./middleware/authMiddleware');
const aiRoutes = require('./routes/aiRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(optionalAuth);

// Request logger for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrackIt API',
    mongoConnected: getDBStatus(),
    openaiReady: isOpenAIConfigured(),
  });
});

// Serve static frontend build from client/dist
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workouts', workoutRoutes);

// SPA Fallback for client routing (serves index.html for all non-API GET requests)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 Handler for unhandled non-GET requests
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start server and connect DB
const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🚀 TrackIt API Server running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   MongoDB: Connecting...`);
    console.log(`   OpenAI: ${isOpenAIConfigured() ? 'Configured' : 'Smart fallback parser ready'}`);
    console.log(`=========================================`);
  });

  // Non-blocking DB connection
  connectDB().catch((err) => {
    console.warn('[MongoDB Warning] Initial connection attempt error:', err.message);
  });

  return server;
};

try {
  startServer();
} catch (err) {
  console.error('Fatal server startup error:', err);
}

module.exports = app;
