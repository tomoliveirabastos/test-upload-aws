/**
 * Base types for the file upload and metadata extraction service
 */

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  uploadedAt: string;
  userMetadata: UserMetadata;
  extractedMetadata?: ExtractedMetadata;
  status: FileStatus;
}

export interface UserMetadata {
  author?: string;
  expirationDate?: string;
  description?: string;
  tags?: string[];
  [key: string]: any; // Allow additional custom fields
}

export interface ExtractedMetadata {
  fileType: string;
  fileSize: number;
  pages?: number; // For PDFs
  dimensions?: {
    width: number;
    height: number;
  }; // For images
  textContent?: string; // Extracted text for PDFs
  createdDate?: string;
  modifiedDate?: string;
  encoding?: string;
  [key: string]: any; // Allow additional extracted fields
}

export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error'
}

export interface UploadRequest {
  file: Express.Multer.File;
  userMetadata: UserMetadata;
}

export interface UploadResponse {
  success: boolean;
  fileId?: string;
  message?: string;
  error?: string;
}

export interface MetadataResponse {
  success: boolean;
  data?: FileMetadata;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface S3UploadResult {
  key: string;
  bucket: string;
  location: string;
  etag: string;
}

export interface LambdaEvent {
  Records: Array<{
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    eventTime: string;
    eventName: string;
    s3: {
      bucket: {
        name: string;
      };
      object: {
        key: string;
        size: number;
      };
    };
  }>;
}

export interface LambdaContext {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis(): number;
}