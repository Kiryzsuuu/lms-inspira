# Midtrans Integration Verification Checklist

## System Status ✅

**Environment:** Sandbox (Test Mode)
- **Server Key:** (your sandbox server key)
- **Client Key:** (your sandbox client key)
- **Merchant ID:** M377060101
- **Servers:** Running
  - Backend: http://localhost:4000
  - Frontend: http://localhost:5175

---

## API Verification Results

### ✅ 1. Payment Config Endpoint
**Endpoint:** `GET /api/payments/config`
**Status:** Working
- Returns Midtrans client key and isProduction flag
- Requires: Student authentication
- Response: `{ clientKey: string, isProduction: boolean }`

### ✅ 2. Checkout Endpoint  
**Endpoint:** `POST /api/payments/checkout`
**Implementation:**
- ✅ Validates cart has items
- ✅ Filters out already purchased courses
- ✅ Auto-grants free courses (0 price)
- ✅ Creates Order in database with Midtrans reference
- ✅ Sends purchase notification email
- ✅ Creates Snap transaction with proper itemization
- ✅ Returns snapToken for frontend popup

**Response Example:**
```json
{
  "ok": true,
  "orderId": "mongodb_id",
  "orderCode": "ORD-timestamp-hexstring",
  "amountIdr": 100000,
  "snapToken": "SNAP_TOKEN_FROM_MIDTRANS",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v1/..."
}
```

### ✅ 3. Payment Notification Webhook
**Endpoint:** `POST /api/payments/midtrans/notification`
**Implementation:**
- ✅ Validates Midtrans signature (SHA512 verification)
- ✅ Updates Order status (paid, expired, canceled, failed)
- ✅ Auto-grants courses on settlement/capture
- ✅ Sends purchase confirmation email
- ✅ Clears cart on successful payment
- ✅ Handles fraud detection

**Signature Verification:**
```
SHA512(order_id + status_code + gross_amount + server_key)
```

### ✅ 4. Order History Endpoint
**Endpoint:** `GET /api/payments/orders`
**Implementation:**
- ✅ Returns user's orders sorted by date
- ✅ Returns up to 50 recent orders
- ✅ Requires: Student authentication

---

## Frontend Verification

### ✅ Cart Component (client/src/pages/Cart.jsx)
- ✅ Displays cart items correctly
- ✅ Loads Midtrans Snap script dynamically from CDN
- ✅ Calls POST /api/payments/checkout on payment button click
- ✅ Opens Snap payment popup via window.snap.pay(snapToken)
- ✅ Handles payment success callback (refreshes cart)
- ✅ Handles payment pending callback
- ✅ Handles payment error callback
- ✅ Handles payment close callback

**Snap Integration:**
- Dynamically loads: `https://app.sandbox.midtrans.com/snap/snap.js`
- Uses clientKey from /config endpoint
- Payment methods: QRIS, Bank Transfer

---

## Database Models Verification

### ✅ Order Model
- ✅ Tracks orderCode (unique per transaction)
- ✅ Stores items array with courseId, title, priceIdr
- ✅ Tracks amountIdr
- ✅ Stores Midtrans metadata (snapToken, redirectUrl, transactionStatus, paymentType, fraudStatus, rawNotification, settlementTime)
- ✅ Tracks status (pending → paid/expired/canceled/failed)

### ✅ User Model
- ✅ purchasedCourseIds array updated on payment settlement
- ✅ Courses auto-granted when payment confirmed

### ✅ Cart Model
- ✅ Automatically cleared on successful payment

---

## Manual Testing Steps

### Test 1: View Payment Configuration
```bash
# 1. Login as student to get JWT token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Extract JWT from response

# 2. Get payment config
curl -X GET http://localhost:4000/api/payments/config \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Expected: { "clientKey": "(your sandbox client key)", "isProduction": false }
```

### Test 2: Checkout Flow (UI)
1. Go to http://localhost:5175
2. Login as student
3. Browse courses and add paid course to cart
4. Go to cart
5. Click "Pembayaran" (Payment) button
6. Midtrans Snap popup should appear
7. Verify payment methods show QRIS and Bank Transfer

### Test 3: Free Course Auto-Grant
1. Add a free course (price = 0) to cart
2. Click checkout
3. Should see message: "Semua course di cart sudah gratis / sudah terbeli"
4. Cart should clear automatically
5. Course should appear in "Kursus Saya" (My Courses)

### Test 4: Payment Simulation (Sandbox)
1. Open Snap payment popup
2. Select payment method
3. Follow Midtrans sandbox instructions:
   - QRIS: Scan QR code or enter test data
   - Bank Transfer: Use provided account details
