#!/usr/bin/env bash
# ============================================================================
# MMOLite Cross-Platform Build Script
# Creates distributable packages for Windows, macOS, and Linux.
#
# Prerequisites:
#   - love-build (npm i -g love-build) OR manual LOVE runtimes
#   - esbuild (npx esbuild)
#   - zip
#
# Usage:
#   ./build.sh              # Build all platforms
#   ./build.sh windows      # Build Windows only
#   ./build.sh linux        # Build Linux only
#   ./build.sh macos        # Build macOS only
#   ./build.sh love         # Create .love file only
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUILD_DIR="build"
LOVE_FILE="MMOLite.love"
APP_NAME="MMOLite"
TARGET="${1:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[build]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Step 0: Verify prerequisites
# ---------------------------------------------------------------------------
info "Verifying prerequisites..."

if [ ! -f "client/main.lua" ]; then
    error "client/main.lua not found. Run from the MMOLite project root."
    exit 1
fi

if ! command -v zip &>/dev/null; then
    error "'zip' command not found. Install it first."
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 1: Clean previous build
# ---------------------------------------------------------------------------
info "Cleaning previous build..."
rm -rf "$BUILD_DIR"
rm -f "$LOVE_FILE"

# ---------------------------------------------------------------------------
# Step 2: Create .love file (ZIP of client/ contents)
# ---------------------------------------------------------------------------
info "Creating $LOVE_FILE..."
(cd client && zip -9 -r "../$LOVE_FILE" . -x "*.git*" -x "steam-libs/*")

if [ ! -f "$LOVE_FILE" ]; then
    error "Failed to create $LOVE_FILE"
    exit 1
fi

info "$LOVE_FILE created ($(du -h "$LOVE_FILE" | cut -f1))"

if [ "$TARGET" = "love" ]; then
    mkdir -p "$BUILD_DIR"
    mv "$LOVE_FILE" "$BUILD_DIR/"
    info "Done! Output: $BUILD_DIR/$LOVE_FILE"
    exit 0
fi

# ---------------------------------------------------------------------------
# Step 3: Bundle server files (esbuild)
# ---------------------------------------------------------------------------
bundle_server() {
    local dest="$1"
    if [ -f "server.js" ]; then
        info "Bundling server files..."
        npx --yes esbuild server.js \
            --bundle --platform=node --target=node18 --minify \
            --outfile="$dest/server.js" \
            --external:worker_threads 2>/dev/null

        if [ -f "game-worker.js" ]; then
            npx esbuild game-worker.js \
                --bundle --platform=node --target=node18 --minify \
                --outfile="$dest/game-worker.js" 2>/dev/null || \
                cp game-worker.js "$dest/"
        fi

        [ -f "local-server-config.json" ] && cp local-server-config.json "$dest/"
        [ -f "license.txt" ] && cp license.txt "$dest/"
        [ -f "readme.txt" ] && cp readme.txt "$dest/"
    else
        warn "server.js not found — building client-only package."
    fi
}

# ---------------------------------------------------------------------------
# Step 4: Platform-specific builds
# ---------------------------------------------------------------------------

