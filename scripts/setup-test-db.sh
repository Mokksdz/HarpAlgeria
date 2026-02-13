#!/bin/bash
# Setup test database for integration tests
# Requires: docker compose postgres service running (docker compose up -d)

set -e

echo "Setting up test database..."

# Check if Docker postgres is running
if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
  echo "Error: PostgreSQL container is not running."
  echo "Start it with: docker compose up -d"
  exit 1
fi

# Create test database if it doesn't exist
docker compose exec -T postgres psql -U harp -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'harp_test_db'" | grep -q 1 || \
  docker compose exec -T postgres psql -U harp -c "CREATE DATABASE harp_test_db"

# Push schema to test database
DATABASE_URL="postgresql://harp:harppass@localhost:5432/harp_test_db" \
  npx prisma db push --skip-generate --accept-data-loss

echo "Test database ready!"
echo "Run integration tests with: npm run test:integration"
