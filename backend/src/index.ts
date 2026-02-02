import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, closePool } from './db/connection.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import schoolsRouter from './routes/schools.js';
import planningBlocksRouter from './routes/planningBlocks.js';
import optionsRouter from './routes/options.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// API routes
app.use('/api/schools', schoolsRouter);
app.use('/api/planning-blocks', planningBlocksRouter);
app.use('/api/options', optionsRouter);

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'BCPS Redistricting API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      schools: '/api/schools',
      schoolById: '/api/schools/:id',
      planningBlocks: '/api/planning-blocks',
      planningBlockById: '/api/planning-blocks/:id',
      options: '/api/options',
      optionById: '/api/options/:id',
      optionStats: '/api/options/:id/stats',
      createOption: 'POST /api/options',
      updateOption: 'PUT /api/options/:id',
      deleteOption: 'DELETE /api/options/:id',
    },
  });
});

// 404 handler (must be after all other routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log('=====================================');
  console.log('BCPS Redistricting API');
  console.log('=====================================');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS origin: ${CORS_ORIGIN}`);
  console.log('=====================================');
  
  // Test database connection on startup
  const dbHealthy = await testConnection();
  if (!dbHealthy) {
    console.error('⚠ Warning: Database connection failed');
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  
  server.close(async () => {
    console.log('✓ HTTP server closed');
    
    await closePool();
    
    console.log('✓ Shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠ Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
