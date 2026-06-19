#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

section() { 
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════╝"
    echo ""
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

section "BUILDING FOR iOS"

pushd "$ROOT_DIR" >/dev/null || exit 1

OUTPUT=$(builder ios build 2>&1)
echo "$OUTPUT"

BUILD_ID=$(echo "$OUTPUT" | grep "Build ID:" | awk '{print $NF}')
if [ -z "$BUILD_ID" ]; then
    echo -e "${RED}✗ Failed to get build ID${NC}"
    popd >/dev/null
    exit 1
fi

if echo "$OUTPUT" | grep -q "Build complete"; then
    echo -e "${GREEN}✓ Build completed${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    popd >/dev/null
    exit 1
fi

section "COPYING IPA TO RELEASE"

RELEASE_DIR="$ROOT_DIR/release/ios/$BUILD_ID"
mkdir -p "$RELEASE_DIR"

IPA_SOURCE=$(find "$ROOT_DIR/dist" -name "*.ipa" -type f 2>/dev/null | head -1)
if [ -n "$IPA_SOURCE" ]; then
    cp "$IPA_SOURCE" "$RELEASE_DIR/"
    rm -f "$IPA_SOURCE"
    echo -e "${GREEN}✓ IPA saved to $RELEASE_DIR/${NC}"
else
    echo -e "${YELLOW}! IPA not found in dist/, downloading from Actions...${NC}"
    RUN_URL=$(echo "$OUTPUT" | grep "Workflow:" | awk '{print $NF}')
    RUN_ID=$(echo "$RUN_URL" | grep -oE '[0-9]+$')
    if [ -n "$RUN_ID" ] && gh run download "$RUN_ID" --name ipa --dir "$RELEASE_DIR" 2>/dev/null; then
        echo -e "${GREEN}✓ IPA saved to $RELEASE_DIR/${NC}"
    else
        echo -e "${RED}✗ Failed to download IPA${NC}"
        popd >/dev/null
        exit 1
    fi
fi

echo -e "${GREEN}✓ iOS build complete: $RELEASE_DIR/${NC}"
