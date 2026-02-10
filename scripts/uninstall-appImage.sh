#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

CHECK_MARK="${GREEN}✔${NC}"
CROSS_MARK="${RED}✘${NC}"
ARROW="${CYAN}➜${NC}"
GEAR="${BLUE}⚙${NC}"

INSTALL_DIR="/opt/cima-sync"
DESKTOP_FILE="/usr/share/applications/cima-sync.desktop"
ICON_PATH="/usr/share/icons/hicolor/128x128/apps/cima-sync.png"
BIN_SYMLINK="/usr/bin/cima-sync"

print_step() {
    echo -e "\n${GEAR} ${BOLD}$1${NC}"
}

print_success() {
    echo -e "   ${CHECK_MARK} $1"
}

print_error() {
    echo -e "   ${CROSS_MARK} $1"
}

clear
echo -e "${BOLD}${RED}==========================================${NC}"
echo -e "${BOLD}${RED}   Desinstalador de Cima Sync (Linux)     ${NC}"
echo -e "${BOLD}${RED}==========================================${NC}"

# Comprobar si hay algo instalado
if [ ! -d "$INSTALL_DIR" ] && [ ! -f "$DESKTOP_FILE" ] && [ ! -f "$BIN_SYMLINK" ]; then
    print_error "No se encontró ninguna instalación de Cima Sync."
    exit 1
fi

print_step "Eliminando archivos de la aplicación..."
if [ -d "$INSTALL_DIR" ]; then
    echo -e "   ${ARROW} Eliminando $INSTALL_DIR..."
    sudo rm -rf "$INSTALL_DIR"
    print_success "Directorio de la aplicación eliminado."
else
    echo -e "   ${ARROW} No existía $INSTALL_DIR."
fi

print_step "Eliminando accesos directos..."
if [ -f "$DESKTOP_FILE" ]; then
    sudo rm -f "$DESKTOP_FILE"
    print_success "Entrada del menú (.desktop) eliminada."
else
    echo -e "   ${ARROW} No existía el archivo .desktop."
fi

if [ -f "$BIN_SYMLINK" ]; then
    sudo rm -f "$BIN_SYMLINK"
    print_success "Comando 'cima-sync' eliminado."
else
    echo -e "   ${ARROW} No existía el comando en /usr/bin."
fi

print_step "Eliminando iconos..."
if [ -f "$ICON_PATH" ]; then
    sudo rm -f "$ICON_PATH"
    if which gtk-update-icon-cache > /dev/null 2>&1; then
        sudo gtk-update-icon-cache /usr/share/icons/hicolor 2>/dev/null || true
    fi
    print_success "Icono eliminado."
else
    echo -e "   ${ARROW} No existía el icono."
fi

echo -e "\n${BOLD}${GREEN}==========================================${NC}"
echo -e "${BOLD}${GREEN}   Cima Sync desinstalado correctamente   ${NC}"
echo -e "${BOLD}${GREEN}==========================================${NC}"
echo ""
