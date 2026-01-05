# Supreme Workforce - Android APK Build Guide

## Quick Build (Recommended - Using EAS Cloud)

### Prerequisites
1. Install Node.js (v18 or later) from https://nodejs.org
2. A free Expo account at https://expo.dev

### Steps

**Step 1: Download the project**
Download the `supreme-workforce-app.zip` file and extract it to your computer.

**Step 2: Open Terminal/Command Prompt**
Navigate to the extracted folder:
```bash
cd supreme-workforce-app
```

**Step 3: Install dependencies**
```bash
npm install --legacy-peer-deps
```

**Step 4: Login to Expo**
```bash
npx expo login
```
Enter your Expo account credentials.

**Step 5: Build the APK**
```bash
npx eas-cli build --platform android --profile preview
```

This will:
- Upload your project to Expo's cloud servers
- Build the APK in the cloud (takes 10-15 minutes)
- Give you a download link when complete

**Step 6: Download & Distribute**
- Click the download link when the build completes
- Share the APK file with your employees via:
  - Email
  - Google Drive
  - WhatsApp
  - USB transfer

---

## App Configuration

**Backend URL**: `https://timemaster-93.preview.emergentagent.com`

This URL is already configured in the app. Your employees' data will automatically sync with the backend.

---

## Employee Installation Instructions

Share these instructions with your employees:

1. Download the APK file (from the link you share)
2. On your Android phone, go to Settings → Security
3. Enable "Install from Unknown Sources" or "Install Unknown Apps"
4. Open the downloaded APK file
5. Tap "Install"
6. Open "Supreme Workforce" app
7. Login with your phone number and PIN

---

## Troubleshooting

**"Command not found" errors:**
- Make sure Node.js is installed
- Restart your terminal after installing Node.js

**Build fails:**
- Run `npm install --legacy-peer-deps` again
- Make sure you're logged into Expo

**Need help?**
- Visit https://expo.dev/accounts for account issues
- Visit https://docs.expo.dev for documentation

---

## Admin Credentials (For Testing)

| Role | Phone | PIN |
|------|-------|-----|
| Admin | 0457802302 | 1234 |
| Admin | 0433708550 | 1234 |
| Supervisor | 0415814822 | 1538 |
