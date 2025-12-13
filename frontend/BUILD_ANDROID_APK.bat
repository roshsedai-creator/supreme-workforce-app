@echo off
echo ========================================
echo Supreme Workforce - Android APK Builder
echo ========================================
echo.
echo This script will build your Android APK.
echo Please wait, this may take 15-20 minutes.
echo.
pause

echo.
echo [Step 1/4] Installing EAS CLI...
echo.
call npm install -g eas-cli
if %errorlevel% neq 0 (
    echo ERROR: Failed to install EAS CLI.
    echo Please make sure Node.js is installed.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [Step 2/4] Logging into Expo...
echo.
echo Please enter your Expo credentials when prompted:
echo Email: roshan@supremehospitality.com.au
echo Password: Bablee@22.
echo.
set EXPO_TOKEN=pGzaBxZJIfJBxftocXiAjH-P1Ksblh0sU6Dm3_mx
call eas whoami
if %errorlevel% neq 0 (
    echo ERROR: Login failed.
    echo Please check your credentials and try again.
    pause
    exit /b 1
)

echo.
echo [Step 3/4] Configuring project...
echo.
echo Project ID: ad4e1aa3-730a-4079-bec9-5dec4c572793
echo.

echo.
echo [Step 4/4] Starting Android APK build...
echo.
echo This will take 15-20 minutes. You can:
echo - Keep this window open and wait
echo - Close this window and check build status at:
echo   https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
echo.
call eas build --platform android --profile preview --non-interactive
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed or was cancelled.
    echo Please check the error messages above.
    echo You can also check the build status at:
    echo https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Your APK is being built on Expo's servers.
echo.
echo To check the build status and download your APK:
echo 1. Go to: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
echo 2. Wait for the status to show "Finished" (15-20 minutes)
echo 3. Click the "Download" button to get your APK file
echo.
echo After downloading, you can distribute the APK to your 40-50 staff members!
echo.
pause
