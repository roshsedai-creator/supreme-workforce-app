# 📱 Supreme Workforce - Android APK Build Guide
## Step-by-Step Instructions with Visual Descriptions

---

## 🎯 OPTION 1: Build via Expo Website (Recommended - Easiest)

### **Step 1: Login to Expo**

1. **Open your browser** and go to: https://expo.dev/login
2. **You'll see a login page** with options for:
   - Email/Password
   - GitHub
   - Google
3. **Login using your credentials:**
   - Email: `roshan@supremehospitality.com.au`
   - Password: `Bablee@22.`

---

### **Step 2: Navigate to Your Project**

After logging in, you'll see:

1. **Dashboard page** with a list of your projects
2. **Look for:** "supreme-workforce" project
   - If you see it listed, **click on it**
   - If you DON'T see it, that's okay - continue to Step 3

---

### **Step 3: Access the Builds Page**

**Method A - If you found your project:**
- Click on "supreme-workforce" project name
- You'll see project overview
- On the left sidebar, click **"Builds"** tab
- **OR** directly go to: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds

**Method B - If project doesn't exist yet:**
- Go directly to: https://expo.dev/accounts/roshan1987/projects
- Click **"Create a project"** or **"New Project"**
- Use slug: `supreme-workforce`

---

### **Step 4: Create a New Build**

On the Builds page, you'll see:

1. **A button that says "Create a build"** or **"New build"** (usually blue/purple button)
2. **Click this button**
3. **A modal/popup will appear** with build options

---

### **Step 5: Configure Build Settings**

In the build configuration modal, you'll see several options:

#### **5.1 Select Platform:**
- ☑️ **Android** (Check this box)
- ☐ iOS (Leave unchecked)

#### **5.2 Select Build Profile:**
You'll see dropdown or radio buttons:
- ○ Development
- ● **Preview** ← **SELECT THIS ONE** (This creates an APK)
- ○ Production

**Why Preview?** This profile creates an `.apk` file that can be installed directly on Android phones without Google Play Store.

#### **5.3 Build Configuration:**
You might see additional options like:
- **Build type:** APK ✅ (this should be auto-selected when you choose Preview)
- **SDK Version:** (leave as default)
- **Runtime version:** (leave as default)

---

### **Step 6: Start the Build**

1. **Review your selections:**
   - Platform: Android ✅
   - Profile: Preview ✅
   - Build type: APK ✅

2. **Click the "Build" button** (usually at the bottom of the modal)

3. **You'll see a confirmation message:**
   - "Build queued" or "Build started"
   - Build ID will be displayed (e.g., `abc123-def456-...`)

---

### **Step 7: Monitor Build Progress**

After starting the build, you'll see:

1. **Build Status Page** showing:
   ```
   Build: #1
   Platform: Android
   Profile: Preview
   Status: IN_PROGRESS ⏳
   ```

2. **Progress stages:**
   - ⏳ **Queued** (Waiting for build server - 1-2 minutes)
   - ⏳ **In Progress** (Building your app - 15-20 minutes)
     - Installing dependencies
     - Compiling Android project
     - Creating APK
   - ✅ **Finished** (Build complete!)
   - ❌ **Errored** (If something goes wrong)

