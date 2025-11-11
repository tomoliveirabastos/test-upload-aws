/**
 * File processing utilities
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mimeTypes from 'mime-types';

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueId = uuidv4();
  return `${sanitizedBaseName}_${uniqueId}${ext}`;
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Get MIME type from filename
export const getMimeType = (filename: string): string => {
  return mimeTypes.lookup(filename) || 'application/octet-stream';
};

// Ensure directory exists
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
};

// Delete file if exists
export const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};

// Format file size in human readable format
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Check if file is PDF
export const isPDF = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

// Check if file is image
export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

// Generate S3 key for file
export const generateS3Key = (filename: string, fileId: string): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `uploads/${timestamp}/${fileId}/${filename}`;
};