#!/bin/bash
# Script to build the Tauri application on Linux with stripping disabled
# This avoids errors with libraries containing the .relr.dyn section

# Create a temporary directory for our strip wrapper
TEMP_DIR=$(mktemp -d)
trap "rm -rf '$TEMP_DIR'" EXIT

# Create a wrapper for strip that does nothing
cat > "$TEMP_DIR/strip" << 'EOF'
#!/bin/bash
# Wrapper that does nothing - disables stripping
# Simply returns success without doing anything
exit 0
EOF
chmod +x "$TEMP_DIR/strip"

# Add the temporary directory to the beginning of PATH
# This makes our strip be found before the system one
export PATH="$TEMP_DIR:$PATH"

# Also try to disable stripping with environment variables
export STRIP=""
export NO_STRIP=1

# Run the Tauri build
echo "Building Tauri application with stripping disabled..."
bun run tauri build "$@"

