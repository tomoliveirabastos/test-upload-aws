/**
 * Multer configuration for file uploads
 */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';
import config from '../config';

// Memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  // Check if file type is allowed
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new AppError('Invalid file type', 400));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 50MB
    files: 1, // Only one file at a time
  },
});

// Single file upload middleware
export const uploadSingle = upload.single('file');

// Handle multer errors
export const handleMulterError = (
  error: any,
  req: Request,
  res: any,
  next: any
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Upload one file at a time'
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name. Use "file" field for upload'
      });
    }
  }
  
  next(error);
};