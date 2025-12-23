# Supreme Workforce - Android APK Build Guide

## Quick Build (10 minutes)

### Step 1: Install Required Software

**On your Windows/Mac computer, install:**

1. **Node.js** - Download from: https://nodejs.org (choose LTS version)
2. **Git** - Download from: https://git-scm.com/downloads

### Step 2: Create Expo Account (Free)

1. Go to https://expo.dev/signup
2. Create a free account
3. Remember your username and password

### Step 3: Download the App Code

**Option A: Download ZIP**
- I will provide you with a download link

**Option B: Copy from this environment**
```bash
# The code is located at: /app/frontend
```

### Step 4: Build the APK

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# 1. Navigate to the frontend folder
cd supreme-workforce/frontend

# 2. Install dependencies
npm install

# 3. Install EAS CLI globally
npm install -g eas-cli

# 4. Login to Expo
eas login
# Enter your Expo username and password

# 5. Build the APK (this takes 10-15 minutes)
eas build --platform android --profile preview

# 6. When asked about creating a new project, say YES
```

### Step 5: Download Your APK

1. After the build completes, you'll get a link like:
   `https://expo.dev/artifacts/eas/xxxxx.apk`
2. Download the APK file
3. Share it with your employees via:
   - WhatsApp
   - Email
   - Google Drive

### Step 6: Install on Employee Phones

1. Send the APK file to employees
2. They need to enable "Install from Unknown Sources" in Android settings
3. Open the APK file to install
4. The app will appear as "Supreme Workforce"

---

## App Configuration

The app is pre-configured to connect to:
- **Backend URL:** https://timewizard-12.preview.emergentagent.com

---

## Employee Login Credentials

| Name | Phone | PIN |
|------|-------|-----|
| John Admin | 0457802302 | 1234 |
| Sarah Wilson | 0412345678 | 5678 |
| Ashish Poudel | 0415814822 | 1538 |
| Happy Kafle | 0433708550 | 4748 |
| Bablee Tamrakar | 0415869403 | 1234 |

---

## Troubleshooting

**Build fails?**
- Make sure you're logged into Expo: `eas whoami`
- Try: `eas build --platform android --profile preview --clear-cache`

**App can't connect to server?**
- Check internet connection
- The backend URL is hardcoded in the app

---

## Need Help?

If you get stuck, share the error message and I can help troubleshoot.
