#!/usr/bin/env bash
set -e
echo "========================================================"
echo " IT-EDMS: Building Frontend and bundling into Laravel"
echo "========================================================"
cd "$(dirname "$0")/frontend"
npm run build
echo ""
echo "[SUCCESS] Frontend built and integrated into backend/public successfully!"
echo "You can now deploy the backend folder directly to your server."
