#!/bin/bash

echo "🚀 Building Android APK for Supreme Hospitality"
echo "================================================"
echo ""

cd /app/frontend

echo "Step 1: Login to Expo (if not logged in)"
echo "You'll need to create/login to Expo account"
echo ""

# Check if logged in
eas whoami 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in. Please login:"
    eas login
else
    echo "Already logged in as: $(eas whoami)"
fi

echo ""
echo "Step 2: Starting Android APK build..."
echo "This will take 15-20 minutes"
echo ""

# Build Android APK
eas build --platform android --profile preview

echo ""
echo "✅ Build complete!"
echo ""
echo "Download your APK:"
echo "1. Run: eas build:list"
echo "2. Find the latest build"
echo "3. Download link will be shown"
echo "   OR run: eas build:download"
echo ""
echo "Next steps:"
echo "1. Upload APK to Google Drive"
echo "2. Share link with employees"
echo "3. They download and install on Android phones"
