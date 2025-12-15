#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# State variables
DEBIAN_OK=false
RPM_OK=false
APPIMAGE_OK=false

# Function to show section
section() { echo "--------------------------------"; echo "$1"; echo "--------------------------------"; }

# Check Debian
section "Checking Debian package..."
dpkg-deb --info ./src-tauri/target/release/bundle/deb/cima-sync_1.0.0_amd64.deb && DEBIAN_OK=true

# Check RPM
section "Checking RPM package..."
RPM_OUTPUT=$(rpm -K ./src-tauri/target/release/bundle/rpm/cima-sync-1.0.0-1.x86_64.rpm 2>&1)
echo "$RPM_OUTPUT" | grep -E "(digests OK|NOT OK|digests)"
echo "$RPM_OUTPUT" | grep -q "digests OK" && RPM_OK=true

# Check AppImage
section "Checking AppImage..."
APPIMAGE_FILE="./src-tauri/target/release/bundle/appimage/cima-sync_1.0.0_amd64.AppImage"
if [ -f "$APPIMAGE_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$APPIMAGE_FILE" 2>/dev/null || echo "unknown")
    echo "File: $APPIMAGE_FILE | Size: $FILE_SIZE bytes"
    if file "$APPIMAGE_FILE" 2>/dev/null | grep -qE "AppImage|ELF"; then
        ("$APPIMAGE_FILE" --appimage-help >/dev/null 2>&1 || "$APPIMAGE_FILE" --appimage-version >/dev/null 2>&1 || [ -x "$APPIMAGE_FILE" ]) && APPIMAGE_OK=true && echo "Valid AppImage"
    fi
else
    echo "✗ File not found"
fi

# Summary
section "Verification summary"
[ "$DEBIAN_OK" = true ] && echo -e "${GREEN}✓ Debian package: OK${NC}" || echo -e "${RED}✗ Debian package: FAILED${NC}"
[ "$RPM_OK" = true ] && echo -e "${GREEN}✓ RPM package: OK${NC}" || echo -e "${RED}✗ RPM package: FAILED${NC}"
[ "$APPIMAGE_OK" = true ] && echo -e "${GREEN}✓ AppImage: OK${NC}" || echo -e "${RED}✗ AppImage: FAILED${NC}"
echo "--------------------------------"

# Copy files to release/linux if all checks passed
if [ "$DEBIAN_OK" = true ] || [ "$RPM_OK" = true ] || [ "$APPIMAGE_OK" = true ]; then
    section "Copying files to release/linux..."
    RELEASE_DIR="./release/linux"
    mkdir -p "$RELEASE_DIR"
    
    if [ "$DEBIAN_OK" = true ]; then
        DEBIAN_FILE="./src-tauri/target/release/bundle/deb/cima-sync_1.0.0_amd64.deb"
        cp "$DEBIAN_FILE" "$RELEASE_DIR/" && echo -e "${GREEN}✓ Copied Debian package${NC}" || echo -e "${RED}✗ Failed to copy Debian package${NC}"
    fi
    
    if [ "$RPM_OK" = true ]; then
        RPM_FILE="./src-tauri/target/release/bundle/rpm/cima-sync-1.0.0-1.x86_64.rpm"
        cp "$RPM_FILE" "$RELEASE_DIR/" && echo -e "${GREEN}✓ Copied RPM package${NC}" || echo -e "${RED}✗ Failed to copy RPM package${NC}"
    fi
    
    if [ "$APPIMAGE_OK" = true ]; then
        APPIMAGE_FILE="./src-tauri/target/release/bundle/appimage/cima-sync_1.0.0_amd64.AppImage"
        cp "$APPIMAGE_FILE" "$RELEASE_DIR/" && chmod +x "$RELEASE_DIR/cima-sync_1.0.0_amd64.AppImage" && echo -e "${GREEN}✓ Copied AppImage${NC}" || echo -e "${RED}✗ Failed to copy AppImage${NC}"
        cp -R ./src-tauri/target/release/bundle/appimage/cima-sync.AppDir "$RELEASE_DIR/" && echo -e "${GREEN}✓ Copied AppDir${NC}" || echo -e "${RED}✗ Failed to copy AppDir${NC}"
    fi
    
    echo -e "${GREEN}✓ Files copied to $RELEASE_DIR${NC}"
else
    echo -e "${RED}✗ No valid builds found, skipping copy${NC}"
fi
