# Payment Flow Testing Guide

## Flow Overview

### ✅ FIXED ISSUES:
1. **Payment Gating:** Course only accessible AFTER payment confirmation
2. **Add to Cart:** Now redirects to cart page immediately
3. **Cart Display:** Items properly loaded and displayed

---

## Complete Payment Flow (Step by Step)

### Step 1: Add Paid Course to Cart
**What to do:**
1. Go to http://localhost:5175/courses
2. Click on a **PAID course** (price > 0)
3. Click **"Tambah ke Cart"** (Add to Cart) button
4. ✅ Should immediately redirect to `/cart` page

**What's happening:**
- `POST /cart/items` adds course to Cart collection in MongoDB
- `nav('/cart')` redirects to cart page
- Cart page fetches `GET /cart` which loads items from database

---

### Step 2: Verify Cart Shows Items
**What to do:**
1. On Cart page, should see the course(s) added
2. Verify price is displayed correctly
3. Check total amount is calculated

**What might be wrong:**
- If cart empty: Check MongoDB Cart collection
- If items shown but no price: Course not published or priceIdr not set

---

### Step 3: Click "Pembayaran" (Checkout)
**What to do:**
1. Click **"Pembayaran"** button on Cart page
2. Wait for Midtrans Snap popup to appear

**What's happening:**
- `POST /checkout` endpoint is called
- Backend validates cart has items
- Backend validates user hasn't purchased courses yet
- Backend creates Order in MongoDB
- Backend creates Midtrans Snap transaction
- Returns snapToken to frontend
- Frontend loads Midtrans Snap script from CDN
- Snap popup opens with payment options (QRIS, VA)

**Error handling:**
- ❌ "Midtrans belum dikonfigurasi" → .env keys missing, restart server
- ❌ "Cart kosong" → Add items first
- ❌ "Semua course sudah terbeli" → Free courses auto-granted, only paid ones in cart

---

### Step 4: Complete Payment (Sandbox)
**What to do:**
1. In Snap popup, select payment method:
   - **QRIS** - If you have QR scanner or test card
   - **Virtual Account (VA)** - Bank transfer option
2. Follow Midtrans sandbox instructions
3. Complete payment

**Midtrans Sandbox Test Payment:**
- Test card available in Midtrans docs
- Use any test VA account
- Payment should complete within seconds

**What's happening:**
- Snap sends payment to Midtrans servers
- Midtrans processes payment
- Midtrans sends webhook to `POST /payments/midtrans/notification`
- Backend verifies signature (SHA512)
- Backend marks Order as "paid"
- Backend adds courseIds to user.purchasedCourseIds
- Backend clears cart
- Backend sends confirmation email
- Frontend onSuccess callback refreshes cart
- Cart shows "successfully paid" message

---

### Step 5: Access Course Material (NOW WITH PROTECTION)
**What to do:**
1. Go to http://localhost:5175/courses/{courseId}
2. Click on a lesson to open

**PAYMENT GATING FLOW (NEW):**
1. Student clicks lesson
2. Frontend calls `POST /courses/{id}/start` 
3. Backend checks:
   - ✅ Is course published?
   - ✅ Is course paid? If yes, is user in purchasedCourseIds?
   - ✅ Does user have active course? If yes, must complete first
4. If checks pass → activates course → frontend navigates to lesson
5. If checks fail → error message "Course belum terbeli"

**Expected behavior:**
- ✅ Before payment: Lesson button shows "LOCK" icon, cannot click
- ✅ After payment: Lesson button clickable
- ✅ Click lesson → navigates to full lesson view
- ✅ See video, materials, can mark complete

---

## Testing Scenarios

### Scenario 1: Free Course (Price = 0)
```
1. Add FREE course to cart
2. Click checkout
3. Should show: "Semua course sudah gratis / sudah terbeli"
4. Course automatically added to purchasedCourseIds
5. Can immediately open lessons (no popup, no payment)
6. ✅ SUCCESS
```

### Scenario 2: Paid Course (Price > 0, Not Purchased)
```
1. Add PAID course to cart
2. Click checkout
3. Midtrans popup appears ✅
4. Complete payment in sandbox
5. Order marked as "paid"
6. User added to purchasedCourseIds
7. Course becomes accessible
8. ✅ SUCCESS
```

### Scenario 3: Try Access Before Payment
```
1. Add course to cart (don't checkout yet)
2. Go back to course
3. Try to click lesson
4. Should show error: "Course belum terbeli"
5. Cannot navigate to lesson
6. ✅ SUCCESS (payment gating working)
```

### Scenario 4: Already Purchased Course
```
1. User already has this course in purchasedCourseIds
2. Go to course page
3. Try to add to cart → already purchased
4. Click lesson → immediately opens (no checkout flow)
5. ✅ SUCCESS
```

