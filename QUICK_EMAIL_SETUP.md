# Quick Email Setup for Automatic Registration Invitations

## ✅ Email Feature is Already Built!

Your app already has automatic email sending for invitations built-in. You just need to enable it by adding your email credentials.

---

## 🚀 **5-Minute Setup with Gmail**

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already on)
4. Scroll down to **2-Step Verification** section
5. Click **App passwords** at the bottom
6. Select:
   - App: **Mail**
   - Device: **Other** → Type "Timesheet App"
7. Click **Generate**
8. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update Backend Configuration

1. Open file: `/app/backend/.env`
2. Update these lines:

```bash
# Change this line from false to true
SMTP_ENABLED=true

# Add your Gmail address
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop    # Your 16-char app password
SMTP_FROM_EMAIL=your-email@gmail.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workforce-doctor.preview.emergentagent.com
```

### Step 3: Restart Backend

```bash
sudo supervisorctl restart backend
```

### Step 4: Test It!

1. Login as Admin
2. Go to Admin tab → Click "Invite"
3. Fill in employee details with a REAL email address
4. Click "Generate Link"
5. Check the employee's email inbox! 📧

---

## 📧 **What Employees Will Receive**

A professional HTML email with:
- **Subject**: "Join Supreme Hospitality - Complete Your Registration"
- Welcome message with employee's name
- Job title mentioned
- Big "Complete Registration" button
- Backup link to copy/paste
- Clear instructions
- 7-day expiration notice
- Professional branding

Example:
```
Hi John Doe,

You've been invited to join Supreme Hospitality as a Room Attendant!

To complete your registration and start using the app, 
please click the button below:

[Complete Registration Button]

Or copy and paste this link:
https://yourapp.com/register?token=ABC123...

What's next?
• Click the link above
• Your details will be pre-filled
• Set a secure 4-6 digit PIN
• Start clocking in and managing your shifts!
```

---

## 🎯 **Alternative Email Providers**

### Using Outlook/Office 365:
```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workforce-doctor.preview.emergentagent.com
```

### Using SendGrid (Recommended for Production):
1. Sign up at https://sendgrid.com (Free: 100 emails/day)
2. Get API key
3. Use these settings:

```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workforce-doctor.preview.emergentagent.com
```

---

## ⚠️ **Troubleshooting**

### Email not sending?

1. **Check backend logs**:
```bash
tail -f /var/log/supervisor/backend.err.log
```

2. **Common issues**:
   - Wrong app password → Regenerate in Google
   - 2FA not enabled → Enable it first
   - Wrong SMTP settings → Double-check host/port
   - Gmail blocking → Try "Less secure app access"

3. **Test email manually**:
   - Create test invitation
   - Check backend logs for "Email sent successfully"
   - If errors appear, they'll show in logs

### Still not working?

**Fallback mode** (already active):
- Email disabled? No problem!
- Invitation link still shows in admin panel
- Copy link manually
- Share via SMS, WhatsApp, or any messaging app
- 100% functional without email

---

## 🎨 **Customization**

Want to customize the email template?

Edit file: `/app/backend/server.py`
Find function: `send_invitation_email()`
Modify the HTML email body (around line 570)

---

## ✅ **Benefits of Email Invitations**

With email enabled:
- ✅ **Professional**: Branded emails build trust
- ✅ **Automatic**: No manual copy/paste needed
- ✅ **Trackable**: Know when employees received invite
- ✅ **Reliable**: Less chance of link getting lost
- ✅ **Convenient**: Employees can access from inbox anytime
- ✅ **Backup**: Link still shown in admin panel

Without email (current):
- ✅ **Works perfectly**: No email needed
- ✅ **Flexible**: Share link however you want
- ✅ **Simple**: No setup required
- ✅ **SMS/WhatsApp**: Often preferred for hospitality

---

## 🔒 **Security Notes**

- App passwords are more secure than regular passwords
- Passwords stored in `.env` (not in code)
- Email connection encrypted (TLS)
- Invitation links expire after 7 days
- One-time use tokens
- No sensitive data in emails

---

## 📊 **Production Recommendations**

For production deployment:
1. ✅ Use company email domain (looks more professional)
2. ✅ Use SendGrid or similar service (more reliable)
3. ✅ Set up SPF/DKIM records (avoid spam folder)
4. ✅ Monitor email delivery rates
5. ✅ Keep backup of invitation links

---

## Need Help?

- Check: `/app/EMAIL_SETUP_GUIDE.md` for detailed guide
- Backend logs: `/var/log/supervisor/backend.err.log`
- Test with your own email first
- Use fallback (manual link sharing) anytime

**Your invitation system works with or without email!** 🎉
