## 🏗️ Architecture

The service consists of three main components:

1. **REST API** - Express.js server for upload and metadata retrieval
2. **AWS Lambda** - Serverless function for file metadata extraction
3. **Storage** - AWS S3 for files and DynamoDB for metadata

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  Express    │───▶│     S3      │
│             │    │  TypeScript │    │  Storage    │
└─────────────┘    │     API     │    └─────────────┘
                   └─────────────┘           │
                          │                  │S3 Event
                          ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  DynamoDB   │◀───│   Lambda    │
                   │  Metadata   │    │ Processor   │
                   └─────────────┘    └─────────────┘
```

## 🚀 Features

### ✅ Implemented

- **File Upload**: `/upload` endpoint with support for multiple file types
- **S3 Storage**: Secure upload organized by date/ID
- **Validation**: File type, size (50MB max) and input data
- **Metadata Extraction**: Automatic processing via Lambda
- **Retrieval**: `/metadata/{file_id}` endpoint to query metadata
- **Supported Types**:
  - PDFs (pages, text, metadata)
  - Images (dimensions, format, EXIF)
  - Text (content analysis)
  - Word documents
- **Error Handling**: Robust middleware with logging
- **Health Check**: Health endpoint for monitoring
- **Docker**: Complete containerization with multi-stage build
- **LocalStack**: Local environment for development
- **NoSQL**: DynamoDB for metadata storage

## 📁 Project Structure

```
upload-file-test-aws/
├── src/
│   ├── controllers/         # API controllers
│   │   └── fileController.ts
│   ├── services/           # AWS services (S3, DynamoDB)
│   │   ├── s3Service.ts
│   │   └── dynamoService.ts
│   ├── middleware/         # Middlewares (upload, error)
│   │   ├── errorHandler.ts
│   │   └── upload.ts
│   ├── lambda/             # Lambda function
│   │   └── metadataExtractor.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── utils/              # Utilities
│   │   ├── fileUtils.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── app.ts              # Express application
│   └── index.ts            # Entry point
├── localstack/             # LocalStack configuration
│   ├── init-aws.sh        # AWS initialization script
│   ├── cors-config.json   # S3 CORS configuration
│   └── localstack.conf    # LocalStack configuration
├── docker-compose.yml      # Container orchestration
├── Dockerfile             # Application build
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Lambda build
└── .env                   # Environment variables
```

## 🛠️ Technologies

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **AWS SDK**: v3 (S3, DynamoDB, Lambda)
- **Processing**: Sharp (images), PDF-Parse (PDFs)
- **Validation**: Joi
- **Upload**: Multer
- **Logging**: Winston
- **Tests**: Jest
- **Build**: Webpack (Lambda), TSC (application)
- **Container**: Docker with Alpine Linux
- **Development**: LocalStack for local AWS

## ⚡ Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- AWS CLI (for deployment)

### 1. Clone and Configure

```bash
git clone <repository>
cd upload-file-test-aws

# Install dependencies (optional, already included in Docker)
npm install
```

### 2. Start Development Environment

```bash
# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# Check logs
docker-compose logs -f app
```

### 3. Test the API

```bash
# Health check
curl http://localhost:3000/health

# File upload
curl -X POST http://localhost:3000/upload \
  -F "file=@example.pdf" \
  -F 'userMetadata={"author":"John","description":"Test document"}'

# Query metadata (use the returned file_id)
curl http://localhost:3000/metadata/{file_id}
```

## 📚 API Endpoints

### POST /upload
Upload file with user metadata.

**Request:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@document.pdf" \
  -F 'userMetadata={
    "author": "John Silva",
    "expirationDate": "2024-12-31",
    "description": "Important document",
    "tags": ["important", "work"]
  }'
```

**Response:**
```json
{
  "success": true,
  "fileId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "File uploaded successfully"
}
```

### GET /metadata/{file_id}
Retrieve metadata for a specific file.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "status": "processed",
    "userMetadata": {
      "author": "John Silva",
      "description": "Important document"
    },
    "extractedMetadata": {
      "pages": 5,
      "textContent": "Extracted content...",
      "fileType": "application/pdf"
    }
  }
}
```

### GET /download/{file_id}
Generate temporary URL for file download.

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/bucket/file?signature=...",
  "expiresIn": 3600
}
```

### DELETE /files/{file_id}
Remove file and metadata.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566

# S3
S3_BUCKET=upload-test-bucket

# DynamoDB
DYNAMODB_TABLE=file-metadata

# Lambda
LAMBDA_FUNCTION_NAME=file-metadata-extractor
```

## 🧪 Development

### Run Locally

```bash
# Compile TypeScript
npm run build

# Development mode (auto-reload)
npm run dev

# Run tests
npm test

# Linting
npm run lint
npm run lint:fix
```

### Data Structure

#### FileMetadata (DynamoDB)
```typescript
{
  id: string;                    // File UUID
  originalName: string;          // Original name
  mimeType: string;             // MIME type
  size: number;                 // Size in bytes
  s3Key: string;                // S3 key
  uploadedAt: string;           // Upload date ISO
  status: FileStatus;           // Processing status
  userMetadata: UserMetadata;   // User metadata
  extractedMetadata?: ExtractedMetadata; // Extracted metadata
}
```

## 🚢 AWS Deployment

### 1. Prepare Infrastructure

```bash
# Create S3 bucket
aws s3 mb s3://my-upload-bucket

# Create DynamoDB table
aws dynamodb create-table \
  --table-name file-metadata \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 2. Lambda Deployment

```bash
# Build Lambda function
npm run lambda:build

# Deploy
aws lambda create-function \
  --function-name file-metadata-extractor \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler lambda.handler \
  --zip-file fileb://dist/lambda.zip
```

### 3. API Deployment

```bash
# Build Docker image
docker build -t upload-service .

# Push to ECR/registry of your choice
docker tag upload-service:latest {registry}/upload-service:latest
docker push {registry}/upload-service:latest
```

## 🔍 Monitoring and Logs

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Application logs
docker-compose logs -f app

# LocalStack logs
docker-compose logs -f localstack

# Specific logs
docker-compose exec app tail -f logs/combined.log
```

### Common Issues

1. **LocalStack doesn't start**: Check if Docker is running and port 4566 is not in use
2. **Upload fails**: Check if S3 bucket exists in LocalStack
3. **Lambda doesn't process**: Check if DynamoDB table was created
4. **Permission error**: Check AWS credentials and IAM policies

### Debug

```bash
# Check AWS services status
curl http://localhost:4566/_localstack/health

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Check DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

### Architecture
- **Microservices**: Clear separation between API, processing and storage
- **Event-driven**: Lambda triggered by S3 events
- **TypeScript**: Type safety and better DX
- **Docker**: Portability and consistency across environments
- **Serverless-first**: Use of managed AWS services

### AWS Services
- **S3**: Durable and scalable file storage
- **DynamoDB**: NoSQL for metadata with fast access and scalability
- **Lambda**: On-demand serverless processing
- **No relational database**: DynamoDB offers better performance and scalability for metadata

### Error Handling
- **Graceful degradation**: Continues working even if extraction fails
- **Retry logic**: Processing can be re-executed
- **Structured logging**: For debugging and monitoring

### Performance
- **Streaming**: Direct upload to S3 without storing on disk
- **Memory storage**: Multer in memory for ephemeral containers
- **Compression**: Compression middleware for responses