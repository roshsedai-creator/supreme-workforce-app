# 🚀 Quick Build Commands

## Prerequisites (One-time setup)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
npx expo login
```

---

## 📱 Android Build (APK)

### For Testing (Installable APK):
```bash
cd /app/frontend
eas build --platform android --profile preview
```
**Result**: Downloadable APK file (~50-80MB)
**Install**: Transfer to Android phone and install directly

### For Google Play Store:
```bash
cd /app/frontend
eas build --platform android --profile production
```
**Result**: AAB file for Play Store submission

---

## 📱 iOS Build (IPA)

### For Testing (TestFlight):
```bash
cd /app/frontend
eas build --platform ios --profile preview
```
**Result**: IPA file for TestFlight distribution
**Requires**: Apple Developer account ($99/year)

### For App Store:
```bash
cd /app/frontend
eas build --platform ios --profile production
```
**Result**: IPA file for App Store submission

---

## 📱 Build Both Platforms

```bash
cd /app/frontend
eas build --platform all --profile production
```

---

## ⚡ No-Build Option (Instant Testing)

### Using Expo Go App:
```bash
cd /app/frontend
expo start
```
1. Install "Expo Go" from App Store/Play Store
2. Scan QR code from terminal
3. App opens instantly!

**Note**: Requires Expo Go app and internet connection

---

## 📊 Build Status & Download

After running build command:

1. **View Build Progress**:
   ```bash
   eas build:list
   ```

2. **Build Page Opens**: Browser shows real-time build progress

3. **Download Link**: When complete, get download link for APK/IPA

4. **Build Time**: 
   - Android: ~10-15 minutes
   - iOS: ~15-20 minutes

---

## 🔄 Update Existing Build

### Increment Version:
Edit `/app/frontend/app.json`:
```json
"version": "1.0.1",  // Change version
"ios": {
  "buildNumber": "1.0.1"  // iOS build number
},
"android": {
  "versionCode": 2  // Android version code (must increment)
}
```

### Rebuild:
```bash
eas build --platform android --profile production
```

---

## ❌ Common Issues

### Issue: "Not logged in"
```bash
npx expo login
```

### Issue: "No bundle identifier"
- Already configured in app.json ✅
- iOS: `com.supremehospitality.workforce`
- Android: `com.supremehospitality.workforce`

### Issue: "Build failed"
- Check build logs at build.expo.dev
- Ensure all dependencies are installed
- Verify app.json configuration

---

## 💡 Pro Tips

1. **First Build?** Use `preview` profile for testing
2. **Backend URL**: Update `.env` before production build
3. **Icons**: Place 1024x1024 icon at `/assets/images/icon.png`
4. **Testing**: Always test APK/IPA before store submission
5. **Version**: Increment version for each new build

---

## 📞 Get Help

- Build logs: https://expo.dev/accounts/[your-account]/projects/supreme-workforce/builds
- Expo docs: https://docs.expo.dev/build/introduction/
- Support: https://chat.expo.dev/

---

## ✅ Current Configuration

- ✅ App name: Supreme Workforce
- ✅ Bundle ID configured
- ✅ Permissions declared
- ✅ Build profiles ready
- ✅ Icons configured

**Ready to build!** Run any command above to start. 🎉
