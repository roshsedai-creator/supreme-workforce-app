# Email Setup Guide for Invitation System

## Overview
Your app now supports automatic email sending for employee invitations! When you create an invitation, the system can automatically send a beautifully formatted email to the employee with their registration link.

## How It Works

1. **Admin creates invitation** (Admin panel → "Invite" button)
2. **System generates unique link** with 7-day expiration
3. **Email automatically sent** to employee with:
   - Welcome message
   - Pre-filled registration link
   - Instructions to complete setup
   - Professional HTML formatting
4. **Employee clicks link** → Registers → Starts working!

---

## Email Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "Timesheet App"
   - Copy the 16-character password

3. **Add to Backend .env file** (`/app/backend/.env`):
```bash
# Email Settings
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_EMAIL=your-email@gmail.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workhours-14.preview.emergentagent.com
```

### Option 2: Outlook/Office 365

```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workhours-14.preview.emergentagent.com
```

### Option 3: Custom SMTP Server

```bash
SMTP_ENABLED=true
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
COMPANY_NAME=Your Company Name
APP_URL=https://your-app-url.com
```

### Option 4: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com (Free tier: 100 emails/day)
2. Create API key with "Mail Send" permission
3. Use these settings:

```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=verified-sender@yourdomain.com
COMPANY_NAME=Supreme Hospitality
APP_URL=https://workhours-14.preview.emergentagent.com
```

---

## Testing Email Setup

### 1. Without Email (Current Default)
- Invitation link shown in admin panel
- Copy link manually and share via SMS/WhatsApp
- No email configuration needed

### 2. With Email Enabled
- Invitation link sent automatically
- Admin also sees link (as backup)
- Professional branded email

---

## How to Use

### Creating Invitations:

1. Login as Admin
2. Go to **Admin** tab
3. Click **"Invite"** button
4. Fill in employee details:
   - First Name
   - Last Name
   - Email *(will receive invitation)*
   - Phone
   - Job Title
   - Site Assignment
5. Click **"Generate Link"**
6. If email is enabled → Email sent automatically ✅
7. Link also displayed in app (as backup)

### What Employees Receive:

```
Subject: Join Supreme Hospitality - Complete Your Registration

Hi [Name],

You've been invited to join Supreme Hospitality as a Room Attendant!

To complete your registration and start using the app, please click the button below:

[Complete Registration Button]

Or copy and paste this link into your browser:
https://yourapp.com/register?token=ABC123...

What's next?
• Click the link above
• Your details will be pre-filled
• Set a secure 4-6 digit PIN
• Start clocking in and managing your shifts!

This invitation link will expire in 7 days.
```

---

## Troubleshooting

### Email Not Sending?

1. **Check logs**:
```bash
tail -f /var/log/supervisor/backend.err.log
```

2. **Common issues**:
   - Wrong password → Double-check app password (not regular password for Gmail)
   - Port blocked → Try port 587 or 465
   - 2FA not enabled → Required for Gmail
   - Invalid credentials → Test login manually

3. **Fallback mode**:
   - Set `SMTP_ENABLED=false`
   - App will still work
   - Copy/paste invitation links manually

### Email Goes to Spam?

**For Gmail:**
- Use Gmail SMTP with proper app password
- Increase sending reputation by starting slowly

**For Production:**
- Use a verified domain email (not Gmail)
- Set up SPF, DKIM, DMARC records
- Use dedicated email service (SendGrid/Mailgun)

---

## Email Preview

The email sent to employees is professionally formatted with:
- Company branding
- Clear call-to-action button
- Step-by-step instructions
- Fallback text link
- Expiration notice
- Mobile-friendly responsive design

---

## Next Steps

1. **For Testing**: Use Gmail with app password
2. **For Production**: 
   - Use company domain email
   - Consider SendGrid/Mailgun for reliability
   - Configure proper DNS records
   - Monitor bounce rates

---

## Support

If you need help setting up email:
1. Try Gmail first (easiest)
2. Check backend logs for error messages
3. Test with your own email first
4. Enable/disable with `SMTP_ENABLED` flag

**Note**: Email is optional! The app works perfectly without it. You can always copy the invitation link and share it manually via SMS, WhatsApp, or any messaging platform.
