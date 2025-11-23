#!/bin/bash
set -e

echo "============================================"
echo "🚀 ZaloPay Merchant Platform - Codespaces Setup"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Create required directories
print_step "Creating required directories..."
mkdir -p backend/storage/identity/card_images
mkdir -p backend/storage/identity/transaction_history
mkdir -p backend/storage/documents/business_licenses
mkdir -p backend/storage/documents/representative_ids
mkdir -p backend/storage/documents/business_location_photos
mkdir -p backend/storage/exports/gmail_data
mkdir -p backend/storage/exports/reports
mkdir -p backend/logs
chmod -R 755 backend/storage backend/logs
print_success "Directories created"

# Step 2: Setup environment files
print_step "Setting up environment files..."

# Copy database env if not exists
if [ ! -f docker-db.env ]; then
    cp docker-db.env.example docker-db.env
    print_success "Created docker-db.env from example"
else
    print_warning "docker-db.env already exists, skipping"
fi

# Copy backend env if not exists
if [ ! -f backend/.env.docker ]; then
    cp backend/env.docker.example backend/.env.docker 2>/dev/null || true
    print_success "Created backend/.env.docker"
else
    print_warning "backend/.env.docker already exists, skipping"
fi

# Step 3: Install backend dependencies
print_step "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

# Step 4: Generate Prisma client
print_step "Generating Prisma client..."
npm run db:generate
print_success "Prisma client generated"

# Step 5: Install admin frontend dependencies (if exists)
if [ -d "../static/admin" ]; then
    print_step "Installing admin frontend dependencies..."
    cd ../static/admin
    npm install
    print_success "Admin frontend dependencies installed"
    cd ../../backend
fi

# Step 6: Wait for database to be ready
print_step "Waiting for database to be ready..."
cd ..
sleep 5

# Check if postgres is running
if docker ps | grep -q zalopay-postgres; then
    print_success "PostgreSQL is running"
    
    # Step 7: Run database migrations
    print_step "Running database migrations..."
    cd backend
    npm run db:migrate || print_warning "Migration may have already been applied"
    
    # Step 8: Seed database
    print_step "Seeding database..."
    npm run db:seed || print_warning "Database may already be seeded"
    
    print_success "Database setup completed"
else
    print_warning "PostgreSQL is not running yet. You may need to start it manually with:"
    echo "  docker compose up -d postgres"
fi

cd ..

echo ""
echo "============================================"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo "============================================"
echo ""
echo "📝 Next steps:"
echo "  1. Review the CODESPACES_GUIDE.md for detailed instructions"
echo "  2. Start the backend server: cd backend && npm run dev"
echo "  3. Access the application at forwarded port 3000"
echo ""
echo "🔗 Useful commands:"
echo "  - Start database: docker compose up -d postgres"
echo "  - View logs: docker compose logs -f"
echo "  - Access backend: cd backend && npm run dev"
echo "  - Build admin UI: cd static/admin && npm run build"
echo ""
echo "📚 Documentation:"
echo "  - Codespaces Guide: ./CODESPACES_GUIDE.md"
echo "  - Deployment Guide: ./Deployment/DEPLOYMENT_GUIDE.md"
echo "  - Setup Guide: ./Docs/SETUP_GUIDE.md"
echo ""
