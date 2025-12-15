#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXE_OK=false
NSIS_OK=false

section() { echo "--------------------------------"; echo "$1"; echo "--------------------------------"; }

EXE_FILE="./src-tauri/target/x86_64-pc-windows-msvc/release/cima-sync.exe"
NSIS_FILE="./src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/cima-sync_1.0.0_x64-setup.exe"

section "Checking .exe executable..."
if [ -f "$EXE_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$EXE_FILE" 2>/dev/null || echo "unknown")
    echo "File: $EXE_FILE"
    
    if [ "$FILE_SIZE" = "unknown" ]; then
        echo -e "${RED}✗ Could not get file size${NC}"
        EXE_OK=false
    elif [ "$FILE_SIZE" -eq 0 ]; then
        echo -e "${RED}✗ File is empty${NC}"
        EXE_OK=false
    else
        SIZE_FORMATTED=$(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "N/A")
        echo "Size: $FILE_SIZE bytes ($SIZE_FORMATTED)"
        
        if [ "$FILE_SIZE" -lt 1000000 ]; then
            echo -e "${YELLOW}⚠ Warning: File is very small (<1MB)${NC}"
        fi
        
        if command -v file >/dev/null 2>&1; then
            FILE_TYPE=$(file "$EXE_FILE" 2>/dev/null)
            echo "Type: $FILE_TYPE"
            
            if echo "$FILE_TYPE" | grep -qiE "PE32|Windows|executable"; then
                EXE_OK=true
                echo -e "${GREEN}✓ Valid PE executable${NC}"
            else
                echo -e "${RED}✗ Does not appear to be a valid PE executable${NC}"
                EXE_OK=false
            fi
        else
            if [ "$FILE_SIZE" -gt 1000000 ]; then
                EXE_OK=true
                echo -e "${GREEN}✓ File exists and has reasonable size (>1MB)${NC}"
                echo -e "${YELLOW}⚠ Install 'file' for complete type verification${NC}"
            else
                echo -e "${YELLOW}⚠ Could not verify completely (install 'file' for better verification)${NC}"
                EXE_OK=false
            fi
        fi
    fi
else
    echo -e "${RED}✗ File not found: $EXE_FILE${NC}"
    echo "   Make sure you have compiled for Windows with:"
    echo "   bun run build:windows"
    EXE_OK=false
fi

section "Checking NSIS installer..."
if [ -f "$NSIS_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$NSIS_FILE" 2>/dev/null || echo "unknown")
    echo "File: $NSIS_FILE"
    
    if [ "$FILE_SIZE" = "unknown" ]; then
        echo -e "${RED}✗ Could not get file size${NC}"
        NSIS_OK=false
    elif [ "$FILE_SIZE" -eq 0 ]; then
        echo -e "${RED}✗ File is empty${NC}"
        NSIS_OK=false
    else
        SIZE_FORMATTED=$(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "N/A")
        echo "Size: $FILE_SIZE bytes ($SIZE_FORMATTED)"
        
        if [ "$FILE_SIZE" -lt 1000000 ]; then
            echo -e "${YELLOW}⚠ Warning: File is very small (<1MB)${NC}"
        fi
        
        if command -v file >/dev/null 2>&1; then
            FILE_TYPE=$(file "$NSIS_FILE" 2>/dev/null)
            echo "Type: $FILE_TYPE"
            
            if echo "$FILE_TYPE" | grep -qiE "PE32|Windows|executable|NSIS"; then
                NSIS_OK=true
                echo -e "${GREEN}✓ Valid NSIS installer${NC}"
            else
                echo -e "${RED}✗ Does not appear to be a valid PE executable${NC}"
                NSIS_OK=false
            fi
        else
            if [ "$FILE_SIZE" -gt 1000000 ]; then
                NSIS_OK=true
                echo -e "${GREEN}✓ File exists and has reasonable size (>1MB)${NC}"
                echo -e "${YELLOW}⚠ Install 'file' for complete type verification${NC}"
            else
                echo -e "${YELLOW}⚠ Could not verify completely (install 'file' for better verification)${NC}"
                NSIS_OK=false
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠ NSIS file not found: $NSIS_FILE${NC}"
    echo "   This is normal if you only compiled the executable without the installer"
    NSIS_OK=false
fi

section "Verification summary"
[ "$EXE_OK" = true ] && echo -e "${GREEN}✓ .exe executable: OK${NC}" || echo -e "${RED}✗ .exe executable: FAILED${NC}"
[ "$NSIS_OK" = true ] && echo -e "${GREEN}✓ NSIS installer: OK${NC}" || echo -e "${YELLOW}⚠ NSIS installer: Not found or not verified${NC}"
echo "--------------------------------"

if [ "$EXE_OK" = true ] || [ "$NSIS_OK" = true ]; then
    section "Copying files to release/windows..."
    RELEASE_DIR="./release/windows"
    mkdir -p "$RELEASE_DIR"
    
    if [ "$EXE_OK" = true ]; then
        EXE_FILE="./src-tauri/target/x86_64-pc-windows-msvc/release/cima-sync.exe"
        cp "$EXE_FILE" "$RELEASE_DIR/" && echo -e "${GREEN}✓ Copied .exe executable${NC}" || echo -e "${RED}✗ Failed to copy .exe executable${NC}"
    fi
    
    if [ "$NSIS_OK" = true ]; then
        NSIS_FILE="./src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/cima-sync_1.0.0_x64-setup.exe"
        cp "$NSIS_FILE" "$RELEASE_DIR/" && echo -e "${GREEN}✓ Copied NSIS installer${NC}" || echo -e "${RED}✗ Failed to copy NSIS installer${NC}"
    fi
    
    echo -e "${GREEN}✓ Files copied to $RELEASE_DIR${NC}"
else
    echo -e "${RED}✗ No valid builds found, skipping copy${NC}"
fi