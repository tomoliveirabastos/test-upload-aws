/**
 * DynamoDB Service for metadata operations
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import config from '../config';
import { FileMetadata } from '../types';

export class DynamoDBService {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      endpoint: config.aws.endpointUrl,
    });

    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.tableName = config.aws.dynamodb.tableName;
  }

  /**
   * Save file metadata to DynamoDB
   */
  async saveMetadata(metadata: FileMetadata): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...metadata,
          uploadedAt: metadata.uploadedAt || new Date().toISOString(),
        },
      });

      await this.docClient.send(command);
    } catch (error) {
      throw new Error(`Failed to save metadata to DynamoDB: ${(error as Error).message}`);
    }
  }

  /**
   * Get file metadata from DynamoDB
   */
  async getMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id: fileId },
      });

      const result = await this.docClient.send(command);
      
      return result.Item as FileMetadata || null;
    } catch (error) {
      throw new Error(`Failed to get metadata from DynamoDB: ${(error as Error).message}`);
    }
  }

  /**
   * Update file metadata in DynamoDB
   */
  async updateMetadata(
    fileId: string, 
    updates: Partial<FileMetadata>
  ): Promise<void> {
    try {
      // Build update expression and attribute values
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      });

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id: fileId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await this.docClient.send(command);
    } catch (error) {
      throw new Error(`Failed to update metadata in DynamoDB: ${(error as Error).message}`);
    }
  }

  /**
   * Delete file metadata from DynamoDB
   */
  async deleteMetadata(fileId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id: fileId },
      });

      await this.docClient.send(command);
    } catch (error) {
      throw new Error(`Failed to delete metadata from DynamoDB: ${(error as Error).message}`);
    }
  }

  /**
   * Update file status
   */
  async updateFileStatus(fileId: string, status: string): Promise<void> {
    await this.updateMetadata(fileId, { 
      status: status as any
    });
  }

  /**
   * Add extracted metadata to file record
   */
  async addExtractedMetadata(fileId: string, extractedMetadata: any): Promise<void> {
    await this.updateMetadata(fileId, { 
      extractedMetadata,
      status: 'processed' as any
    });
  }
}