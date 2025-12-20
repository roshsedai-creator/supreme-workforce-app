# 📱 Employee Onboarding & App Distribution Guide

## 🎯 How to Invite & Onboard Employees

### Step 1: Create Employee Account (Admin)

**For Admin to invite a new employee:**

1. **Login as Admin** (Phone: `0457802302`, PIN: `1234`)
2. Go to **Admin** tab
3. Scroll to **"Employees"** section
4. Tap **"Add Employee"** button
5. Fill in employee details:
   - First Name & Last Name
   - Phone Number (this will be their login username)
   - Email Address
   - PIN (this will be their login password)
   - Job Title
   - Award Level (for pay rate)
   - Select Site(s)
   - Select Role (Employee/Supervisor/Admin)
6. Tap **"Create Employee"**

### Step 2: Send Login Credentials to Employee

**Option A: Manual (Current)**
Send the employee their login details via:
- SMS: "Your login: Phone: [phone], PIN: [pin]"
- Email
- WhatsApp
- In-person handover

**Example Message:**
```
Welcome to [Company Name] Staff Tracker! 

Your login credentials:
📱 Phone: 0412345678
🔐 PIN: 1234

Download the app:
- iPhone: [App Store Link]
- Android: [Play Store Link]
```

---

## 📲 How to Create Mobile Apps (iOS & Android)

### Prerequisites
- Have `eas-cli` installed globally
- Have an Expo account
- Have Apple Developer account ($99/year for iOS)
- Have Google Play Console account ($25 one-time for Android)

---

### Option 1: Development Build (Testing - FREE)

**For Android (APK)**
```bash
cd /app/frontend
eas build --platform android --profile preview
```

**For iOS (TestFlight)**
```bash
cd /app/frontend
eas build --platform ios --profile preview
```

After build completes:
- You'll get a download link
- Share this link with employees
- They can install directly (Android) or via TestFlight (iOS)

---

### Option 2: Production Build (App Stores)

#### A. Configure App Details

Edit `/app/frontend/app.json`:
```json
{
  "expo": {
    "name": "StaffTracker",
    "slug": "stafftracker",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.stafftracker",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.stafftracker",
      "versionCode": 1
    }
  }
}
```

#### B. Build for Production

**Android (Play Store)**
```bash
cd /app/frontend
eas build --platform android --profile production
```

**iOS (App Store)**
```bash
cd /app/frontend
eas build --platform ios --profile production
```

#### C. Submit to Stores

**Google Play Store:**
```bash
eas submit --platform android
```

**Apple App Store:**
```bash
eas submit --platform ios
```

---

## 🚀 Quick Distribution Methods

### Method 1: Expo Go (Easiest - Development Only)

**Pros:** Instant, no build needed
**Cons:** Only for testing, not for production

1. Run expo server: `expo start`
2. Show QR code to employees
3. They scan with Expo Go app
4. App loads instantly

**Best for:** Testing with 1-5 employees

---

### Method 2: Internal Distribution (No App Store)

**For Android (Side-loading)**

1. Build APK:
```bash
eas build --platform android --profile preview
```

2. Download APK from EAS dashboard
3. Upload to your server/Dropbox/Google Drive
4. Share link with employees
5. Employees:
   - Download APK
   - Enable "Install from Unknown Sources"
   - Install APK

**For iOS (TestFlight - 100 users max)**

1. Build for TestFlight:
```bash
eas build --platform ios --profile preview
eas submit --platform ios
```

2. Add employees' emails to TestFlight
3. They receive invite email
4. Install via TestFlight app

**Best for:** 10-100 employees in testing phase

---

### Method 3: App Store Distribution (Production)

**Google Play Store**
- Reach: Unlimited users
- Cost: $25 one-time
- Review time: Few hours to 1 day

**Apple App Store**
- Reach: Unlimited users  
- Cost: $99/year
- Review time: 1-3 days

**Best for:** 100+ employees, public release

---

## 📋 Employee Onboarding Checklist

### Admin Checklist:
- [ ] Create employee account in Admin panel
- [ ] Assign to correct site(s)
- [ ] Set correct job title and award level
- [ ] Create roster shifts for employee
- [ ] Send login credentials via SMS/email
- [ ] Send app download link
- [ ] Verify employee can login
- [ ] Test clock-in at site location

### Employee Checklist:
- [ ] Receive login credentials
- [ ] Download app (Play Store/App Store/TestFlight)
- [ ] Open app and login with phone + PIN
- [ ] Allow location permissions
- [ ] View roster for assigned shifts
- [ ] Test clock-in (must be at site)
- [ ] Set availability preferences
- [ ] Update profile details

---

## 🔐 Login Credentials Format

**Username:** Phone number (e.g., `0412345678`)
**Password:** 4-digit PIN (e.g., `1234`)

**Default PINs by Role:**
- Employee: `1111`
- Supervisor: `5678`  
- Admin: `1234`

⚠️ **Security Note:** Ask employees to change PIN after first login

---

## 🌐 App Distribution Links

Once deployed:

**Web Version (Browser):**
```
https://workforce-doctor.preview.emergentagent.com
```

**iOS App Store:**
```
https://apps.apple.com/app/your-app-id
```

**Android Play Store:**
```
https://play.google.com/store/apps/details?id=com.yourcompany.stafftracker
```

**TestFlight (iOS Beta):**
```
https://testflight.apple.com/join/YOUR_CODE
```

**Direct APK Download:**
```
https://your-server.com/stafftracker.apk
```

---

## 💡 Best Practices

### For Small Teams (< 10 employees)
- Use TestFlight (iOS) + APK side-loading (Android)
- Send login via WhatsApp group
- No app store fees needed

### For Medium Teams (10-50 employees)
- Use TestFlight + Google Play Beta
- Email login credentials with app links
- Consider Google Play (only $25)

### For Large Teams (50+ employees)
- Publish to both App Stores
- Professional onboarding emails
- IT department handles distribution
- Create video tutorials

---

## 🆘 Troubleshooting

**Employee can't login:**
- Verify phone number format (with 0 prefix)
- Check PIN is correct
- Ensure account was created in Admin panel

**Clock-in fails:**
- Employee must be AT the site (within 100m)
- Check location permissions enabled
- Verify site GPS coordinates are correct

**App won't install (Android):**
- Enable "Install from Unknown Sources" in Settings
- Check storage space available
- Try downloading again

**App won't install (iOS):**
- Accept TestFlight invitation email
- Install TestFlight app first
- Update iOS to latest version

---

## 📞 Support Contact

**For Admin Issues:**
- Check Admin panel → Help section
- Review user guide in app

**For Employee Issues:**
- Contact your supervisor
- Send screenshot of error
- Verify login credentials

---

## 🎓 Training Resources

Create these for employees:

1. **Quick Start Video** (2 min)
   - How to login
   - How to clock in/out
   - How to view roster

2. **Onboarding PDF** (1 page)
   - Login steps
   - App download links
   - Who to contact for help

3. **FAQ Document**
   - Common login issues
   - Clock-in troubleshooting
   - Roster questions

---

## 🚀 Next Steps

1. Build production apps
2. Submit to app stores
3. Create onboarding materials
4. Train supervisors first
5. Roll out to employees in phases
6. Collect feedback
7. Iterate and improve

**Your workforce management system is ready! 🎉**
