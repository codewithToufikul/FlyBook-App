# 🧪 Testing Guide - Multi-Step Registration

Quick guide to test the new registration flow.

---

## 🚀 Start Testing

```bash
cd /Users/toufikulislam/projects/flybook/FlyBook
npm run ios
# or
npm run android
```

---

## ✅ Test Checklist

### **Step 1: Name Screen**

**How to reach:** Tap "Create New Account" on Login

**Test Cases:**
- [ ] Back button takes you to Login
- [ ] Can't tap Next without first name
- [ ] Can't tap Next without last name
- [ ] Next button is gray when disabled
- [ ] Next button is blue when enabled
- [ ] Progress shows: ●○○○○ (first dot active)
- [ ] Tapping Next goes to Email screen

**Expected UI:**
- Title: "What's your name?"
- Subtitle: "Enter the name you use in real life"
- Two input fields
- Blue "Next" button at bottom

---

### **Step 2: Email Screen**

**How to reach:** Complete Step 1

**Test Cases:**
- [ ] Back button goes to Name screen
- [ ] Can't proceed with empty email
- [ ] Can't proceed with invalid email (test: "notanemail")
- [ ] Valid email enables button
- [ ] Progress shows: ●●○○○ (two dots active)
- [ ] Tapping "Send Code" shows loading
- [ ] Success: Goes to Verification screen
- [ ] Error: Shows alert with message

**Expected UI:**
- Title: "What's your email?"
- Subtitle about verification code
- Email input field
- "💡 Make sure you have access to this email" hint
- Blue "Send Code" button at bottom

**Backend Call:**
```
POST /users/send-otp
Body: { email: "test@example.com" }
```

---

### **Step 3: Email Verification**

**How to reach:** Complete Step 2

**Test Cases:**
- [ ] Back button goes to Email screen
- [ ] Shows the email you entered
- [ ] 6 input boxes for OTP
- [ ] First box is auto-focused
- [ ] Typing a digit moves to next box
- [ ] Backspace on empty box moves to previous
- [ ] Can paste 6 digits at once
- [ ] "Resend code" link works
- [ ] Progress shows: ●●●○○ (three dots active)
- [ ] Verify button disabled until 6 digits entered
- [ ] Correct OTP: Goes to Phone screen
- [ ] Wrong OTP: Shows error and clears boxes

**Expected UI:**
- Title: "Enter verification code"
- Shows email in blue
- 6 large boxes for digits
- "Didn't receive code? Resend" link
- Blue "Verify" button at bottom

**Backend Call:**
```
POST /users/verify-otp
Body: { email: "test@example.com", otp: "123456" }
```

---

### **Step 4: Phone Number (Optional)**

**How to reach:** Complete Step 3

**Test Cases:**
- [ ] Back button goes to Verification screen
- [ ] "Skip" button visible in top-right
- [ ] Tapping Skip goes to Password screen
- [ ] Progress shows: ●●●●○ (four dots active)
- [ ] Country code shows: 🇧🇩 +880
- [ ] Can enter 11 digits
- [ ] Invalid phone (10 digits) shows error
- [ ] Invalid phone (starting with 02) shows error
- [ ] Valid phone (01XXXXXXXXX) enables Next
- [ ] Next button goes to Password screen
- [ ] "Skip for Now" button works without phone
- [ ] Info box explains it's optional

**Expected UI:**
- Title: "Add your phone number"
- Subtitle: "Optional"
- Country code + phone input
- Info box with blue background
- Skip button in header
- Skip or Next button at bottom

---

### **Step 5: Password Creation**

**How to reach:** Complete Step 4 (or Skip)

**Test Cases:**
- [ ] Back button goes to Phone screen
- [ ] Progress shows: ●●●●● (all dots active)
- [ ] Password and Confirm Password fields
- [ ] Eye icons toggle show/hide
- [ ] Requirements box shows two items
- [ ] Typing 5 chars: ❌ "At least 6 characters"
- [ ] Typing 6 chars: ✓ "At least 6 characters"
- [ ] Passwords don't match: ❌ "Passwords match"
- [ ] Passwords match: ✓ "Passwords match"
- [ ] Button disabled until both requirements met
- [ ] Button is green when enabled
- [ ] Tapping Create Account shows loading
- [ ] Success: Shows alert "Account created!"
- [ ] After alert: **Auto-navigates to Home screen**
- [ ] User is logged in
- [ ] Drawer shows user info

**Expected UI:**
- Title: "Create a password"
- Subtitle: "At least 6 characters"
- Two password fields with eye icons
- Requirements box with checkmarks
- Green "Create Account" button at bottom

