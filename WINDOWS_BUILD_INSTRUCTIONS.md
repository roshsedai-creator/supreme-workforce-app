# 🚀 Supreme Workforce - Windows APK Build Instructions

## ✅ What You Have:

1. **BUILD_ANDROID_APK.bat** - Automated build script
2. **frontend folder** - Your app code (already configured with project ID)

---

## 📋 Prerequisites (Do This First):

### **1. Install Node.js (If you don't have it)**

**Check if you have Node.js:**
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Type `node --version` and press Enter

**If you see a version number (like v18.x.x or v20.x.x):**
- ✅ You're good to go! Skip to Step 2

**If you see "command not found" or error:**
- ❌ You need to install Node.js
- Download from: https://nodejs.org/en/download/
- Choose "Windows Installer (.msi)"
- Download the **LTS version** (recommended)
- Run the installer and follow the prompts
- **Restart your computer** after installation
- Verify by opening cmd and typing `node --version`

---

## 🎯 METHOD 1: EASIEST - Use the Automated Script

### **Step 1: Download Your Frontend Code**

I'll create a zip file for you. Download it from the Emergent interface.

### **Step 2: Extract the Zip File**

1. Right-click the downloaded zip file
2. Select "Extract All..."
3. Choose a location (e.g., Desktop or Documents)
4. Click "Extract"

### **Step 3: Run the Build Script**

1. Open the extracted folder
2. Find the file: **BUILD_ANDROID_APK.bat**
3. **Right-click** on BUILD_ANDROID_APK.bat
4. Select **"Run as Administrator"**
5. A black command window will open

### **Step 4: Follow the Prompts**

The script will:
1. Install EAS CLI (Expo build tool)
2. Login using your token (already embedded)
3. Configure your project
4. Start the Android APK build

**You'll see messages like:**
```
[Step 1/4] Installing EAS CLI...
[Step 2/4] Logging into Expo...
[Step 3/4] Configuring project...
[Step 4/4] Starting Android APK build...
```

### **Step 5: Wait for Build**

- The script will show: "BUILD STARTED SUCCESSFULLY!"
- The build takes **15-20 minutes** on Expo's servers
- You can close the window or keep it open
- Check progress at: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds

### **Step 6: Download Your APK**

1. Go to: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
2. Wait for status to show **"Finished"** ✅
3. Click the **"Download"** button
4. Save the APK file (~50-100MB)
5. Distribute to your 40-50 staff!

---

## 🎯 METHOD 2: Manual Steps (If Script Doesn't Work)

### **Step 1: Open Command Prompt**

1. Press `Win + R`
2. Type `cmd`
3. Press Enter

### **Step 2: Navigate to Frontend Folder**

```cmd
cd C:\path\to\your\extracted\frontend
```
*(Replace with your actual path)*

Example:
```cmd
cd C:\Users\YourName\Desktop\frontend
```

### **Step 3: Install EAS CLI**

```cmd
npm install -g eas-cli
```

Wait for installation to complete (1-2 minutes)

### **Step 4: Login to Expo**

```cmd
set EXPO_TOKEN=pGzaBxZJIfJBxftocXiAjH-P1Ksblh0sU6Dm3_mx
eas whoami
```

You should see: "roshan1987 (authenticated using EXPO_TOKEN)"

### **Step 5: Build the APK**

```cmd
eas build --platform android --profile preview --non-interactive
```

### **Step 6: Wait & Download**

- Build will start
- Takes 15-20 minutes
- You'll get a URL to download the APK when done
- Or check: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds

---

## ❓ TROUBLESHOOTING

### **Error: "npm not recognized"**
- **Solution:** Node.js is not installed or not in PATH
- Install Node.js from: https://nodejs.org
- Restart computer after installation

### **Error: "eas not recognized"**
- **Solution:** EAS CLI not installed
- Run: `npm install -g eas-cli`
- Wait for completion, then try again

### **Error: "Cannot find module"**
- **Solution:** Missing dependencies
- Navigate to frontend folder
- Run: `npm install`
- Wait for completion (5-10 minutes)
- Then try the build again

### **Error: "Build failed"**
- **Solution:** Check the error message
- Often it's a network timeout - just try again
- Or check build logs at: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds

### **Error: "Project not found"**
- **Solution:** Project ID issue
- The app.json should already have projectId configured
- If not, your project ID is: ad4e1aa3-730a-4079-bec9-5dec4c572793

---

## 📱 AFTER YOU GET THE APK

### **Test It First:**

1. Transfer APK to your Android phone
2. Enable "Unknown Sources" in Settings → Security
3. Install the APK
4. Login with: Phone `0457802302`, PIN `1234`
5. Test all features

### **Distribute to Staff:**

**Best Method - Google Drive:**
1. Upload APK to Google Drive
2. Right-click → "Get link" → "Anyone with link"
3. Share link with staff via WhatsApp/Email

**Message to Staff:**
```
📱 Supreme Workforce App Installation

Hi team,

Please install our workforce management app:

1. Download: [YOUR GOOGLE DRIVE LINK]
2. Settings → Security → Enable "Unknown Sources"
3. Open Downloads → Tap the file → Install
4. Login with credentials provided separately

Need help? Contact me!
```

---

## ✅ CHECKLIST

Before distributing:
- [ ] Node.js installed
- [ ] Frontend code extracted
- [ ] Build script ran successfully
- [ ] APK downloaded from Expo
- [ ] APK tested on your phone
- [ ] All features working (login, clock-in, roster, etc.)
- [ ] APK uploaded to Google Drive
- [ ] Distribution link created
- [ ] Staff instructions prepared
- [ ] Ready to send to 40-50 staff!

---

## 🆘 NEED HELP?

**If you get stuck:**
1. Take a screenshot of the error
2. Note which step you're on
3. Share with me and I'll help troubleshoot

**Quick Links:**
- Expo Builds: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
- Node.js Download: https://nodejs.org
- Your Project: https://expo.dev/accounts/roshan1987/projects/supreme-workforce

---

**Good luck! Your APK will be ready soon! 🚀**
