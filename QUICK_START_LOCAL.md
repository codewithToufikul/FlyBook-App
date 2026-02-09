# 🚀 Quick Start - Local Development

## ✅ Changes Applied

Your app is now configured to connect to your local server!

---

## 📝 What Was Changed

### **1. API Configuration** (`src/services/api.ts`)
- ✅ Added `USE_LOCAL_SERVER = true` flag
- ✅ Automatically uses correct URL for iOS/Android
- ✅ Console logs show which server you're connected to

### **2. iOS Configuration** (`ios/FlyBook/Info.plist`)
- ✅ Enabled `NSAllowsArbitraryLoads` for HTTP connections
- ✅ Enabled `NSAllowsLocalNetworking` for localhost

---

## 🎯 Quick Steps to Run

### **Step 1: Start Backend Server** ✅ (Already Running!)

Your server is already running on `http://localhost:3000`

To verify:
```bash
# Should see in terminal:
Server running http://localhost:3000
✅ MongoDB connected successfully.
```

---

### **Step 2: Rebuild iOS App** (IMPORTANT!)

Since we updated `Info.plist`, you need to rebuild:

```bash
cd /Users/toufikulislam/projects/flybook/FlyBook

# Rebuild iOS
npm run ios
```

---

### **Step 3: Test the Connection**

1. **Open the app** (it will rebuild automatically)

2. **Check Metro Bundler console** - You should see:
   ```
   🌐 API Base URL: http://localhost:3000
   ```

3. **Test Registration Flow**:
   - Tap "Create New Account"
   - Enter name → Next
   - Enter email → Send Code
   - You should see success!

4. **Check Backend Terminal** - You should see:
   ```
   OTP sent to user@example.com: 123456 (expires at ...)
   ```

---

## 🔍 Quick Debug

### **If you see "Network Error":**

**1. Verify Server is Running:**
```bash
# In backend terminal, you should see:
Server running http://localhost:3000
```

**2. Check App Console:**
```
# Should show:
🌐 API Base URL: http://localhost:3000
```

**3. Test with cURL (from your Mac):**
```bash
curl -X POST http://localhost:3000/users/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return:
{"success":true,"message":"Verification code sent to your email"}
```

If cURL works but app doesn't → iOS app needs rebuild (Step 2)
If cURL doesn't work → Backend issue (check if server running)

---

## 📱 Device-Specific Setup

### **iOS Simulator** (Current Setup)
✅ Already configured!
- URL: `http://localhost:3000`
- No additional setup needed

### **Android Emulator**
✅ Already configured!
- URL: `http://10.0.2.2:3000` (auto-detected)
- No additional setup needed

### **Physical Device** (iPhone/Android Phone)

**You need your computer's IP address:**

```bash
# On Mac:
ipconfig getifaddr en0

# Example output: 192.168.1.100 (your IP will be different)
```

**Then update `src/services/api.ts`:**

```typescript
// Line ~29: Comment out Platform.select
// const LOCAL_URL = Platform.select({...});

// Add this instead:
const LOCAL_URL = 'http://192.168.1.100:3000'; // Replace with YOUR IP
```

**IMPORTANT**: Phone and computer must be on same Wi-Fi!

---

## 🔄 Switching Between Local and Production

### **Local Development** (Current)

`src/services/api.ts` - Line 13:
```typescript
const USE_LOCAL_SERVER = true; // ← Currently set
```

Console shows:
```
🌐 API Base URL: http://localhost:3000
```

### **Production Testing**

`src/services/api.ts` - Line 13:
```typescript
const USE_LOCAL_SERVER = false;
```

Console shows:
```
🌐 API Base URL: https://fly-book-server-lzu4.onrender.com
```

---

## ✅ Final Checklist

Before testing, ensure:

- [ ] Backend server running (`nodemon` in terminal)
- [ ] See: `Server running http://localhost:3000`
- [ ] See: `✅ MongoDB connected successfully.`
- [ ] iOS app rebuilt after Info.plist changes
- [ ] Metro Bundler console shows: `🌐 API Base URL: http://localhost:3000`

---

## 🎉 You're Ready!

1. **Backend**: ✅ Running on `http://localhost:3000`
2. **iOS Config**: ✅ Allows HTTP connections
3. **App Config**: ✅ Points to local server
4. **OTP Endpoints**: ✅ Implemented and ready

**Just rebuild the iOS app and test!**

```bash
cd /Users/toufikulislam/projects/flybook/FlyBook
npm run ios
```

---

## 📊 Expected Results

### **In App Console:**
```
🌐 API Base URL: http://localhost:3000
```

### **When Sending OTP:**

**Mobile App:**
```
✅ Code sent! Check your email
```

**Backend Terminal:**
```
OTP sent to user@example.com: 123456 (expires at 2026-02-09T21:45:00.000Z)
```

**Gmail:**
```
📧 Email received with 6-digit code
```

---

## 🆘 Troubleshooting

### **Network Error Persists After Rebuild**

**1. Clean iOS Build:**
```bash
cd ios
rm -rf build
pod install
cd ..
npm run ios
```

**2. Reset Metro Bundler:**
```bash
# Kill Metro
# Press Ctrl+C in Metro Bundler terminal

# Clear cache and restart
npm start -- --reset-cache
```

**3. Verify Backend:**
```bash
# Test backend directly
curl http://localhost:3000
```

---

### **"Cannot connect to Metro"**

```bash
# Kill all node processes
killall -9 node

# Restart Metro
npm start

# In new terminal, run iOS
npm run ios
```

---

### **iOS Simulator Not Connecting**

**Option 1: Restart Simulator**
- Simulator → Device → Restart

**Option 2: Reset Simulator**
- Simulator → Device → Erase All Content and Settings

**Option 3: Clean Build**
```bash
cd ios
xcodebuild clean
pod install
cd ..
npm run ios
```

---

## 📝 Summary

**What You Need to Do:**

1. **Rebuild iOS app** (IMPORTANT after Info.plist change):
   ```bash
   npm run ios
   ```

2. **Check console** for:
   ```
   🌐 API Base URL: http://localhost:3000
   ```

3. **Test registration** flow:
   - Create account → Enter name → Enter email → Send Code

4. **Verify backend logs** show:
   ```
   OTP sent to email...
   ```

**That's it!** 🎊

---

## 🎯 Current Status

✅ **Backend**: Running on `localhost:3000`  
✅ **MongoDB**: Connected  
✅ **OTP Endpoints**: Implemented  
✅ **iOS Config**: HTTP allowed  
✅ **App Config**: Points to local server  
🔄 **Next Step**: Rebuild iOS app (`npm run ios`)

**You're all set for local development!** 🚀
