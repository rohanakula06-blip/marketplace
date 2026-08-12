# Real SMS OTP Setup for LocalPro

LocalPro sends OTP codes to real mobile numbers via SMS. Choose **one** provider below.

---

## Option 1: Fast2SMS (Recommended for India — Free credits)

**Best for hackathons and Indian phone numbers (+91).**

### Steps (5 minutes):

1. Go to **https://www.fast2sms.com** and sign up
2. Verify your email and complete KYC (required for SMS)
3. Go to **Dev API** in the dashboard → copy your **API Key**
4. Add to your `.env` file:

```env
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=paste_your_api_key_here
```

5. Restart the server: `npm run dev`
6. Test login with your real mobile number

---

## Option 2: MSG91 (India — Production grade)

1. Sign up at **https://msg91.com**
2. Create an **OTP Template** (must include `##OTP##` variable)
3. Add to `.env`:

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_TEMPLATE_ID=your_template_id
```

---

## Option 3: Twilio (Global)

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

---

## Verify Setup

```
GET http://localhost:3000/api/auth/otp/send
```

Should return `"configured": true` and `"activeProvider": "fast2sms"`.