3. **You can:**
   - Watch the **live logs** (click "View logs" if available)
   - Leave the page and come back later (you'll get an email when done)
   - Check progress at: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds

---

### **Step 8: Download Your APK**

When the build status shows **"Finished"** ✅:

1. **You'll see a download button** or link that says:
   - "Download" or
   - "Download APK" or
   - "supreme-workforce-android-preview-xxxxx.apk"

2. **Click the download button**
   - The APK file will download to your computer
   - File size: approximately 50-100 MB
   - File name: something like `supreme-workforce-abc123.apk`

3. **Save this file** to a location you can easily find (e.g., Downloads folder)

---

### **Step 9: Test the APK Yourself First**

Before distributing to staff, test it yourself:

1. **Transfer APK to your Android phone:**
   - USB cable, or
   - Email it to yourself, or
   - Upload to Google Drive and download on phone

2. **On your Android phone:**
   - Go to Settings → Security (or Privacy)
   - Enable **"Install from Unknown Sources"** or **"Allow from this source"**
   - Find the APK file in your Downloads
   - Tap the APK file
   - Tap **"Install"**

3. **Test the app:**
   - Open "Supreme Workforce" app
   - Login with admin credentials (Phone: 0457802302, PIN: 1234)
   - Test clock-in/out, roster, timesheets
   - Verify everything works

---

### **Step 10: Distribute to Your 40-50 Staff**

Once you've confirmed it works:

#### **Option A: Google Drive (Recommended)**
1. Upload the APK to Google Drive
2. Right-click → Get link → Set to "Anyone with the link"
3. Share the link with your staff via:
   - WhatsApp group
   - Email
   - SMS

#### **Option B: Direct File Sharing**
1. Send the APK file directly via:
   - WhatsApp (can send file directly)
   - Email (as attachment)
   - AirDrop (if available)

#### **Option C: Cloud Storage**
Upload to:
- Dropbox
- OneDrive
- WeTransfer

---

### **Step 11: Staff Installation Instructions**

Send this message to your staff:

```
📱 SUPREME WORKFORCE APP - INSTALLATION INSTRUCTIONS

1. Download the app file from: [Your Link Here]

2. On your phone, go to:
   Settings → Security → Enable "Install from Unknown Sources"

3. Open your Downloads folder
   - Find "supreme-workforce" file
   - Tap to install

4. Open the app and login with the credentials provided

Need help? Contact: [Your Contact Info]
```

---

## 🎯 OPTION 2: Build Using Command Line (Alternative)

If Expo website doesn't work or you prefer command line:

### **Prerequisites:**
- Node.js installed on your computer
- Terminal/Command Prompt access

### **Steps:**

1. **Open Terminal/Command Prompt**

2. **Navigate to your project folder:**
   ```bash
   cd /path/to/your/project/frontend
   ```

3. **Login to Expo:**
   ```bash
   npx eas-cli login
   ```
   - Enter email: `roshan@supremehospitality.com.au`
   - Enter password: `Bablee@22.`

4. **Initialize EAS (if needed):**
   ```bash
   npx eas-cli init
   ```
   - Follow prompts to create project

5. **Start the build:**
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

6. **Follow the prompts:**
   - It will ask for confirmation
   - Type `Y` and press Enter
   - Wait 15-20 minutes

7. **Download link will be provided** when build completes

---

## 🔧 TROUBLESHOOTING

### **Issue 1: "Project not found"**
**Solution:**
- Make sure you're logged into the correct Expo account
- Check the URL: https://expo.dev/accounts/roshan1987
- Try creating a new project first

### **Issue 2: Build fails/errors**
**Solution:**
- Check the build logs for specific error
- Common issues:
  - Package name conflicts
  - Missing configurations
  - Network timeouts
- Try building again (sometimes temporary server issues)

### **Issue 3: APK won't install on phone**
**Solution:**
- Make sure "Unknown Sources" is enabled
- Check phone storage (need ~200MB free)
- Try redownloading the APK file
- Some phones require "Install from this source" for each app

### **Issue 4: App crashes on open**
**Solution:**
- Make sure backend URL is accessible: https://supreme-sop-gen.preview.emergentagent.com
- Check phone has internet connection
- Try clearing app data and reopening

### **Issue 5: Can't find download button**
**Solution:**
- Refresh the builds page
- Check your email for build completion notification
- Look for builds at: https://expo.dev/accounts/roshan1987/projects/supreme-workforce/builds
- Download link is usually at the top right of the build details page

---

## 📋 IMPORTANT INFORMATION

### **App Details:**
- **App Name:** Supreme Workforce
- **Package:** com.supremehospitality.workforce
- **Version:** 1.0.0
- **Backend URL:** https://supreme-sop-gen.preview.emergentagent.com

### **Login Credentials for Testing:**
- **Admin:** Phone: `0457802302`, PIN: `1234`
- **Supervisor:** Phone: `0412345678`, PIN: `5678`
- **Employee:** Phone: `0423456789`, PIN: `1111`

### **Features Working:**
✅ Mock PIN Authentication
✅ Clock-in/Clock-out with GPS
✅ Break Management
✅ Timesheet Management
✅ Roster System
✅ Admin Panel (Delete users, sites)
✅ Supervisor Panel (Approve timesheets)
✅ Employee Bank Details
✅ Role-Based Permissions (RBAC)
✅ Reports Center

### **Build Time Expectations:**
- **Queue time:** 1-5 minutes
- **Build time:** 15-20 minutes
- **Total time:** ~20-25 minutes
- **APK file size:** 50-100 MB

### **Cost:**
- Building APK via Expo: **FREE** (with your Expo account)
- No recurring costs for APK distribution
- Staff can use the app without any app store

---

## 📞 NEED HELP?

If you encounter any issues:

1. **Check the build logs** on Expo dashboard
2. **Take a screenshot** of any error messages
3. **Share the error** with me and I'll help troubleshoot

**Common questions answered:**
- **Q: Do staff need Expo Go app?**
  - A: NO! The APK works independently
  
- **Q: Will this work on all Android phones?**
  - A: Yes, Android 5.0 and above (99% of phones)
  
- **Q: Can I update the app later?**
  - A: Yes! Build a new APK and redistribute to staff
  
- **Q: Is this the same as Google Play Store?**
  - A: No, but works the same way. Staff install directly from file

---

## ✅ QUICK CHECKLIST

Before distributing to staff:

- [ ] APK downloaded successfully
- [ ] Tested on your own phone
- [ ] Login works
- [ ] Clock-in/out works
- [ ] GPS location works
- [ ] Camera/photo upload works
- [ ] Backend is accessible
- [ ] Created distribution link (Google Drive/etc)
- [ ] Prepared installation instructions for staff
- [ ] Tested with 2-3 staff members first (pilot)
- [ ] All features working as expected

---

**Good luck! Your app is ready to go live with your 40-50 staff members! 🚀**
