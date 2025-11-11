/**
 * Server entry point
 */

import app from './app';
import config from './config';

const PORT = config.server.port;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${config.server.environment}`);
  console.log(`☁️  AWS Endpoint: ${config.aws.endpointUrl}`);
  console.log(`🪣 S3 Bucket: ${config.aws.s3.bucket}`);
  console.log(`🗄️  DynamoDB Table: ${config.aws.dynamodb.tableName}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

export default server;