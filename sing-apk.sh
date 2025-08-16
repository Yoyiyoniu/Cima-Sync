#!/bin/bash

set -e

echo "🚀 Iniciando firma de APKs para Cima-Sync..."

PROJECT_DIR="$(pwd)"
OUTPUT_DIR="./OutApps"
APK_NAME="Cima-Sync"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
KEYSTORE_PATH="src-tauri/gen/android/debug.keystore"
KEYSTORE_PASSWORD="android"
KEY_ALIAS="androiddebugkey"
KEY_PASSWORD="android"

ANDROID_SDK_PATH="$HOME/Android/Sdk"
APKSIGNER_PATH="$ANDROID_SDK_PATH/build-tools/36.0.0/apksigner"

if [ ! -f "$APKSIGNER_PATH" ]; then
    echo "❌ Error: apksigner no encontrado en $APKSIGNER_PATH"
    echo "🔍 Buscando apksigner en el SDK..."
    FOUND_APKSIGNER=$(find "$ANDROID_SDK_PATH" -name "apksigner" 2>/dev/null | head -1)
    if [ -n "$FOUND_APKSIGNER" ]; then
        APKSIGNER_PATH="$FOUND_APKSIGNER"
        echo "✅ Encontrado apksigner en: $APKSIGNER_PATH"
    else
        echo "❌ Error: No se pudo encontrar apksigner en el SDK de Android"
        exit 1
    fi
fi
    
INPUT_APK="src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"

if [ ! -f "$INPUT_APK" ]; then
    echo "❌ Error: APK de entrada no encontrado en $INPUT_APK"
    echo "🔍 Buscando APKs en el proyecto..."
    FOUND_APK=$(find . -name "*unsigned.apk" 2>/dev/null | head -1)
    if [ -n "$FOUND_APK" ]; then
        INPUT_APK="$FOUND_APK"
        echo "✅ Encontrado APK en: $INPUT_APK"
    else
        echo "❌ Error: No se pudo encontrar ningún APK sin firmar"
        exit 1
    fi
fi

mkdir -p "$OUTPUT_DIR"

echo "🔒 Firma de la APK..."
echo "📁 APK de entrada: $INPUT_APK"
echo "📁 APK de salida: $OUTPUT_DIR/$APK_NAME-$TIMESTAMP.apk"

"$APKSIGNER_PATH" sign --ks "$KEYSTORE_PATH" --ks-pass pass:"$KEYSTORE_PASSWORD" --key-pass pass:"$KEY_PASSWORD" --out "$OUTPUT_DIR/$APK_NAME-$TIMESTAMP.apk" "$INPUT_APK"

echo "✅ APK firmada exitosamente!"
echo "📱 APK firmada guardada en: $OUTPUT_DIR/$APK_NAME-$TIMESTAMP.apk"