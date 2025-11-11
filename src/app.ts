/**
 * Main Express application
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { FileController } from './controllers/fileController';
import { uploadSingle, handleMulterError } from './middleware/upload';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import config from './config';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize controllers
const fileController = new FileController();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.post(
  '/upload',
  uploadSingle,
  handleMulterError,
  asyncHandler(fileController.uploadFile)
);

app.get(
  '/metadata/:fileId',
  asyncHandler(fileController.getMetadata)
);

app.delete(
  '/files/:fileId',
  asyncHandler(fileController.deleteFile)
);

app.get(
  '/download/:fileId',
  asyncHandler(fileController.getDownloadUrl)
);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;