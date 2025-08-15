#!/bin/bash

# Script para compilar solo el AppImage de Cima Sync

echo "🔨 Compilando Cima Sync AppImage..."

# Compilar el frontend
echo "📦 Compilando frontend..."
bun run build

# Compilar el binario sin bundling
echo "🚀 Compilando binario..."
bun run tauri build --no-bundle

# Crear estructura del AppImage
echo "📁 Creando estructura del AppImage..."
rm -rf AppDir
mkdir -p AppDir/usr/bin AppDir/usr/share/applications AppDir/usr/share/icons/hicolor/256x256/apps

# Copiar archivos necesarios
cp src-tauri/target/release/cima-sync AppDir/usr/bin/
cp src-tauri/icons/128x128.png AppDir/cima-sync.png

# Crear archivo .desktop
cat > AppDir/cima-sync.desktop << EOF
[Desktop Entry]
Name=Cima Sync
Comment=Autenticación automática para la red WiFi de la UABC
Exec=cima-sync
Icon=cima-sync
Type=Application
Categories=Network;
StartupNotify=true
EOF

# Crear AppRun
cat > AppDir/AppRun << EOF
#!/bin/bash
HERE="\$(dirname "\$(readlink -f "\${0}")")"
export PATH="\${HERE}"/usr/bin/:"\${PATH}"
exec "\${HERE}"/usr/bin/cima-sync "\$@"
EOF

chmod +x AppDir/AppRun

# Crear AppImage
echo "📦 Creando AppImage..."
appimagetool AppDir cima-sync-1.0.0-x86_64.AppImage

# Verificar si se creó el AppImage
if [ -f "cima-sync-1.0.0-x86_64.AppImage" ]; then
    echo "✅ AppImage creado exitosamente!"
    echo "📁 Ubicación: $(pwd)/cima-sync-1.0.0-x86_64.AppImage"
    echo "📊 Tamaño: $(ls -lh cima-sync-1.0.0-x86_64.AppImage | awk '{print $5}')"
    echo ""
    echo "🎉 ¡Tu AppImage está listo para usar!"
    echo "💡 Para ejecutarlo: ./cima-sync-1.0.0-x86_64.AppImage"
else
    echo "❌ Error: No se pudo crear el AppImage"
    exit 1
fi
