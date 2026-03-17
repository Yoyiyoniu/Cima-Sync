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

section "BUILDING FOR ANDROID"

pushd "$ROOT_DIR" >/dev/null || exit 1

if bun tauri android build; then
    echo -e "${GREEN}✓ Android build completed${NC}"
else
    echo -e "${RED}✗ Android build failed${NC}"
    popd >/dev/null
    exit 1
fi

section "COPYING ANDROID BUILD ARTIFACTS"

# Create release/android directory if it doesn't exist
mkdir -p "$ROOT_DIR/release/android"

# Copy APK
APK_SOURCE="$ROOT_DIR/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"
APK_DEST="$ROOT_DIR/release/android/app-universal-release.apk"

COPIED_ALL=true

if [ -f "$APK_SOURCE" ]; then
    cp "$APK_SOURCE" "$APK_DEST"
    echo -e "${GREEN}✓ APK copied to $APK_DEST${NC}"
else
    echo -e "${RED}✗ APK not found at $APK_SOURCE${NC}"
    COPIED_ALL=false
fi

# Copy AAB
AAB_SOURCE="$ROOT_DIR/src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab"
AAB_DEST="$ROOT_DIR/release/android/app-universal-release.aab"

if [ -f "$AAB_SOURCE" ]; then
    cp "$AAB_SOURCE" "$AAB_DEST"
    echo -e "${GREEN}✓ AAB copied to $AAB_DEST${NC}"
else
    echo -e "${RED}✗ AAB not found at $AAB_SOURCE${NC}"
    COPIED_ALL=false
fi

if [ "$COPIED_ALL" = true ]; then
    echo -e "${GREEN}✓ Android build and packaging completed successfully${NC}"
    exit 0
else
    echo -e "${YELLOW}! Build completed but some artifacts were not found/copied${NC}"
    exit 1
fi
