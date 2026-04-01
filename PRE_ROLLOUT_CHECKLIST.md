# ✅ PRE-ROLLOUT CHECKLIST - Test Before Going Live

## 🚨 CRITICAL: Test These BEFORE Sending to Employees

---

## 1. ✅ LOGOUT FUNCTION (JUST FIXED)

**Test Steps:**
1. Login as any user
2. Go to Profile tab
3. Scroll to bottom
4. Click "Logout" button
5. Confirm logout
6. **Should redirect to login page**
7. Try accessing any tab - should show login again

**Expected Result:** Clean logout, back to login screen

**If it fails:** Page refresh should work now with force reload

---

## 2. ✅ LOGIN FUNCTION

**Test with Admin:**
- Phone: `0457802302`
- PIN: `1234`
- **Should see:** Home, Timesheets, Roster, Profile, Supervisor, Admin tabs

**Test with Employee (if you have one):**
- Use their phone & PIN
- **Should see:** Home, Timesheets, Roster, Profile ONLY
- **Should NOT see:** Supervisor, Admin tabs

**Expected Result:** Correct tabs based on role

---

## 3. ✅ REGISTRATION FUNCTION

**Test Steps:**
1. Open: `https://supreme-sop-gen.preview.emergentagent.com/register`
2. Fill form:
   - First Name: Test
   - Last Name: User
   - Phone: 0498765432 (unique number)
   - Email: test@test.com
   - Job Title: Test Employee
   - PIN: 1234
   - Confirm PIN: 1234
3. Click "Create Account"
4. **Should see:** "Registration Completed!" message
5. Shows login details
6. Click "Go to Login"
7. Login with the phone & PIN you created

**Expected Result:** Registration works, can login immediately

---

## 4. ✅ CLOCK IN/OUT FUNCTION

**Test Steps:**
1. Login as employee
2. Go to Home tab
3. **Must be at actual work site** (within 100m of site GPS)
4. Click "Clock In"
5. Should show success
6. See timer running
7. Click "Clock Out"
8. Should show success
9. Go to Timesheets tab
10. Should see your new timesheet

**Expected Result:** Clock in/out works at site location

**If GPS fails:** Admin needs to check site GPS coordinates

---

## 5. ✅ ROSTER VIEW

**Test Steps:**
1. Login as supervisor or admin
2. Go to Roster tab
3. Click "Create Shift" button
4. Fill in shift details
5. Select employee, site, times
6. Choose shift type (Work, RDO, Sick, Annual)
7. Click "Create Shift"
8. Should see shift in calendar

**Expected Result:** Shifts can be created and viewed

---

## 6. ✅ ADMIN ACCESS CONTROL

**Test Steps:**
1. Login as employee (not admin)
2. Try to access admin functions
3. **Should NOT see:** Admin tab
4. **Should NOT access:** Admin features
5. Logout
6. Login as admin
7. **Should see:** Admin tab
8. Click Admin tab - should open

**Expected Result:** Only admins can access admin features

---

## 7. ✅ EMPLOYEE INVITE LINK

**Test Steps:**
1. Login as admin
2. Go to Admin tab
3. Find Employees section
4. Click green "Invite" button
5. Copy the registration link
6. Open in incognito/private browser
7. Should show registration form

**Expected Result:** Invite link works, shows registration page

---

## 8. ✅ BANK DETAILS VIEW (ADMIN)

**Test Steps:**
1. Login as admin
2. Go to Admin tab
3. Click green "Employee Bank Details" button
4. Should see list of all employees
5. Should show bank details if employees added them

**Expected Result:** Admin can view all bank details

---

## 9. ✅ REPORTS GENERATION

**Test Steps:**
1. Login as admin
2. Go to Admin tab
3. Click "Reports Center"
4. Select report type (Payroll/Timesheets)
5. Select date range
6. Click "Generate Report"
7. Should show report data

**Expected Result:** Reports generate successfully

---

## 10. ✅ AVAILABILITY SETTING

**Test Steps:**
1. Login as any employee
2. Go to Roster tab
3. Click "Availability" button
4. Set your availability
5. Save changes
6. Login as supervisor/admin
7. Click "Employee Availability" in Admin
8. Should see the availability you set

**Expected Result:** Employees can set availability, admins can view

---

## 🔥 CRITICAL ISSUES TO FIX BEFORE ROLLOUT

### Issue 1: Check "roshan sedai" Role
**Action Required:**
1. Login as admin
2. Go to Admin → Employees
3. Find "roshan sedai"
4. Check their role
5. If role is "admin" or "supervisor", change to "employee"
6. Save changes
7. Ask them to logout and login again

### Issue 2: Verify GPS Coordinates for All Sites
**Action Required:**
1. Login as admin
2. Go to Admin → Sites
3. For each site, verify:
   - GPS Latitude is correct
   - GPS Longitude is correct
   - Radius is appropriate (default: 100m)
