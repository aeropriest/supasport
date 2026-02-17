# Coach Login Debugging Guide

## Issue
Coach login not working - nothing shows up after login.

## Root Causes to Check

### 1. Coach Document Not Created in Firestore
When admin creates a coach, two things should happen:
1. ✅ Firebase Auth user created
2. ❓ Firestore document created in `coaches` collection

**To Verify:**
1. Go to Firebase Console → Firestore Database
2. Look for `coaches` collection
3. Check if there's a document with the coach's UID
4. Document should contain: `name`, `email`, `createdAt`

### 2. Firestore Rules Not Deployed
If rules aren't deployed, the coach document can't be read.

**To Fix:**
```bash
cd /Users/ashokjaiswal/Development/Consulting/supasport
firebase deploy --only firestore:rules
```

### 3. Browser Console Errors
Check browser console for errors when logging in as coach.

## Testing Steps

### Step 1: Create a Test Coach
1. Login as admin (`admin@supasport.com`)
2. Go to Coaches page
3. Add a coach:
   - Name: "Test Coach"
   - Email: "coach@test.com"
   - Password: "test123"
4. Check browser console for any errors

### Step 2: Verify in Firebase Console
1. Go to Firebase Console → Authentication
2. Verify user exists with email "coach@test.com"
3. Copy the UID
4. Go to Firestore Database
5. Check `coaches` collection for document with that UID
6. If missing, there's a problem with coach creation

### Step 3: Test Coach Login
1. Sign out
2. Login with:
   - Email: "coach@test.com"
   - Password: "test123"
3. Open browser console (F12)
4. Look for these console logs:
   - "Coach doc exists: true, for UID: [uid]"
   - "Loading coach data for UID: [uid]"
   - "Loaded: { lessons: X, clients: X, packages: X, coach: 'Test Coach' }"

### Step 4: Check What You See
After coach login, you should see:
- ✅ Header with "⚽ SupaSport" and coach email
- ✅ "My Calendar" heading
- ✅ Calendar with current month
- ✅ Day selection panel on the right
- ✅ "This Month" stats at bottom right

If you see a loading spinner forever:
- Check console for errors
- Verify Firestore rules are deployed
- Check if coach document exists

If you get redirected to login:
- Coach document doesn't exist in Firestore
- Role detection is failing

## Common Issues & Solutions

### Issue: "Coach doc exists: false"
**Problem:** Coach document not created in Firestore
**Solution:** 
1. Check if Firestore rules allow admin to write to coaches collection
2. Verify `addCoach` function is completing successfully
3. Check browser console when creating coach for errors

### Issue: Permission Denied Errors
**Problem:** Firestore rules not deployed or incorrect
**Solution:**
```bash
firebase deploy --only firestore:rules
```

### Issue: Infinite Loading Spinner
**Problem:** Data loading fails silently
**Solution:**
1. Check browser console for errors
2. Verify coach has permission to read clients, packages, lessons
3. Check Firestore rules allow coaches to read these collections

### Issue: Redirected to Login After Coach Login
**Problem:** Role detection failing
**Solution:**
1. Verify coach document exists in Firestore with correct UID
2. Check console logs for "Coach doc exists: false"
3. Ensure Firestore rules allow reading coach document

## Manual Fix: Create Coach Document

If coach user exists in Auth but not in Firestore:

1. Go to Firebase Console → Firestore
2. Create collection: `coaches`
3. Add document with ID = coach's UID (from Authentication)
4. Add fields:
   - `name` (string): "Coach Name"
   - `email` (string): "coach@test.com"
   - `createdAt` (string): current ISO date

## Debugging Console Logs

When you login as coach, you should see:
```
Coach doc exists: true, for UID: abc123xyz
Loading coach data for UID: abc123xyz
Loaded: { lessons: 0, clients: 3, packages: 2, coach: 'Test Coach' }
```

If you see:
```
Coach doc exists: false, for UID: abc123xyz
No coach document found for user: coach@test.com
```

Then the coach document is missing from Firestore.

## Expected Coach Dashboard Features

Once working, coaches should be able to:
1. ✅ View calendar with their lessons
2. ✅ Click any day to see lessons for that day
3. ✅ Click "Add" button to add a lesson for selected day
4. ✅ Select client(s) from list
5. ✅ Choose lesson type
6. ✅ Optionally link to a package
7. ✅ Set time, hours, notes
8. ✅ Mark lesson as scheduled or completed
9. ✅ Mark scheduled lessons as completed using checkmark icon
10. ✅ See monthly stats (total lessons, completed, hours)

## Next Steps

1. Follow testing steps above
2. Check browser console logs
3. Verify coach document exists in Firestore
4. Deploy Firestore rules if not already done
5. Report back what you see in console logs
