#!/bin/bash

# Script to test the file upload API
# Usage: ./test-api.sh

set -e

BASE_URL="http://localhost:3000"
TEST_FILE="test-document.txt"

echo "🧪 Testing File Upload API"
echo "=========================="

# Create test file
echo "Creating test file..."
echo "This is a test document for the upload service.
Contains multiple lines of text.
Date: $(date)
ID: $(uuidgen)" > $TEST_FILE

echo "✅ Test file created: $TEST_FILE"

# 1. Health Check
echo ""
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"

# 2. File upload
echo ""
echo "2️⃣ Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -F "file=@$TEST_FILE" \
  -F 'userMetadata={
    "author": "Test System",
    "description": "Automated test file",
    "tags": ["test", "automated"],
    "expirationDate": "2024-12-31T23:59:59Z"
  }')

echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extract file_id from response
FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.fileId' 2>/dev/null || echo "$UPLOAD_RESPONSE" | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

if [ "$FILE_ID" = "null" ] || [ -z "$FILE_ID" ]; then
    echo "❌ Error: Could not get file_id from upload"
    exit 1
fi

echo "📁 File ID: $FILE_ID"

# 3. Wait for processing
echo ""
echo "3️⃣ Waiting for Lambda processing..."
sleep 5

# 4. Query metadata
echo ""
echo "4️⃣ Querying metadata..."
curl -s "$BASE_URL/metadata/$FILE_ID" | jq '.' 2>/dev/null || curl -s "$BASE_URL/metadata/$FILE_ID"

# 5. Generate download URL
echo ""
echo "5️⃣ Generating download URL..."
curl -s "$BASE_URL/download/$FILE_ID" | jq '.' 2>/dev/null || curl -s "$BASE_URL/download/$FILE_ID"

# 6. Invalid file test
echo ""
echo "6️⃣ Testing invalid file upload..."
echo "malicious executable content" > test-invalid.exe
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -F "file=@test-invalid.exe" \
  -F 'userMetadata={"author":"test"}')

echo "$INVALID_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_RESPONSE"

# 7. Invalid file_id test
echo ""
echo "7️⃣ Testing query with invalid file_id..."
curl -s "$BASE_URL/metadata/invalid-id" | jq '.' 2>/dev/null || curl -s "$BASE_URL/metadata/invalid-id"

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -f $TEST_FILE test-invalid.exe

echo ""
echo "✅ Tests completed!"
echo ""
echo "🗑️  To delete the test file:"
echo "curl -X DELETE $BASE_URL/files/$FILE_ID"