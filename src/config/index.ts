/**
 * Application configuration
 */

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
  },

  // AWS configuration
  aws: {
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    endpointUrl: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    
    // S3 configuration
    s3: {
      bucket: process.env.S3_BUCKET || 'upload-test-bucket',
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    },

    // DynamoDB configuration
    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE || 'file-metadata',
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    },

    // Lambda configuration
    lambda: {
      functionName: process.env.LAMBDA_FUNCTION_NAME || 'file-metadata-extractor',
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    },
  },

  // File upload configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    uploadPath: './uploads',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
};

export default config;