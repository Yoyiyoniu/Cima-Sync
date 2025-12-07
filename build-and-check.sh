#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LINUX_BUILD_OK=false
WINDOWS_BUILD_OK=false

section() { 
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════╝"
    echo ""
}

section "STARTING BUILD AND COMPLETE VERIFICATION"

section "STEP 1: Building for Linux..."
if ./scripts/build-linux.sh; then
    LINUX_BUILD_OK=true
    echo -e "${GREEN}✓ Linux build completed${NC}"
else
    echo -e "${RED}✗ Linux build failed${NC}"
fi

section "STEP 2: Building for Windows..."
if bun run build:windows; then
    WINDOWS_BUILD_OK=true
    echo -e "${GREEN}✓ Windows build completed${NC}"
else
    echo -e "${RED}✗ Windows build failed${NC}"
fi

section "STEP 3: Verifying Linux builds..."
./scripts/check-builds-linux.sh

section "STEP 4: Verifying Windows builds..."
./scripts/check-builds-windows.sh

section "PROCESS COMPLETED"
echo -e "Build summary:"
[ "$LINUX_BUILD_OK" = true ] && echo -e "${GREEN}✓ Linux: OK${NC}" || echo -e "${RED}✗ Linux: FAILED${NC}"
[ "$WINDOWS_BUILD_OK" = true ] && echo -e "${GREEN}✓ Windows: OK${NC}" || echo -e "${RED}✗ Windows: FAILED${NC}"
