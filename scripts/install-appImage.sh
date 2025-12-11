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

SOURCE_DIR="/home/yoyoz/dev/Cima-Sync/src-tauri/target/release/bundle/appimage/cima-sync.AppDir"
INSTALL_DIR="/opt/cima-sync"
DESKTOP_FILE="/usr/share/applications/cima-sync.desktop"
ICON_DIR="/usr/share/icons/hicolor/128x128/apps"

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
echo -e "${BOLD}${BLUE}==========================================${NC}"
echo -e "${BOLD}${BLUE}   Instalador de Cima Sync para Linux     ${NC}"
echo -e "${BOLD}${BLUE}==========================================${NC}"

if [ ! -d "$SOURCE_DIR" ]; then
    print_error "No se encontró el directorio fuente en:"
    echo "      $SOURCE_DIR"
    exit 1
fi

print_step "Preparando el entorno..."

if [ -d "$INSTALL_DIR" ]; then
    echo -e "   ${ARROW} Eliminando instalación anterior..."
    sudo rm -rf "$INSTALL_DIR"
    print_success "Limpieza completada."
else
    print_success "Instalación limpia."
fi

print_step "Instalando archivos del sistema..."
echo -e "   ${ARROW} Copiando archivos a /opt/cima-sync..."
sudo mkdir -p "$INSTALL_DIR"
sudo cp -r "$SOURCE_DIR"/* "$INSTALL_DIR/"
print_success "Archivos copiados."

echo -e "   ${ARROW} Configurando permisos..."
sudo chmod +x "$INSTALL_DIR/AppRun"
sudo chmod +x "$INSTALL_DIR/AppRun.wrapped"
sudo chmod +x "$INSTALL_DIR/usr/bin/cima-sync"
print_success "Permisos establecidos."

print_step "Configurando recursos gráficos..."
echo -e "   ${ARROW} Instalando icono de la aplicación..."
sudo mkdir -p "$ICON_DIR"
sudo cp "$SOURCE_DIR/usr/share/icons/hicolor/128x128/apps/cima-sync.png" "$ICON_DIR/"

if which gtk-update-icon-cache > /dev/null 2>&1; then
    sudo gtk-update-icon-cache /usr/share/icons/hicolor
fi
print_success "Icono instalado correctamente."

print_step "Creando accesos directos..."
echo -e "   ${ARROW} Generando archivo .desktop..."
cat <<EOF | sudo tee "$DESKTOP_FILE" > /dev/null
[Desktop Entry]
Categories=Utility;Network;
Comment=Autenticación automática para la red WiFi de la Universidad Autónoma de Baja California
Exec="$INSTALL_DIR/AppRun" %U
StartupWMClass=cima-sync
Icon=cima-sync
Name=Cima Sync
Terminal=false
Type=Application
EOF
print_success "Acceso directo en menú creado."

echo -e "   ${ARROW} Configurando comando global 'cima-sync'..."
sudo rm -f /usr/bin/cima-sync

cat <<EOF | sudo tee /usr/bin/cima-sync > /dev/null
#!/bin/bash
exec "$INSTALL_DIR/AppRun" "\$@"
EOF

sudo chmod +x /usr/bin/cima-sync
print_success "Comando de terminal configurado."

echo -e "\n${BOLD}${GREEN}==========================================${NC}"
echo -e "${BOLD}${GREEN}   ¡Instalación completada con éxito!     ${NC}"
echo -e "${BOLD}${GREEN}==========================================${NC}"
echo -e "\n${CYAN}Opciones de ejecución:${NC}"
echo -e "  1. Busca ${BOLD}'Cima Sync'${NC} en tu menú de aplicaciones."
echo -e "  2. Escribe ${BOLD}'cima-sync'${NC} en tu terminal."
echo ""