4. Test clock-in at each site

### Issue 3: Update Pay Rates if Needed
**Action Required:**
1. Login as admin
2. Go to Admin → Pay Rates
3. Verify all award levels have correct rates
4. Update if needed

---

## ✅ DATA VERIFICATION

**Check These in Admin Panel:**

### Sites:
- [ ] All work locations added
- [ ] GPS coordinates correct
- [ ] Radius set appropriately
- [ ] Site names clear

### Employees:
- [ ] Admin account working
- [ ] Test employee accounts removed
- [ ] Only real employees remain
- [ ] All roles correct (most should be "employee")

### Pay Rates:
- [ ] All award levels configured
- [ ] Rates match your payroll
- [ ] Weekend rates correct
- [ ] Public holiday rates correct

---

## 📱 BROWSER/DEVICE TESTING

**Test on Different Devices:**
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iPhone)
- [ ] Tablet

**Test These Functions on Each:**
- [ ] Login
- [ ] Logout
- [ ] Clock in/out
- [ ] View roster
- [ ] Registration

---

## 🚀 ROLLOUT PLAN

### Phase 1: Pilot (2-3 employees)
**Day 1:**
1. Send registration link to 2-3 trusted employees
2. Ask them to register
3. Have them test:
   - Registration
   - Login
   - Clock in at site
   - View roster
   - Logout
4. Get feedback

**Expected Time:** 1-2 hours

### Phase 2: Small Group (5-10 employees)
**Day 2-3:**
1. Fix any issues from Phase 1
2. Send to 5-10 more employees
3. Monitor for issues
4. Provide support

**Expected Time:** 2-3 days

### Phase 3: Full Rollout
**Week 2:**
1. All issues resolved
2. Send to all remaining employees
3. Announce via meeting/email
4. Provide support contact
5. Monitor usage

---

## 📞 SUPPORT PREPARATION

**Before Rollout:**
1. Create FAQ document
2. Record demo video (optional)
3. Set up support contact (phone/email)
4. Train supervisors to help employees

**Common Support Issues:**
- Password reset (admin changes PIN)
- Can't clock in (GPS/location issue)
- Can't see roster (not assigned to shift)
- Registration failed (duplicate phone/email)

---

## 🎯 SUCCESS CRITERIA

**Rollout is successful when:**
- [ ] 90%+ employees registered
- [ ] Clock in/out working at all sites
- [ ] No major bugs reported
- [ ] Employees can view their rosters
- [ ] Timesheets generating correctly
- [ ] Admin can generate reports

---

## ⚠️ RED FLAGS - STOP ROLLOUT IF:

**Critical Issues:**
- [ ] Logout not working
- [ ] Login failing for multiple users
- [ ] Clock in/out not recording
- [ ] Data showing for wrong users
- [ ] App crashing frequently
- [ ] Security breach (users seeing others' data)

**If Any Red Flag:** Stop rollout, fix issue, test again

---

## 📝 FINAL CHECKLIST

**Before sending invite links:**
- [ ] ✅ Logout tested and working
- [ ] ✅ Login tested with different roles
- [ ] ✅ Registration tested end-to-end
- [ ] ✅ Clock in/out tested at real site
- [ ] ✅ Admin access control verified
- [ ] ✅ All sites have correct GPS
- [ ] ✅ Pay rates configured
- [ ] ✅ Demo data cleared
- [ ] ✅ Support plan ready
- [ ] ✅ Pilot group identified

---

## 🎉 YOU'RE READY IF:

- [x] All critical functions tested
- [x] Logout working
- [x] Registration working  
- [x] Admin access secured
- [x] Sites configured
- [x] Pilot plan ready

**Links to Share:**
- **Registration:** `https://supreme-sop-gen.preview.emergentagent.com/register`
- **Login:** `https://supreme-sop-gen.preview.emergentagent.com`

---

## 📧 SAMPLE PILOT INVITATION

```
Subject: Help Test Our New Staff Tracker App

Hi [Name],

You've been selected to help test our new Staff Tracker app before full rollout!

STEP 1: Register
🔗 https://supreme-sop-gen.preview.emergentagent.com/register

Fill in:
- Your name
- Phone: [your mobile]
- Email: [your email]
- Create a 4-digit PIN

STEP 2: Login & Test
After registration, login and try:
✅ Clock in at work (must be at site)
✅ View your roster
✅ Check timesheets
✅ Logout and login again

STEP 3: Feedback
Reply to this email with:
- Any problems you encountered
- Features you like
- Suggestions for improvement

Timeline: Please test by [date]

Questions? Call/text me: [your number]

Thanks for helping!
[Your name]
```

---

**GOOD LUCK WITH YOUR ROLLOUT! 🚀**
