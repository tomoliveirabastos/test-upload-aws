/**
 * File Upload Controller
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../services/s3Service';
import { DynamoDBService } from '../services/dynamoService';
import { FileMetadata, FileStatus, UploadResponse, MetadataResponse } from '../types';
import { generateS3Key, getMimeType } from '../utils/fileUtils';
import { validateFileType, validateFileSize } from '../utils/validation';

export class FileController {
  private s3Service: S3Service;
  private dynamoService: DynamoDBService;

  constructor() {
    this.s3Service = new S3Service();
    this.dynamoService = new DynamoDBService();
  }

  /**
   * Handle file upload
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        } as UploadResponse);
        return;
      }

      const { file } = req;
      const userMetadata = req.body.userMetadata ? JSON.parse(req.body.userMetadata) : {};

      // Validate file type
      if (!validateFileType(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type. Allowed types: PDF, Images (JPEG, PNG, GIF, WebP), Text, Word documents'
        } as UploadResponse);
        return;
      }

      // Validate file size (50MB max)
      if (!validateFileSize(file.size)) {
        res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 50MB'
        } as UploadResponse);
        return;
      }

      // Generate unique file ID and S3 key
      const fileId = uuidv4();
      const s3Key = generateS3Key(file.originalname, fileId);

      // Upload file to S3
      const uploadResult = await this.s3Service.uploadFile(
        s3Key,
        file.buffer,
        file.mimetype,
        {
          fileId,
          originalName: file.originalname,
          uploadedBy: userMetadata.author || 'anonymous',
        }
      );

      // Create metadata record
      const metadata: FileMetadata = {
        id: fileId,
        originalName: file.originalname,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        uploadedAt: new Date().toISOString(),
        userMetadata,
        status: FileStatus.UPLOADED,
      };

      // Save metadata to DynamoDB
      await this.dynamoService.saveMetadata(metadata);

      // Update status to processing (Lambda will be triggered)
      await this.dynamoService.updateFileStatus(fileId, FileStatus.PROCESSING);

      res.status(201).json({
        success: true,
        fileId,
        message: 'File uploaded successfully'
      } as UploadResponse);

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during upload'
      } as UploadResponse);
    }
  };

  /**
   * Get file metadata by ID
   */
  getMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;

      // Validate fileId format (should be UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file ID format'
        } as MetadataResponse);
        return;
      }

      // Get metadata from DynamoDB
      const metadata = await this.dynamoService.getMetadata(fileId);

      if (!metadata) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        } as MetadataResponse);
        return;
      }

      res.json({
        success: true,
        data: metadata
      } as MetadataResponse);

    } catch (error) {
      console.error('Metadata retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving metadata'
      } as MetadataResponse);
    }
  };

  /**
   * Delete file and metadata
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;

      // Get metadata first to get S3 key
      const metadata = await this.dynamoService.getMetadata(fileId);

      if (!metadata) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Delete from S3
      await this.s3Service.deleteFile(metadata.s3Key);

      // Delete metadata from DynamoDB
      await this.dynamoService.deleteMetadata(fileId);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting file'
      });
    }
  };

  /**
   * Get file download URL
   */
  getDownloadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;

      // Get metadata to get S3 key
      const metadata = await this.dynamoService.getMetadata(fileId);

      if (!metadata) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Generate presigned URL (valid for 1 hour)
      const downloadUrl = await this.s3Service.getPresignedUrl(metadata.s3Key, 3600);

      res.json({
        success: true,
        downloadUrl,
        expiresIn: 3600
      });

    } catch (error) {
      console.error('Download URL generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while generating download URL'
      });
    }
  };
}