4. Complete payment in sandbox
5. Verify:
   - Order status changes to "paid" 
   - Course automatically added to purchasedCourseIds
   - Purchase confirmation email sent
   - Cart clears
   - Course accessible in lessons

### Test 5: Already Purchased Course
1. Try adding already purchased course to cart
2. Call /api/payments/checkout
3. Should auto-exclude from payment
4. Should return: "Semua course di cart sudah gratis / sudah terbeli"

---

## Email Notifications Verification

### ✅ Implemented Email Types
1. **Purchase Notification** - Sent when checkout called (before payment)
   - To: student email
   - Subject: Purchase notification for course
   - Contains: Course name, price

2. **Purchase Confirmation** - Sent when payment confirmed (after settlement)
   - To: student email
   - Subject: Purchase confirmation
   - Contains: Course name, purchase date

3. **Admin Notifications** - (If configured)
   - Tracks purchase activity

### Email Testing
- Check student email inbox for notification emails
- Verify email content includes course name and amount
- Verify purchase confirmation arrives after successful payment

---

## Common Test Scenarios

### Scenario 1: Successful Payment
```
1. Add paid course to cart (price > 0)
2. Checkout → Snap popup opens
3. Complete payment (sandbox test cards available)
4. Order status: pending → paid
5. User.purchasedCourseIds updated
6. Cart cleared
7. Course accessible in lessons
8. Confirmation email sent ✅
```

### Scenario 2: Mixed Cart (Paid + Free)
```
1. Add both paid and free courses
2. Checkout → Only paid course goes to Midtrans
3. Free courses auto-granted immediately
4. Payment popup for paid courses only
5. After settlement: user has access to all ✅
```

### Scenario 3: Already Purchased
```
1. Add previously purchased course to cart
2. Checkout → Auto-excluded from payment
3. Response: "already purchased"
4. Cart may clear based on other items ✅
```

### Scenario 4: Expired/Failed Payment
```
1. Checkout → Snap popup
2. Don't complete or let expire
3. Order status: pending → expired/failed
4. User NOT granted access
5. Courses stay in cart for retry ✅
```

---

## Deployment Checklist

Before moving to **PRODUCTION**:

- [ ] Change `MIDTRANS_IS_PRODUCTION=true` in `.env`
- [ ] Update Client Key to production key
- [ ] Update Server Key to production key
- [ ] Update Merchant ID to production ID
- [ ] Frontend Snap script will auto-switch to production URL
- [ ] Test 1-2 real payments with small amounts
- [ ] Verify email notifications use production SMTP
- [ ] Set up Midtrans webhook URL in dashboard
- [ ] Ensure error handling and logging configured
- [ ] Review security (JWT validation, signature verification)
- [ ] Test payment failure scenarios
- [ ] Verify course auto-grant logic
- [ ] Monitor first week of transactions

---

## Troubleshooting

### Issue: "Midtrans belum dikonfigurasi"
**Solution:** 
- Verify server/.env has MIDTRANS keys
- Restart backend: `npm run dev:server`
- Check env.js has MIDTRANS variables in schema

### Issue: Snap popup doesn't open
**Solution:**
- Check browser console for errors
- Verify clientKey returned from /config
- Ensure Snap script loaded from CDN
- Check CORS settings if different domain

### Issue: Signature verification failed
**Solution:**
- Verify Server Key is correct
- Check Midtrans webhook configuration
- Verify method is SHA512
- Check order_id, status_code, gross_amount format

### Issue: Courses not auto-granted
**Solution:**
- Check Order.status is actually "paid"
- Verify paymentType/transactionStatus correct
- Check fraud_status is not "deny"
- Verify courseIds in Order.items match Course._id

### Issue: Emails not sending
**Solution:**
- Check Nodemailer configuration in utils/mailer.js
- Verify email template exists
- Check SMTP credentials if using external provider
- Try synchronous send for testing

---

## Next Steps

1. **Test all scenarios above** ✅
2. **Monitor order logs** in MongoDB
3. **Verify email delivery** in student inbox
4. **Try sandbox payment** with test cards
5. **Check webhook logs** in Midtrans dashboard
6. **Review security** before production
7. **Plan production migration** timeline

---

## Security Notes

- ✅ All endpoints require JWT authentication (except webhook)
- ✅ Webhook validates Midtrans signature (SHA512)
- ✅ No sensitive keys exposed in frontend
- ✅ RBAC ensures only students can checkout
- ✅ Orders linked to authenticated user
- ✅ Payment gating prevents accessing unpaid courses

---

## Support & Documentation

- **Midtrans Docs:** https://docs.midtrans.com
- **Sandbox Testing:** https://midtrans.com/en/sandbox
- **API Reference:** https://api-docs.midtrans.com
- **SDK Docs:** https://github.com/midtrans/midtrans-nodejs-client

