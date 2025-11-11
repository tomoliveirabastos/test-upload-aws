/**
 * Validation utilities using Joi
 */

import Joi from 'joi';

// Schema for file upload validation
export const uploadSchema = Joi.object({
  userMetadata: Joi.object({
    author: Joi.string().min(1).max(255).optional(),
    expirationDate: Joi.date().iso().greater('now').optional(),
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  }).required(),
});

// Schema for file ID validation
export const fileIdSchema = Joi.object({
  fileId: Joi.string().uuid().required(),
});

// Validate file type
export const validateFileType = (mimeType: string): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  return allowedTypes.includes(mimeType);
};

// Validate file size
export const validateFileSize = (size: number, maxSize: number = 50 * 1024 * 1024): boolean => {
  return size <= maxSize;
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};