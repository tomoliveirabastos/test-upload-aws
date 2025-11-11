/**
 * AWS Lambda function for metadata extraction
 */

import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBService } from '../services/dynamoService';
import { ExtractedMetadata } from '../types';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

// AWS S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

// DynamoDB service instance
const dynamoService = new DynamoDBService();

/**
 * Lambda handler function
 */
export const handler = async (event: S3Event, context: Context): Promise<void> => {
  console.log('Lambda function triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      await processS3Record(record);
    } catch (error) {
      console.error('Error processing record:', error);
      // Continue processing other records even if one fails
    }
  }
};

/**
 * Process individual S3 record
 */
async function processS3Record(record: S3EventRecord): Promise<void> {
  const bucketName = record.s3.bucket.name;
  const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

  try {
    // Get file from S3
    const fileBuffer = await getFileFromS3(bucketName, objectKey);
    
    // Extract file ID from S3 key (format: uploads/YYYY-MM-DD/fileId/filename)
    const pathParts = objectKey.split('/');
    const fileId = pathParts[2]; // Assuming format: uploads/date/fileId/filename

    if (!fileId) {
      console.error('Could not extract file ID from S3 key:', objectKey);
      return;
    }

    // Get file metadata to determine MIME type
    const metadata = await dynamoService.getMetadata(fileId);
    if (!metadata) {
      console.error('File metadata not found for ID:', fileId);
      return;
    }

    // Extract metadata based on file type
    const extractedMetadata = await extractFileMetadata(fileBuffer, metadata.mimeType);

    // Update DynamoDB with extracted metadata
    await dynamoService.addExtractedMetadata(fileId, extractedMetadata);

    console.log(`Successfully processed file ${fileId}`);
  } catch (error) {
    console.error(`Error processing file ${objectKey}:`, error);
    throw error;
  }
}

/**
 * Get file from S3
 */
async function getFileFromS3(bucketName: string, objectKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('Empty response body from S3');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as any;
  
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Extract metadata based on file type
 */
async function extractFileMetadata(fileBuffer: Buffer, mimeType: string): Promise<ExtractedMetadata> {
  const metadata: ExtractedMetadata = {
    fileType: mimeType,
    fileSize: fileBuffer.length,
  };

  try {
    if (mimeType === 'application/pdf') {
      // Extract PDF metadata
      const pdfData = await pdfParse(fileBuffer);
      
      metadata.pages = pdfData.numpages;
      metadata.textContent = pdfData.text.substring(0, 5000); // Limit text content
      
      // Extract PDF info if available
      if (pdfData.info) {
        metadata.createdDate = pdfData.info.CreationDate;
        metadata.modifiedDate = pdfData.info.ModDate;
      }

    } else if (mimeType.startsWith('image/')) {
      // Extract image metadata using Sharp
      const imageData = await sharp(fileBuffer).metadata();
      
      metadata.dimensions = {
        width: imageData.width || 0,
        height: imageData.height || 0,
      };
      
      metadata.encoding = imageData.format;
      
      // Extract EXIF data if available
      if (imageData.exif) {
        // Add relevant EXIF data
        metadata.exifData = {
          density: imageData.density,
          hasProfile: imageData.hasProfile,
          hasAlpha: imageData.hasAlpha,
        };
      }

    } else if (mimeType === 'text/plain') {
      // Extract text content
      const textContent = fileBuffer.toString('utf8');
      metadata.textContent = textContent.substring(0, 5000); // Limit text content
      metadata.encoding = 'utf8';
      
      // Basic text analysis
      const lines = textContent.split('\n').length;
      const words = textContent.split(/\s+/).length;
      const characters = textContent.length;
      
      metadata.textAnalysis = {
        lines,
        words,
        characters,
      };

    } else {
      // For other file types, just return basic metadata
      metadata.fileType = mimeType;
    }

    return metadata;
    
  } catch (error) {
    console.error('Error extracting metadata:', error);
    
    // Return basic metadata if extraction fails
    return {
      fileType: mimeType,
      fileSize: fileBuffer.length,
      extractionError: (error as Error).message,
    };
  }
}