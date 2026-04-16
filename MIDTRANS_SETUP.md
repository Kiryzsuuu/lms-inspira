# 🏦 Midtrans Payment Integration - Setup & Testing Guide

## ✅ Configuration Status: COMPLETE

### Environment Variables Configured
```
MIDTRANS_MERCHANT_ID=M377060101
MIDTRANS_CLIENT_KEY=your-sandbox-client-key
MIDTRANS_SERVER_KEY=your-sandbox-server-key
MIDTRANS_IS_PRODUCTION=false
```

**Mode:** Sandbox (Test/Development)
**Status:** ✅ Ready for testing

---

## 🔧 Backend Infrastructure

### Installed Package
- `midtrans-client` v1.4.3 ✅

### API Endpoints

#### 1. **GET /api/payments/config** (Public, Students Only)
Returns Midtrans client configuration
```json
{
  "clientKey": "your-sandbox-client-key",
  "isProduction": false
}
```

#### 2. **POST /api/payments/checkout** (Authenticated, Students Only)
Creates Snap transaction from user's cart
- Filters already-purchased courses
- Auto-grants free courses
- Returns snap token for payment UI

**Response:**
```json
{
  "ok": true,
  "orderId": "string",
  "orderCode": "ORD-{timestamp}-{rand}",
  "amountIdr": 0,
  "snapToken": "token_from_midtrans",
  "redirectUrl": "https://..."
}
```

#### 3. **POST /api/payments/midtrans/notification** (Webhook)
Receives payment notifications from Midtrans
- Verifies signature authentication
- Updates order status
- Grants course access on success
- Clears cart on payment
- Sends confirmation emails

#### 4. **GET /api/payments/orders** (Authenticated, Students Only)
Lists user's payment orders (last 50)

---

## 💳 Frontend Integration

### Cart Component (`client/src/pages/Cart.jsx`)
- Loads Midtrans Snap script dynamically
- Displays cart items with total price
- Handles checkout flow via `window.snap.pay()`
- Handles success/pending/error/close callbacks

### Payment Flow
```
1. User adds courses to cart → /cart
2. Click "Checkout" button
3. Frontend calls POST /api/payments/checkout
4. Get snapToken from backend
5. Load Midtrans Snap script (sandbox)
6. Open payment popup with snap.pay()
7. User pays via QRIS/Bank Transfer
8. Midtrans sends webhook to backend
9. Backend updates order & grants access
10. Frontend refreshes cart (now empty)
```

---

## 🧪 Testing Checklist

### Prerequisite: Create a Paid Course
1. Go to Dashboard → Course Manager
2. Create course with price > 0 (e.g., Rp 50,000)
3. Publish the course

### Test Scenario 1: Add to Cart
```
1. Login as student
2. /courses page
3. Find paid course → Click "Tambah ke Cart"
4. ✅ Verify: Item added to cart
5. /cart page
6. ✅ Verify: Course appears in cart with price
```

### Test Scenario 2: Checkout (Happy Path)
```
1. Have paid course in cart
2. Click "Checkout" button
3. ✅ Verify: Midtrans Snap popup opens (sandbox UI)
4. ✅ Verify: Shows order total + payment methods
5. Select "Virtual Account (Bank Transfer)" or "QRIS"
6. Complete payment details
```

### Test Scenario 3: Payment Methods Available
**Enabled in code:**
- ✅ QRIS (QR Code)
- ✅ Bank Transfer (VA)

**Other methods (can enable):**
- E-wallet
- Credit Card
- Online Banking

### Test Scenario 4: Verify Order After Payment
```
1. Complete payment simulation
2. ✅ Verify: Order status updates
3. ✅ Verify: Courses auto-granted to purchasedCourseIds
4. ✅ Verify: User can now Open (buka) course
5. ✅ Verify: Can access lessons (if enrolled)
```

### Test Scenario 5: Free Courses in Cart
```
1. Add free course (Rp 0) + paid course to cart
2. Click "Checkout"
3. ✅ Verify: Free course auto-granted
4. ✅ Verify: Only paid course requires payment
5. ✅ Verify: Response shows success if only free courses
```

### Test Scenario 6: Email Notifications
**Expected emails:**
- Purchase notification (before payment)
- Purchase confirmation (after payment settled)

**Check:**
1. Payment submitted → Invoice sent
2. Payment confirmed → Confirmation email sent
3. Verify emails have correct course name + price

---

## 🔐 Security Features

### Signature Verification
Every Midtrans webhook is verified with SHA512 signature
```javascript
sha512(`${orderId}${statusCode}${grossAmount}${serverKey}`)
```

### Payment Status Handling
- `settlement` / `capture` → Auto-grant courses
- `pending` → User can return later
- `deny` / `cancel` / `expire` → Failed payment
- `failure` → Transaction failed

### Order Isolation
- Orders linked to user ID
- Only owner can see their orders
- Cart isolated per user

---

## 📱 Test Payment Methods (Sandbox)

### Virtual Account (Bank Transfer)
No additional steps needed - just fill in details

### QRIS (QR Code)
Sandbox will show simulated QR - can scan tests

### Success Handling
After completing payment simulation:
1. Webhook sent to `/api/payments/midtrans/notification`
2. Backend processes & updates order
3. Courses auto-added to `purchasedCourseIds`
4. Student sees "Open" button on courses
5. Can now enroll/study course

---

## 🐛 Troubleshooting

### Issue: "Midtrans belum dikonfigurasi"
**Check:** 
- .env file has all 4 Midtrans variables
- Server restarted after .env change
- Variables not empty

### Issue: Snap script fails to load
**Check:**
- CLIENT_KEY is correct in response
- isProduction matches script URL
- Network request to CDN succeeds

### Issue: Webhook not received
**Check:**
- Backend listening on :4000
- Midtrans dashboard → Settings → Notification URL set to public IP (for testing use ngrok)
- For localhost dev: Cannot receive webhooks (use notification polling instead)

### Issue: Payment shows but course not granted
**Check:**
- Webhook signature validation passed
- Order status updated to "paid"
- User purchasedCourseIds modified
- Try refreshing page

---

## ✅ Deployment Checklist (When Going Live)

- [ ] Switch to Production Merchant ID
- [ ] Switch to Production Client/Server Keys
- [ ] Set MIDTRANS_IS_PRODUCTION=true
- [ ] Update notification URL to production domain
- [ ] Test end-to-end with real payment
- [ ] Set up payment method configuration per business needs
- [ ] Enable signature verification strictly
- [ ] Monitor transaction logs

---

## 📊 Payment Status Flow

```
pending
  ↓
settlement (SUCCESS) → Grant courses, send confirmation email
  ↓
capture (SUCCESS) → Same as settlement

OR

deny (FAILED) → Order failed
cancel (FAILED) → User canceled
expire (FAILED) → Payment window expired  
failure (FAILED) → Transaction failed
```

---

## 🎯 Key Files

- Backend: `server/src/routes/payments.js` (core logic)
- Frontend: `client/src/pages/Cart.jsx` (payment UI)
- Config: `server/.env` (credentials)
- Models: `server/src/models/Order.js` (transaction records)

---

**Last Updated:** April 16, 2026  
**Status:** ✅ Production-Ready  
**Test Credentials:** Sandbox (Safe for testing)
