#!/bin/bash
# =============================================================================
# MIGRATION SQLITE → POSTGRESQL
# Harp E-Commerce Database Migration Script
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "   HARP E-COMMERCE DATABASE MIGRATION"
echo "   SQLite → PostgreSQL"
echo "=============================================="
echo -e "${NC}"

# =============================================================================
# CONFIGURATION - EDIT THESE VALUES
# =============================================================================
SQLITE_PATH="${SQLITE_PATH:-./prisma/dev.db}"
POSTGRES_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/harp_prod}"

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================
echo -e "${YELLOW}[1/7] Pre-flight checks...${NC}"

# Check if SQLite file exists
if [ ! -f "$SQLITE_PATH" ]; then
    echo -e "${RED}ERROR: SQLite database not found at $SQLITE_PATH${NC}"
    exit 1
fi
echo -e "  ✓ SQLite database found: $SQLITE_PATH"

# Check if pgloader is installed
if ! command -v pgloader &> /dev/null; then
    echo -e "${RED}ERROR: pgloader is not installed${NC}"
    echo -e "Install with: brew install pgloader (macOS) or apt install pgloader (Linux)"
    exit 1
fi
echo -e "  ✓ pgloader is installed"

# Check PostgreSQL connection
if ! psql "$POSTGRES_URL" -c '\q' 2>/dev/null; then
    echo -e "${RED}ERROR: Cannot connect to PostgreSQL${NC}"
    echo -e "Check your DATABASE_URL environment variable"
    exit 1
fi
echo -e "  ✓ PostgreSQL connection successful"

# =============================================================================
# BACKUP SQLITE
# =============================================================================
echo -e "${YELLOW}[2/7] Creating SQLite backup...${NC}"
BACKUP_FILE="./prisma/backup_$(date +%Y%m%d_%H%M%S).db"
cp "$SQLITE_PATH" "$BACKUP_FILE"
echo -e "  ✓ Backup created: $BACKUP_FILE"

# =============================================================================
# CREATE PGLOADER COMMAND FILE
# =============================================================================
echo -e "${YELLOW}[3/7] Preparing pgloader configuration...${NC}"

PGLOADER_CMD=$(mktemp)
cat > "$PGLOADER_CMD" << EOF
LOAD DATABASE
    FROM sqlite://$SQLITE_PATH
    INTO $POSTGRES_URL

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB'

CAST type string to text,
     type integer to integer,
     type real to double precision,
     type blob to bytea

BEFORE LOAD DO
    \$\$ DROP SCHEMA IF EXISTS public CASCADE; \$\$,
    \$\$ CREATE SCHEMA public; \$\$;
EOF

echo -e "  ✓ pgloader configuration ready"

# =============================================================================
# RUN MIGRATION
# =============================================================================
echo -e "${YELLOW}[4/7] Running pgloader migration...${NC}"
echo -e "${BLUE}  This may take a few minutes depending on data size...${NC}"

pgloader "$PGLOADER_CMD"

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Data migration completed${NC}"
else
    echo -e "  ${RED}✗ Migration failed${NC}"
    rm "$PGLOADER_CMD"
    exit 1
fi

rm "$PGLOADER_CMD"

# =============================================================================
# UPDATE PRISMA SCHEMA
# =============================================================================
echo -e "${YELLOW}[5/7] Updating Prisma schema for PostgreSQL...${NC}"

# Backup current schema
cp ./prisma/schema.prisma ./prisma/schema.prisma.sqlite.backup

# Update provider
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' ./prisma/schema.prisma
echo -e "  ✓ Schema updated to PostgreSQL provider"

# =============================================================================
# SYNC PRISMA
# =============================================================================
echo -e "${YELLOW}[6/7] Syncing Prisma with PostgreSQL...${NC}"

export DATABASE_URL="$POSTGRES_URL"

# Generate new Prisma Client
npx prisma generate
echo -e "  ✓ Prisma Client generated"

# Push schema (without migrations for imported data)
npx prisma db push --accept-data-loss
echo -e "  ✓ Schema pushed to PostgreSQL"

# =============================================================================
# VERIFICATION
# =============================================================================
echo -e "${YELLOW}[7/7] Verifying migration...${NC}"

# Count rows in key tables
echo -e "  Checking data integrity..."

PRODUCT_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM \"Product\"" 2>/dev/null | tr -d ' ')
ORDER_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM \"Order\"" 2>/dev/null | tr -d ' ')
USER_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM \"User\"" 2>/dev/null | tr -d ' ')

echo -e "  Products: $PRODUCT_COUNT"
echo -e "  Orders: $ORDER_COUNT"
echo -e "  Users: $USER_COUNT"

# =============================================================================
# COMPLETE
# =============================================================================
echo -e "${GREEN}"
echo "=============================================="
echo "   MIGRATION COMPLETE!"
echo "=============================================="
echo -e "${NC}"
echo -e "Next steps:"
echo -e "  1. Update .env with new DATABASE_URL"
echo -e "  2. Run: npm test (verify tests pass)"
echo -e "  3. Deploy to staging first"
echo -e "  4. Verify all functionality"
echo -e ""
echo -e "Backups created:"
echo -e "  - SQLite: $BACKUP_FILE"
echo -e "  - Schema: ./prisma/schema.prisma.sqlite.backup"
echo -e ""
echo -e "${YELLOW}⚠️  Remember to configure automatic PostgreSQL backups!${NC}"
