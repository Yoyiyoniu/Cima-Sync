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

section "BUILDING FOR ANDROID"

if bun tauri android build; then
    echo -e "${GREEN}✓ Android build completed${NC}"
else
    echo -e "${RED}✗ Android build failed${NC}"
    exit 1
fi

section "COPYING ANDROID BUILD ARTIFACTS"

# Create release/android directory if it doesn't exist
mkdir -p ../release/android

# Copy APK
APK_SOURCE="../src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"
APK_DEST="../release/android/app-universal-release.apk"

if [ -f "$APK_SOURCE" ]; then
    cp "$APK_SOURCE" "$APK_DEST"
    echo -e "${GREEN}✓ APK copied to $APK_DEST${NC}"
else
    echo -e "${RED}✗ APK not found at $APK_SOURCE${NC}"
fi

# Copy AAB
AAB_SOURCE="../src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab"
AAB_DEST="../release/android/app-universal-release.aab"

if [ -f "$AAB_SOURCE" ]; then
    cp "$AAB_SOURCE" "$AAB_DEST"
    echo -e "${GREEN}✓ AAB copied to $AAB_DEST${NC}"
else
    echo -e "${RED}✗ AAB not found at $AAB_SOURCE${NC}"
fi

echo -e "${GREEN}✓ Android build and packaging completed successfully${NC}"
exit 0
