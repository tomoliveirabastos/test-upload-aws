#!/bin/bash

# LocalStack initialization script
# This script is executed when LocalStack starts

echo "Starting LocalStack configuration..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be available..."
until curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; do
    echo "Waiting for LocalStack to initialize..."
    sleep 2
done

echo "LocalStack is ready! Configuring resources..."

# Configure AWS CLI to use LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Create S3 bucket for uploads
echo "Creating S3 bucket..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://upload-test-bucket

# Configure CORS for S3 bucket
echo "Configuring CORS for S3 bucket..."
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
    --bucket upload-test-bucket \
    --cors-configuration file:///docker-entrypoint-initaws.d/cors-config.json

# Criar tabela DynamoDB (exemplo)
echo "DynamoDB..."
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name file-metadata \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5

# Create SQS queue (example)
echo "Creating SQS queue..."
aws --endpoint-url=http://localhost:4566 sqs create-queue \
    --queue-name file-processing-queue

# Create SNS topic (example)
echo "Creating SNS topic..."
aws --endpoint-url=http://localhost:4566 sns create-topic \
    --name file-upload-notifications

echo "LocalStack configuration completed!"