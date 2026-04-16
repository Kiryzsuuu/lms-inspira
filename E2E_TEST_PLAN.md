# End-to-End Testing Plan

## Issue: Course Pricing Fixed ✅

### What Was Fixed
- **Course Manager** now properly populates price field when editing a course
- `priceIdr` is now loaded into form when selecting a course
- Course prices display correctly in listings and cart

## Test Scenarios

### Scenario 1: Create Course with Price (15 min)
**Goal:** Verify teacher can create paid course and price displays correctly

Prerequisites:
- Logged in as TEACHER role

Steps:
1. Navigate to Dashboard → Course Manager
2. Click "Create Course"
3. Fill form:
   - Title: "Test Course RP 50.000"
   - Description: "Test course with pricing"
   - Price: 50000
   - Cover Image: (upload any image)
   - Publish: ✓ Yes
4. Save course
5. Go to Courses page
6. Verify: Course appears with price "Rp 50.000,00"

**Expected Result:** Price displays correctly ✅

---

### Scenario 2: Edit Existing Course Price (10 min)
**Goal:** Verify editing course updates price correctly

Prerequisites:
- Have an existing course

Steps:
1. Go to Dashboard → Course Manager
2. Click on existing course in list
3. Verify: Price field shows current price in form
4. Change price to 75000
5. Save
6. Go to Courses page
7. Verify: Course shows updated price "Rp 75.000,00"

**Expected Result:** Price updates and displays correctly ✅

---

### Scenario 3: Add Paid Course to Cart (10 min)
**Goal:** Verify cart respects pricing

Steps:
1. Go to Courses page
2. Find course with price > 0
3. Click "Tambah ke Cart"
4. Verify: Redirects to /cart page immediately
5. Verify: Item in cart shows:
   - Course title
   - Price: "Rp XX.XXX,00"
   - Subtotal correct
6. Total price: Shows sum of all items

**Expected Result:** Cart displays and calculates totals correctly ✅

---

### Scenario 4: Payment Gating (15 min)
**Goal:** Verify paid courses require purchase before access

Steps:
1. **As student, WITHOUT purchasing:**
   - Go to Courses page
   - Find paid course
   - Click on course title or "Lihat Detail"
   - Try to click on first lesson
   - Should see error: "Gagal membuka materi: Course belum terbeli"
   
2. **As student, AFTER purchasing:**
   - Add course to cart → checkout → complete payment
   - Go back  to course page
   - Click on lesson
   - Should open lesson content ✅

**Expected Result:** Payment gating works correctly ✅

---

### Scenario 5: Free Course Access (10 min)
**Goal:** Verify free courses (price = 0) are always accessible

Steps:
1. Create course with price: 0
2. Log in as DIFFERENT student account
3. Go to Courses page
4. Click on free course
5. Click on first lesson
6. Should open without any payment

**Expected Result:** Free courses accessible without payment ✅

---

## Test Execution Order
1. Scenario 1 (Create course with price)
2. Scenario 3 (Add to cart - test pricing display)
3. Scenario 2 (Edit course price)
4. Scenario 4 (Payment gating)
5. Scenario 5 (Free course access)

## Browser Console Check
After each major action, verify browser console has NO errors (except CORS warnings are OK)

## Notes
- Reset/clear cart between tests if needed
- Use test account credentials
- Document any failures with screenshot
