#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Expo dev server..."
echo ""
echo "  Scan the QR code with Expo Go on your Android device"
echo "  Make sure your phone and this computer are on the same network"
echo ""

npx expo start
