# Real Email Login Setup for LocalPro

LocalPro can send login codes to real email addresses. Choose **one** option:

---

## Option 1: Gmail SMTP (Easiest)

1. Use a Gmail account
2. Enable **2-Step Verification** in Google Account settings
3. Create an **App Password**: Google Account → Security → App passwords → Mail
4. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_char_app_password
EMAIL_FROM="LocalPro <your.email@gmail.com>"
```

5. Restart: `npm run dev`

---

## Option 2: Resend (Developer-friendly)

1. Sign up at **https://resend.com** (free tier)
2. Copy API key
3. Add to `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="LocalPro <onboarding@resend.dev>"
```

---

## How to Login

### Email + Password (works without Gmail setup)
1. Click **Sign Up** → **Email** tab → **Password**
2. Register with any email (e.g. `you@gmail.com`) and a password
3. Click **Log In** → enter same email + password → you are logged in

Demo account: `priya@demo.com` / `password123`

### Gmail / Google Sign-In
1. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` (see below)
2. Click **Log In → Google tab → Continue with Google**
3. Pick your Gmail account — instant login via Google servers

### Email Code (needs Gmail SMTP or Resend)
1. Click **Log In → Email tab → Email Code**
2. Enter your real email, receive 6-digit code via Gmail SMTP

---

## Google OAuth Setup (Sign in with Gmail)

1. Go to **https://console.cloud.google.com**
2. Create a project → **APIs & Services → Credentials**
3. **Create Credentials → OAuth client ID → Web application**
4. **Authorized redirect URI:** `http://localhost:3000/api/auth/google/callback`
5. Add to `.env`:

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

6. Restart: `npm run dev`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Email not configured | Add SMTP or RESEND_API_KEY to `.env` |
| Gmail "Authentication failed" | Use App Password, not regular password |
| Email in spam | Check spam/junk folder |
| Code expired | Codes expire in 5 minutes — request new one |
