# 📱 Mobile App Build Commands - Quick Reference

## 🚀 Build Commands

### Development Builds (For Testing)

**Android APK:**
```bash
cd /app/frontend
eas build --platform android --profile preview
```

**iOS TestFlight:**
```bash
cd /app/frontend
eas build --platform ios --profile preview
```

---

### Production Builds (For App Stores)

**Android (Play Store):**
```bash
cd /app/frontend
eas build --platform android --profile production
eas submit --platform android
```

**iOS (App Store):**
```bash
cd /app/frontend
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 📦 One-Command Build Both Platforms

```bash
cd /app/frontend
eas build --platform all --profile production
```

---

## 🔧 Setup Commands (First Time Only)

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure EAS Build
```bash
cd /app/frontend
eas build:configure
```

---

## 📲 Distribution Methods

### Method 1: Direct APK (Android Only - No Store)
1. Build: `eas build -p android --profile preview`
2. Download APK from EAS dashboard
3. Share link with employees
4. They install directly

**Best for:** Quick testing, <20 users

---

### Method 2: TestFlight (iOS Only - No Store)
1. Build: `eas build -p ios --profile preview`
2. Submit: `eas submit -p ios`
3. Add testers in App Store Connect
4. They install via TestFlight app

**Best for:** iOS testing, <100 users

---

### Method 3: Full App Store Release
1. Build both: `eas build --platform all --profile production`
2. Submit both: `eas submit --platform all`
3. Wait for store approval (1-3 days)
4. Employees download from stores

**Best for:** Production, unlimited users

---

## 🎯 Recommended Workflow

### For Startups/Small Teams:
```bash
# 1. Build Android APK for immediate testing
eas build -p android --profile preview

# 2. Build iOS for TestFlight
eas build -p ios --profile preview
eas submit -p ios

# Share APK link + TestFlight invite
```

### For Established Companies:
```bash
# 1. Build production apps
eas build --platform all --profile production

# 2. Submit to both stores
eas submit --platform all

# Wait for approval, then share store links
```

---

## 📊 Build Status & Logs

**Check Build Status:**
```bash
eas build:list
```

**View Latest Build:**
```bash
eas build:view
```

**Download Build:**
```bash
eas build:download --platform android
```

---

## 🆘 Troubleshooting

**Build Failed:**
```bash
# View detailed logs
eas build:view --json

# Re-run with verbose logging
eas build -p android --profile preview --verbose
```

**Can't Submit:**
```bash
# Check credentials
eas credentials

# Re-configure
eas build:configure
```

---

## 💰 Cost Estimates

**Development (Free):**
- Expo EAS: Free tier (first 30 builds/month)
- Testing with <100 users: Free

**Production:**
- Google Play Store: $25 one-time
- Apple App Store: $99/year
- Expo EAS: Free for basic (or $29/month Pro)

---

## 📅 Timeline Estimates

**APK Direct Distribution:**
- Build time: 10-20 minutes
- Distribution: Immediate
- **Total: < 30 minutes**

**TestFlight (iOS):**
- Build time: 15-30 minutes
- TestFlight processing: 10-30 minutes
- **Total: 1 hour**

**App Store Release:**
- Build time: 30-45 minutes
- Review time: 1-3 days (Apple), 2-8 hours (Google)
- **Total: 1-3 days**

---

## 🔐 Required Accounts

### Expo Account (Required)
- Sign up: https://expo.dev/signup
- Free tier available
- Used for: Building & managing apps

### Google Play Console (For Android Store)
- Sign up: https://play.google.com/console
- Cost: $25 one-time
- Used for: Publishing to Play Store

### Apple Developer Program (For iOS)
- Sign up: https://developer.apple.com
- Cost: $99/year
- Used for: TestFlight & App Store

---

## 📝 Pre-Build Checklist

- [ ] Expo account created and logged in
- [ ] EAS CLI installed (`npm i -g eas-cli`)
- [ ] Project configured (`eas build:configure`)
- [ ] App name & slug set in app.json
- [ ] Bundle ID / Package name configured
- [ ] App icon (1024x1024) ready
- [ ] Splash screen image ready
- [ ] Google/Apple developer accounts ready (if stores)

---

## 🚀 Quick Start for Your Team

**Step 1: Build Android APK (5 min)**
```bash
cd /app/frontend
eas build -p android --profile preview
```

**Step 2: Share with Team**
- Copy download link from terminal
- Send to employees via SMS/email
- They click, download, install

**Step 3: Build iOS (if needed)**
```bash
eas build -p ios --profile preview
eas submit -p ios
```
- Add employee emails in App Store Connect
- They get TestFlight invite
- Install via TestFlight app

---

## 💡 Pro Tips

1. **Start with Android APK** - Fastest to test
2. **Use TestFlight for iOS** - No App Store approval needed
3. **Production stores last** - Once everything is tested
4. **Keep PINs simple** - 1234, 5678 for initial rollout
5. **Test GPS** - Verify at actual site locations
6. **Create demo video** - Show employees how to install

---

## 📞 Support Resources

- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **TestFlight:** https://developer.apple.com/testflight/
- **Play Console:** https://support.google.com/googleplay/

---

**Your app is ready to distribute! 🎉**

Choose your method and start building!
