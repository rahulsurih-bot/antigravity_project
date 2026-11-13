import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env, validateConfig } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import apiRoutes from './routes/index.js';

validateConfig();

const app = express();

// Security Headers
app.use(helmet());

// CORS Policy
app.use(cors({
  origin: env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
app.use(generalLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API v1 Routes
app.use('/api/v1', apiRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AgriSmart AI - Intelligent Crop Advisory Assistant REST API',
    documentation: '/api/v1/health',
    version: '1.0.0'
  });
});

// 404 Catch-All
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    data: null,
    error: {
      code: 'ROUTE_NOT_FOUND',
      details: [`The requested endpoint ${req.originalUrl} does not exist.`]
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
