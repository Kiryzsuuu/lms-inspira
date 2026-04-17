# End-to-End Testing: Question Management Features

## Test Environment
- **Server**: http://localhost:4000
- **Client**: http://localhost:5175
- **Database**: MongoDB (local)
- **User Role**: Teacher or Admin

---

## Test Case 1: Randomize Question Order (Acak Soal)

### Prerequisites
1. Be logged in as Teacher/Admin
2. Navigate to CourseManager → Courses → Select Course → Select Quiz
3. Have at least 2 questions in the quiz

### Steps
1. Click **"Acak Soal"** button (appears above question list)
2. Watch as questions are re-shuffled

### Expected Results
✅ **No error appears** (previously showed validation errors)
✅ Questions are randomly reordered - check the Order field changes
✅ All question data remains intact (type, content, choices/pairs)
✅ Success message or silent update (questions reload with new order)

### Detailed Validation
- Open Browser DevTools (F12) → Network tab
- Click "Acak Soal" button
- Look for multiple PUT requests to `/quizzes/{quizId}/questions/{questionId}`
- Each request should only have `{ order: X }` in request body
- All responses should have status 200 (not 422/400)

---

## Test Case 2: Auto-Reset Form When Changing Question Type

### Prerequisites
1. Be logged in as Teacher/Admin
2. Navigate to CourseManager → Course → Quiz section
3. Have the question form visible (scroll to "Tambah Soal" / "Update Soal" form)

### Detailed Steps

#### 2A: MCQ → Essay
1. Type selector shows **"Pilihan ganda"** (default)
2. In form:
   - Prompt is filled: `<p>Tulis pertanyaan di sini...</p>`
   - See **4 choice fields** (a, b, c, d)
   - See **"Correct Choice"** dropdown
   - Rubric empty
3. **Change Type to "Essay"** (click dropdown, select Essay)
4. **Observe:**
   - ✅ Choice fields are cleared/hidden
   - ✅ Rubric field appears or becomes editable
   - ✅ Prompt HTML remains unchanged
   - ✅ No validation errors

#### 2B: Essay → Matching
1. Type selector shows **"Essay"**
2. Current form state:
   - Prompt filled
   - Rubric visible (empty or has text)
   - No choices visible
3. **Change Type to "Mencocokan"** (Matching)
4. **Observe:**
   - ✅ Choice fields cleared
   - ✅ **Pair fields appear** (left/right columns)
   - ✅ Rubric field cleared/hidden
   - ✅ Prompt remains
   - ✅ At least 2 default empty pairs shown

#### 2C: Matching → MCQ
1. Type selector shows **"Mencocokan"**
2. Current form state:
   - Prompt visible
   - Pair fields visible (with or without data)
   - Rubric empty
3. **Change Type to "Pilihan ganda"** (MCQ)
4. **Observe:**
   - ✅ Pair fields cleared/hidden
   - ✅ **4 Choice fields reappear** (a, b, c, d - empty)
   - ✅ **"Correct Choice"** dropdown reappears set to "a"
   - ✅ Rubric field cleared/hidden
   - ✅ Prompt remains unchanged

### Expected Results Summary
✅ Form fields automatically reset/hide/show based on type
✅ Prompt always preserved during type changes
✅ No console errors (F12 → Console tab should be clean)
✅ User experience is smooth - form "adapts" to question type

---

## Test Case 3: Edit Button Works Correctly

### Prerequisites
1. Have at least 1 question in quiz
2. View question list at bottom of quiz section

### Steps
1. Click **"Edit"** button (blue button) on any question card
2. Form above should populate with:
   - ✅ Question type
   - ✅ Prompt HTML content
   - ✅ Choices/Pairs based on type
   - ✅ Correct answer settings
3. **Change something**: E.g., edit one choice text
4. Click **"Update Soal"** button (button text changed from "Tambah Soal")
5. Wait for update to succeed

### Expected Results
✅ Question data loads into form
✅ Form shows "Mode: Edit soal" banner with Cancel button
✅ Button changes to "Update Soal"
✅ Update succeeds without validation errors
✅ Question list refreshes with updated content
✅ Edit mode exits automatically after save

---

## Test Case 4: Move Up/Down Buttons Preserve Type

### Prerequisites
1. Have 2+ questions with different types (e.g., Q1=MCQ, Q2=Essay)
2. See question list

### Steps
1. Click **↑** or **↓** buttons to reorder questions
2. Check question card Order field updates
3. Verify question remains same type

### Expected Results
✅ Order field updates (e.g., 1→2, 2→1)
✅ Question type unchanged (MCQ still MCQ, Essay still Essay)
✅ No errors in console

---

## Test Case 5: Integration - Create Multiple Types Then Randomize

### Steps
1. **Add MCQ**: 
   - Type: Pilihan ganda
   - Prompt: "What is..."
   - Add 4 choices, set correct answer
   - Click "Tambah Soal"
2. **Add Essay**:
   - Type: Essay
   - Prompt: "Explain..."
   - Click "Tambah Soal"
3. **Add Matching**:
   - Type: Mencocokan
   - Prompt: "Match..."
   - Add 2+ pairs
   - Click "Tambah Soal"
4. **See 3 questions in list**
5. **Click "Acak Soal"**
6. **Verify**:
   - ✅ Questions shuffled (Order 1/2/3 might become 2/3/1, etc)
   - ✅ Types remain MCQ/Essay/Matching respectively
   - ✅ All content preserved
   - ✅ No validation errors

---

## Troubleshooting

### If Randomize Still Shows Error
- **Check Backend**: Server might not restarted after code changes
- **Solution**: Kill dev server (Ctrl+C) and `npm run dev` again
- **Check Network**: DevTools → Network → "Acak Soal" click → see PUT requests
- **Expected**: Status 200, body should only be `{"order": N}`

### If Type Change Doesn't Reset Form
- **Hard Refresh**: Ctrl+F5 (clears browser cache)
- **Check React DevTools**: Verify `questionForm.choices/pairs` actually change
- **Console Errors**: F12 → Console tab - any red errors?

### If Edit Button Doesn't Load Question
- **Network Error**: Check if PUT/GET requests fail (Network tab)
- **Data Issue**: Console.log the loaded question data
- **CORS**: If cross-origin error, check server CORS config

---

## Sign-Off Checklist

When all tests pass:
- [ ] Test Case 1: Randomize works (no error)
- [ ] Test Case 2: Form auto-resets on type change
- [ ] Test Case 3: Edit button loads and saves
- [ ] Test Case 4: Move buttons preserve type
- [ ] Test Case 5: Integration test passes
- [ ] No console errors (F12)
- [ ] No network errors (Network tab)
- [ ] All features work together smoothly

---

## Notes
- **Browser**: Chrome/Firefox recommended (DevTools for debugging)
- **Time**: ~10-15 minutes per full E2E test
- **Data**: Test data persists in MongoDB - you can delete test questions after
