#!/bin/bash

###############################################################################
# =€ PayStream AI - Quick Setup Script
# Sets up all required APIs and infrastructure for the integration
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW"
echo "Q         PayStream AI - API Integration Setup              Q"
echo "ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]"
echo -e "${NC}"

# Function to print section headers
section() {
    echo ""
    echo -e "${CYAN}¶ $1${NC}"
    echo ""
}

# Function to print success
success() {
    echo -e "${GREEN} $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}  $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED} $1${NC}"
}

# Function to print info
info() {
    echo -e "${BLUE}9 $1${NC}"
}

# Check if .env.local exists
section "1. Checking Environment Configuration"
if [ -f ".env.local" ]; then
    success ".env.local file found"
else
    error ".env.local file not found!"
    info "Creating from .env.example..."
    cp .env.example .env.local
    success "Created .env.local - Please configure your API keys"
fi

# Check required environment variables
section "2. Validating API Keys"

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2)

    if [ -z "$var_value" ] || [ "$var_value" = "your_${var_name,,}_here" ] || [[ "$var_value" == *"your_"* ]]; then
        warning "${var_name} not configured"
        return 1
    else
        success "${var_name} configured"
        return 0
    fi
}

# Check critical APIs
MISSING_KEYS=0

check_env_var "GEMINI_API_KEY" || ((MISSING_KEYS++))
check_env_var "AIMLAPI_KEY" || ((MISSING_KEYS++))

# Check Qdrant (optional for local)
QDRANT_URL=$(grep "^QDRANT_URL=" .env.local | cut -d'=' -f2)
if [[ "$QDRANT_URL" == *"localhost"* ]]; then
    info "Qdrant configured for local Docker"
else
    check_env_var "QDRANT_API_KEY" || ((MISSING_KEYS++))
fi

# Check dependencies
section "3. Checking Dependencies"
if [ -d "node_modules" ]; then
    success "node_modules found"
else
    warning "Dependencies not installed"
    info "Installing dependencies..."
    npm install
    success "Dependencies installed"
fi

# Check for Qdrant client
if [ -d "node_modules/@qdrant" ]; then
    success "Qdrant client installed"
else
    warning "Qdrant client not found"
    info "Installing @qdrant/js-client-rest..."
    npm install @qdrant/js-client-rest
    success "Qdrant client installed"
fi

# Check Docker (for local Qdrant)
section "4. Checking Docker for Qdrant"
if command -v docker &> /dev/null; then
    success "Docker is installed"

    # Check if Qdrant container is running
    if docker ps | grep -q qdrant; then
        success "Qdrant container is running"
    else
        warning "Qdrant container not running"
        info "Start with: docker run -p 6333:6333 -p 6334:6334 -v \$(pwd)/qdrant_storage:/qdrant/storage:z qdrant/qdrant"
    fi
else
    warning "Docker not found (needed for local Qdrant)"
    info "Install Docker from: https://docs.docker.com/get-docker/"
    info "Or use Qdrant Cloud: https://cloud.qdrant.io/"
fi

# Summary
section "5. Setup Summary"

if [ $MISSING_KEYS -eq 0 ]; then
    success "All required API keys are configured!"
else
    warning "$MISSING_KEYS API key(s) need configuration"
    echo ""
    info "Please update .env.local with your API keys:"
    echo ""
    echo "  " Gemini AI:  https://ai.google.dev/"
    echo "  " AI/ML API:  https://aimlapi.com/app/keys"
    echo "  " Qdrant:     https://cloud.qdrant.io/ (or use local Docker)"
    echo "  " Opus:       https://app.opus.com/signup (optional)"
fi

# Next steps
section "6. Next Steps"
echo ""
echo "To test all API connections:"
echo -e "  ${GREEN}npm run test:apis${NC}"
echo ""
echo "To start local Qdrant (if using Docker):"
echo -e "  ${GREEN}docker run -p 6333:6333 -p 6334:6334 -v \$(pwd)/qdrant_storage:/qdrant/storage:z qdrant/qdrant${NC}"
echo ""
echo "To start the development server:"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""

# Documentation
info "=Ö Full setup guide: API_SETUP_GUIDE.md"
echo ""

if [ $MISSING_KEYS -eq 0 ]; then
    echo -e "${GREEN} Setup complete! Ready to integrate.${NC}"
else
    echo -e "${YELLOW}  Please configure missing API keys in .env.local${NC}"
fi

echo ""