**Backend Call:**
```
POST /users/register
Body: {
  name: "First Last",
  email: "test@example.com",
  number: "01712345678" or "",
  password: "test123",
  userLocation: { latitude: 23.8103, longitude: 90.4125 },
  referrerUsername: ""
}
```

---

## 🎯 Full Flow Test (Happy Path)

**Start:** Login screen  
**Goal:** Successfully register and reach Home

1. ✅ Tap "Create New Account"
2. ✅ Enter: First Name = "John", Last Name = "Doe"
3. ✅ Tap "Next"
4. ✅ Enter: Email = "john.doe@example.com"
5. ✅ Tap "Send Code"
6. ✅ Check email for OTP code
7. ✅ Enter 6-digit code
8. ✅ Tap "Verify"
9. ✅ Option A: Enter phone → Tap "Next"  
   Option B: Tap "Skip" or "Skip for Now"
10. ✅ Enter: Password = "john123"
11. ✅ Confirm: Password = "john123"
12. ✅ See both checkmarks turn green
13. ✅ Tap "Create Account"
14. ✅ See loading spinner
15. ✅ See success alert
16. ✅ Tap "OK" on alert
17. ✅ **Automatically at Home screen**
18. ✅ Open drawer - see user name & email

**Expected Result:**
- Account created in database
- User is logged in
- Token saved
- At Home screen
- Can use app normally

---

## 🐛 Error Cases to Test

### **Email Already Exists**
**Step:** 2 (Email)  
**Action:** Enter existing email  
**Expected:** Error alert from backend

### **Wrong OTP**
**Step:** 3 (Verify)  
**Action:** Enter wrong 6-digit code  
**Expected:** Error alert, boxes clear, refocus first box

### **Network Error**
**Steps:** 2, 3, 5 (any backend call)  
**Action:** Turn off internet  
**Expected:** User-friendly error message

### **OTP Expired**
**Step:** 3 (Verify)  
**Action:** Wait too long, then verify  
**Expected:** Error, option to resend

---

## 📱 UI/UX Tests

### **Visual Tests**
- [ ] Progress dots animate smoothly
- [ ] Buttons have proper shadows
- [ ] Colors match design (Blue #3B82F6, Green #10B981)
- [ ] Text is readable
- [ ] Inputs have proper padding
- [ ] Back buttons are circular with gray background
- [ ] Skip button is visible and tappable

### **Interaction Tests**
- [ ] Keyboard appears on auto-focus
- [ ] Tapping outside dismisses keyboard
- [ ] Loading spinners animate
- [ ] Disabled buttons look disabled (gray)
- [ ] Error alerts have proper styling
- [ ] Success alerts show before navigation

### **Navigation Tests**
- [ ] Can't accidentally swipe back during registration
- [ ] Back button always works
- [ ] Can exit at Step 1 (goes to Login)
- [ ] Skip works on Step 4
- [ ] No back button issues

---

## 🔍 Edge Cases

### **Very Long Names**
**Test:** Enter 50 character first name  
**Expected:** Handles gracefully

### **Special Characters in Email**
**Test:** test+alias@example.com  
**Expected:** Accepts valid emails

### **Paste in OTP**
**Test:** Copy "123456" and paste in first box  
**Expected:** Fills all 6 boxes

### **Quick Backspace in OTP**
**Test:** Type 6 digits, backspace rapidly  
**Expected:** Smooth navigation backwards

### **Skip then Back**
**Test:** Skip phone, then go back  
**Expected:** Returns to phone screen with Skip still visible

---

## ✅ Success Criteria

All tests pass if:
- ✅ Can complete full registration in ~2 minutes
- ✅ All validations work correctly
- ✅ All error cases handled gracefully
- ✅ Auto-login happens after registration
- ✅ Redirect to Home works
- ✅ User can use app after registration
- ✅ No crashes or freezes
- ✅ UI looks professional
- ✅ Navigation is smooth
- ✅ Loading states show appropriately

---

## 📝 Report Issues

If you find bugs, note:
1. Which step?
2. What did you do?
3. What happened?
4. What should have happened?
5. Screenshot if possible

---

## 🎉 Expected Behavior

**On completion, you should see:**

1. Success alert: "Your account has been created successfully!"
2. Tap OK on alert
3. **Automatically navigate to Home screen**
4. Open drawer menu
5. See your name: "John Doe"
6. See your email: "john.doe@example.com"
7. See coin balance (default: 0 or initial amount)
8. Can navigate to different screens
9. Can logout
10. Can login again with same credentials

**That's it! Registration flow complete! 🎊**

---

**Quick Run:**
```bash
npm run ios && open app → tap "Create New Account" → complete 5 steps → see Home!
```
