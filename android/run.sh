#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

export EXPO_PUBLIC_APP_VARIANT="${EXPO_PUBLIC_APP_VARIANT:-local}"

echo "Starting Expo dev server (variant: $EXPO_PUBLIC_APP_VARIANT)..."
echo ""
echo "  Scan the QR code with Expo Go on your Android device"
echo "  Make sure your phone and this computer are on the same network"
echo ""

npx expo start
