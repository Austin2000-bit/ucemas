# OTP Confirmation System Testing Guide

## Prerequisites
1. **Run Database Migrations** in Supabase Dashboard:
   ```sql
   -- Add description column to sessions table
   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;
   
   -- Add session_id column to student_help_confirmations table  
   ALTER TABLE student_help_confirmations ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);
   ```

2. **Ensure Helper-Student Assignment**: Make sure you have a helper assigned to a student in the `helper_student_assignments` table.

## Step-by-Step Testing

### Phase 1: Helper OTP Generation

1. **Login as Helper**
   - Navigate to `http://localhost:8083/helper`
   - Login with helper credentials

2. **Generate OTP**
   - Select an assigned student from the dropdown
   - Enter a description of help provided
   - Click "Sign & Generate OTP"
   - **Check Console**: Look for debug logs starting with "=== HELPER OTP GENERATION DEBUG ==="

3. **Verify OTP Creation**
   - OTP should appear in the UI
   - Check browser console for successful session creation
   - **Expected Console Output**:
     ```
     === HELPER OTP GENERATION DEBUG ===
     Helper ID: [helper-uuid]
     Selected Student: [student-uuid]
     Description: [description]
     Generated OTP: [6-digit-otp]
     Session created successfully: [session-data]
     === END HELPER OTP GENERATION DEBUG ===
     ```

### Phase 2: Student OTP Reception

1. **Login as Student**
   - Navigate to `http://localhost:8083/student`
   - Login with the student credentials that were assigned to the helper

2. **Monitor OTP Polling**
   - **Check Console**: Look for debug logs starting with "=== OTP POLLING DEBUG ==="
   - **Expected Console Output** (every 10 seconds):
     ```
     === OTP POLLING DEBUG ===
     Student ID: [student-uuid]
     Today confirmed: false
     Polling for new OTP...
     Polled OTP result: [otp-data or null]
     === END OTP POLLING DEBUG ===
     ```

3. **Verify OTP Reception**
   - When OTP is found, you should see:
     ```
     New OTP detected: [otp-data]
     ```
   - OTP should be automatically filled in the input field
   - Toast notification should appear: "New OTP Received"

### Phase 3: Student OTP Confirmation

1. **Confirm OTP**
   - The OTP should be pre-filled in the 6-digit input field
   - Click "Confirm Help" button
   - **Check Console**: Look for verification process logs

2. **Verify Confirmation**
   - Should see "Help confirmed" message
   - Recent confirmations list should update
   - "Help confirmed for today" should appear

### Phase 4: Verification Checks

1. **Check Database State**
   - Run the debug script in Supabase SQL Editor
   - Verify session status changed from 'pending_confirmation' to 'confirmed'
   - Verify confirmation record was created with status 'confirmed'

2. **Test Edge Cases**
   - Try entering wrong OTP (should fail)
   - Try confirming without OTP (should fail)
   - Wait for OTP expiry (5 minutes) and try to confirm

## Debugging Checklist

### If Student Doesn't Receive OTP:
- [ ] Check if helper-student assignment exists and is active
- [ ] Verify session was created in database
- [ ] Check if session status is 'pending_confirmation'
- [ ] Verify OTP hasn't expired
- [ ] Check browser console for polling logs

### If "Help Confirmed" Shows Without OTP:
- [ ] Check if there's an existing confirmation record for today
- [ ] Verify confirmation status is 'confirmed' not 'pending'
- [ ] Check if confirmation was created after OTP verification

### If OTP Verification Fails:
- [ ] Check if OTP matches the one in database
- [ ] Verify OTP hasn't expired
- [ ] Check if session exists and is in correct state

## Database Queries for Debugging

Run these queries in Supabase SQL Editor to check system state:

```sql
-- Check recent sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;

-- Check recent confirmations
SELECT * FROM student_help_confirmations ORDER BY created_at DESC LIMIT 5;

-- Check today's confirmations
SELECT * FROM student_help_confirmations WHERE date = CURRENT_DATE;

-- Check pending sessions for a specific student
SELECT * FROM sessions 
WHERE student_id = '[STUDENT-UUID]' 
AND status = 'pending_confirmation'
ORDER BY created_at DESC;
```

## Common Issues and Solutions

1. **Missing Database Columns**: Run the migration SQL commands
2. **No Helper Assignment**: Create assignment in admin panel
3. **OTP Expired**: Generate new OTP (expires after 5 minutes)
4. **WebSocket Errors**: Check network connection and Supabase configuration
5. **RLS Policy Issues**: Verify user permissions and policies

## Expected Flow Summary

1. **Helper** → Generates OTP → Creates session with status 'pending_confirmation'
2. **Student** → Polls for OTP → Finds session → Receives OTP automatically
3. **Student** → Enters/confirms OTP → verifyOTP validates → Creates confirmation
4. **System** → Shows "Help confirmed for today" → Updates recent confirmations 