### Scenario 5: Mixed Cart (Paid + Free)
```
1. Add PAID course #1
2. Add FREE course #2
3. Checkout
4. Midtrans shows payment for $X (only for course #1)
5. Free course auto-granted without payment
6. After completing payment:
   - Both courses in purchasedCourseIds
   - Can access both
   - Cart cleared
7. ✅ SUCCESS
```

---

## What Changed

### Frontend (CourseDetail.jsx)
**Before:** Student clicked lesson → Direct navigate to `/courses/{id}/lessons/{lessonId}`  
**Now:** Student clicks lesson → Call `/courses/{id}/start` (with payment check) → Then navigate

```javascript
// BEFORE (❌ no payment gating):
if (isStudent) {
  nav(`/courses/${id}/lessons/${l._id}`);
  return;
}

// NOW (✅ with payment gating):
if (isStudent) {
  api.post(`/courses/${id}/start`)
    .then(() => nav(`/courses/${id}/lessons/${l._id}`))
    .catch((e) => setLockError(e?.response?.data?.error?.message));
  return;
}
```

**Before:** Add to cart showed message  
**Now:** Add to cart navigates to cart page

```javascript
// BEFORE:
setLockError('Course ditambahkan ke cart.')

// NOW:
nav('/cart')
```

### Backend (Already Had Gating)
`/courses/:id/start` endpoint checks payment status:

```javascript
const price = course.priceIdr || 0;
if (price > 0) {
  const purchased = (user.purchasedCourseIds || [])
    .some((x) => String(x) === String(course._id));
  if (!purchased) throw new HttpError(402, 'Course belum terbeli');
}
```

---

## Verification Checklist

### Before Testing
- [ ] Server running: `npm run dev`
- [ ] Midtrans keys in `.env`: MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY
- [ ] MongoDB connection working
- [ ] Frontend accessible: http://localhost:5175

### Cart Flow
- [ ] Add paid course → redirects to /cart
- [ ] Cart shows correct items and prices
- [ ] Total calculated correctly
- [ ] Can remove items from cart

### Checkout Flow
- [ ] Click checkout → Midtrans popup appears
- [ ] QRIS and VA payment methods visible
- [ ] Can select payment method

### Payment Gating
- [ ] ✅ Before payment: Cannot click lesson (locked)
- [ ] ✅ Try to click: Shows "Course belum terbeli" error
- [ ] ✅ After payment: Can click lesson
- [ ] ✅ Lesson opens with full content (video, materials)

### Email Notifications
- [ ] Purchase notification email sent before payment
- [ ] Purchase confirmation email sent after payment

### Order Tracking
- [ ] Order created in MongoDB with "pending" status
- [ ] After payment: Status changes to "paid"
- [ ] Can view order history: `GET /api/payments/orders`

---

## Troubleshooting

### Issue: "This course belum terbeli" appears even after payment
**Solution:**
- Check if Order.status is "paid" in MongoDB
- Check if courseIds properly added to user.purchasedCourseIds
- Verify webhook received from Midtrans (check console logs)
- Check signature verification isn't failing

### Issue: Cart empty when clicking checkout
**Solution:**
- Verify item was added: Check MongoDB Cart collection
- Try removing and re-adding item
- Refresh page and try again
- Check if item is from published course

### Issue: Snap popup doesn't appear
**Solution:**
- Check browser console for errors
- Verify clientKey is being returned from /payments/config
- Verify Snap script loaded from CDN
- Check if payment amount > 0

### Issue: Payment marked as pending but courses not unlocked
**Solution:**
- Webhook may not have been received
- Check `/payments/midtrans/notification` endpoint is reachable
- Configure webhook URL in Midtrans dashboard
- Check server logs for webhook errors

---

## Production Migration Checklist

Before deploying to production:
- [ ] Change `MIDTRANS_IS_PRODUCTION=true`
- [ ] Update MIDTRANS_CLIENT_KEY with production key
- [ ] Update MIDTRANS_SERVER_KEY with production key  
- [ ] Update MIDTRANS_MERCHANT_ID if different
- [ ] Test with real payment (small amount)
- [ ] Verify email notifications use production SMTP
- [ ] Configure webhook URL in Midtrans dashboard
- [ ] Set up monitoring/logging for payments
- [ ] Test complete payment flow end-to-end
- [ ] Review error handling and user feedback messages

---

## Key Files Modified

- `client/src/pages/CourseDetail.jsx` - Add /start call before navigation, add cart redirect
- `server/src/routes/courses.js` - /start endpoint has payment check (already existed)
- `server/src/routes/payments.js` - Checkout and webhook (already completed)
- `server/.env` - Midtrans credentials (already added)