build_windows() {
    info "Building Windows package..."
    local dest="$BUILD_DIR/$APP_NAME-windows"
    mkdir -p "$dest"

    if [ -f "love.exe" ]; then
        # Fuse: love.exe + .love = game.exe
        cat love.exe "$LOVE_FILE" > "$dest/$APP_NAME.exe"

        # Copy LOVE runtime DLLs
        for dll in love.dll SDL2.dll OpenAL32.dll lua51.dll mpg123.dll msvcp120.dll msvcr120.dll; do
            [ -f "$dll" ] && cp "$dll" "$dest/"
        done

        # Copy Steam libraries if present
        if [ -d "client/steam-libs/win64" ]; then
            cp client/steam-libs/win64/*.dll "$dest/" 2>/dev/null || true
        fi
        [ -f "client/steam-libs/steam_appid.txt" ] && cp client/steam-libs/steam_appid.txt "$dest/"
    else
        warn "love.exe not found — placing .love file for manual fusing."
        cp "$LOVE_FILE" "$dest/"
    fi

    bundle_server "$dest"
    info "Windows build: $dest/"
}

build_linux() {
    info "Building Linux package..."
    local dest="$BUILD_DIR/$APP_NAME-linux"
    mkdir -p "$dest"

    # For Linux, we ship the .love file with a launcher script
    cp "$LOVE_FILE" "$dest/"

    cat > "$dest/$APP_NAME.sh" << 'LAUNCHER'
#!/usr/bin/env bash
# MMOLite Linux launcher — requires love2d installed (apt install love / flatpak)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOVE_FILE="$SCRIPT_DIR/MMOLite.love"

if command -v love &>/dev/null; then
    love "$LOVE_FILE" "$@"
elif command -v flatpak &>/dev/null && flatpak list | grep -q org.love2d.love; then
    flatpak run org.love2d.love "$LOVE_FILE" "$@"
else
    echo "Error: LOVE2D not found. Install with: sudo apt install love"
    echo "  or: flatpak install flathub org.love2d.love"
    exit 1
fi
LAUNCHER
    chmod +x "$dest/$APP_NAME.sh"

    # Copy Steam libraries if present
    if [ -d "client/steam-libs/linux64" ]; then
        cp client/steam-libs/linux64/*.so "$dest/" 2>/dev/null || true
    fi
    [ -f "client/steam-libs/steam_appid.txt" ] && cp client/steam-libs/steam_appid.txt "$dest/"

    bundle_server "$dest"
    info "Linux build: $dest/"
}

build_macos() {
    info "Building macOS package..."
    local dest="$BUILD_DIR/$APP_NAME-macos"
    local app="$dest/$APP_NAME.app"
    mkdir -p "$app/Contents/MacOS"
    mkdir -p "$app/Contents/Resources"

    # Place .love file in Resources
    cp "$LOVE_FILE" "$app/Contents/Resources/"

    # Info.plist
    cat > "$app/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.mmolite.game</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

    # Launcher script (user needs LOVE installed via brew or love2d.org)
    cat > "$app/Contents/MacOS/$APP_NAME" << 'LAUNCHER'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"
LOVE_FILE="$DIR/MMOLite.love"

# Try common LOVE install locations
if [ -d "/Applications/love.app" ]; then
    /Applications/love.app/Contents/MacOS/love "$LOVE_FILE" "$@"
elif command -v love &>/dev/null; then
    love "$LOVE_FILE" "$@"
else
    osascript -e 'display alert "LOVE2D Required" message "Please install LOVE2D from https://love2d.org"'
    exit 1
fi
LAUNCHER
    chmod +x "$app/Contents/MacOS/$APP_NAME"

    # Copy Steam libraries if present
    if [ -d "client/steam-libs/osx" ]; then
        cp client/steam-libs/osx/* "$app/Contents/MacOS/" 2>/dev/null || true
    fi
    [ -f "client/steam-libs/steam_appid.txt" ] && cp client/steam-libs/steam_appid.txt "$app/Contents/MacOS/"

    bundle_server "$dest"
    info "macOS build: $app/"
}

# ---------------------------------------------------------------------------
# Step 5: Execute requested builds
# ---------------------------------------------------------------------------
case "$TARGET" in
    windows) build_windows ;;
    linux)   build_linux ;;
    macos)   build_macos ;;
    all)
        build_windows
        build_linux
        build_macos
        ;;
    *)
        error "Unknown target: $TARGET"
        echo "Usage: $0 [all|windows|linux|macos|love]"
        exit 1
        ;;
esac

# Cleanup
rm -f "$LOVE_FILE"

echo ""
info "============================================"
info "  Build complete!"
info "  Output: $BUILD_DIR/"
info "============================================"
