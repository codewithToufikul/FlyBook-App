# 🔧 Local Server Connection Setup

## Quick Guide to Connect Mobile App to Local Server

---

## ✅ Current Configuration

Your app is now configured to automatically connect to the correct local server based on your device:

- **iOS Simulator**: `http://localhost:3000` ✅
- **Android Emulator**: `http://10.0.2.2:3000` ✅
- **Physical Device**: You need to set your computer's IP manually

---

## 🚀 How to Use

### **1. Start Your Local Server**

```bash
cd /Users/toufikulislam/projects/flybook/fly-book-server
nodemon
```

You should see:
```
Server running http://localhost:3000
✅ MongoDB connected successfully.
```

---

### **2. Configure the Mobile App**

Open `FlyBook/src/services/api.ts`:

```typescript
// Line 13: Choose local or production
const USE_LOCAL_SERVER = true;  // ← Set to true for local development
                                 // ← Set to false for production
```

---

### **3. For Different Devices**

#### **A. iOS Simulator** (Default - Already Configured)
```typescript
// No changes needed! Already set to:
const LOCAL_URL = 'http://localhost:3000';
```

#### **B. Android Emulator** (Default - Already Configured)
```typescript
// No changes needed! Automatically uses:
const LOCAL_URL = 'http://10.0.2.2:3000';
```

#### **C. Physical Device (iPhone/Android Phone)**

You need to find your computer's IP address:

**On Mac:**
```bash
# Terminal command:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or:
# System Settings → Network → Wi-Fi → Details → IP Address
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address"
```

**Example IP**: `192.168.1.100` (yours will be different)

Then update `api.ts`:
```typescript
// Comment out the Platform.select and use your IP:
// const LOCAL_URL = Platform.select({...});

// Use this instead:
const LOCAL_URL = 'http://192.168.1.100:3000'; // Replace with YOUR IP
```

**IMPORTANT**: Your phone and computer must be on the **same Wi-Fi network**!

---

## 🧪 Testing the Connection

### **Method 1: Check App Console**

When you run the app, you should see in the console:
```
🌐 API Base URL: http://localhost:3000
```

### **Method 2: Test API Endpoint**

From your computer's terminal:
```bash
# Test if server is responding
curl http://localhost:3000

# Test OTP endpoint
curl -X POST http://localhost:3000/users/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### **Method 3: From Mobile App**

1. Open the app
2. Tap "Create New Account"
3. Enter name → Next
4. Enter email → Send Code
5. Check terminal logs for the request

---

## 🐛 Troubleshooting

### **Problem 1: "Network Error" on iOS Simulator**

**Cause**: iOS App Transport Security blocking HTTP

**Solution**: Update `ios/FlyBook/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

Then rebuild:
```bash
cd ios
pod install
cd ..
npm run ios
```

---

### **Problem 2: "Network Error" on Android Emulator**

**Cause**: Using `localhost` instead of `10.0.2.2`

**Solution**: Already fixed! The app automatically uses `10.0.2.2` for Android.

Verify in logs:
```
🌐 API Base URL: http://10.0.2.2:3000
```

---

### **Problem 3: "Network Error" on Physical Device**

**Possible Causes**:
1. Phone and computer not on same Wi-Fi
2. Wrong IP address
3. Firewall blocking connections

**Solutions**:

**A. Verify Same Network:**
- Check phone Wi-Fi settings
- Check computer Wi-Fi settings
- Must be same network name

**B. Find Correct IP:**
```bash
# Mac
ipconfig getifaddr en0

# Or check in:
# System Settings → Network → Wi-Fi
```

**C. Allow Firewall (Mac):**
```bash
# System Settings → Network → Firewall
# Make sure Node.js is allowed
```

**D. Test Connection:**
```bash
# On your phone's browser, try to access:
http://YOUR_IP:3000

# Example:
http://192.168.1.100:3000

# You should see server response
```

---

### **Problem 4: Server Not Responding**

**Check if server is running:**
```bash
# Should show: Server running http://localhost:3000
lsof -i :3000
```

**If port is in use:**
```bash
# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Then restart
nodemon
```

---

### **Problem 5: CORS Error**

Already fixed! Your server allows all origins.

But if you see CORS errors, verify in `fly-book-server/index.js`:
```javascript
// Line 61 should be:
callback(null, true); // Allow all origins
```

---

## 📝 Quick Checklist

**Before Testing:**

- [ ] Local server is running (`nodemon` in terminal)
- [ ] MongoDB connected (see `✅ MongoDB connected successfully.`)
- [ ] `USE_LOCAL_SERVER = true` in `api.ts`
- [ ] Console shows: `🌐 API Base URL: http://localhost:3000` (or `10.0.2.2`)

**For iOS Simulator:**
- [ ] Using `http://localhost:3000`
- [ ] Info.plist has `NSAllowsLocalNetworking` = true

**For Android Emulator:**
- [ ] Using `http://10.0.2.2:3000`
- [ ] Console confirms correct URL

**For Physical Device:**
- [ ] Found computer's local IP address
- [ ] Updated `LOCAL_URL` with your IP
- [ ] Phone and computer on same Wi-Fi
- [ ] Tested IP in phone's browser first

---

## 🔄 Switching Between Local and Production

### **For Local Development:**

```typescript
// In api.ts
const USE_LOCAL_SERVER = true;
```

**Console Output:**
```
🌐 API Base URL: http://localhost:3000
```

### **For Production/Testing Live Server:**

```typescript
// In api.ts
const USE_LOCAL_SERVER = false;
```

**Console Output:**
```
🌐 API Base URL: https://fly-book-server-lzu4.onrender.com
```

---

## 🎯 Current Setup Summary

**File**: `FlyBook/src/services/api.ts`

**Lines 13-36**:
```typescript
// Toggle this:
const USE_LOCAL_SERVER = true; // true = local, false = production

const PRODUCTION_URL = 'https://fly-book-server-lzu4.onrender.com';

const LOCAL_URL = Platform.select({
  ios: 'http://localhost:3000',      // iOS Simulator ✅
  android: 'http://10.0.2.2:3000',   // Android Emulator ✅
  default: 'http://localhost:3000',
});

// For physical device, replace LOCAL_URL with:
// const LOCAL_URL = 'http://YOUR_COMPUTER_IP:3000';

const BASE_URL = USE_LOCAL_SERVER ? LOCAL_URL : PRODUCTION_URL;

console.log('🌐 API Base URL:', BASE_URL);
```

---

## 📊 Backend Status

**Server Status**: ✅ Running on `http://localhost:3000`

**Database**: ✅ MongoDB Connected

**New Endpoints Available**:
- `POST /users/send-otp` ✅
- `POST /users/verify-otp` ✅
- `POST /users/register` (enhanced with token) ✅

---

## ✅ You're Ready!

1. Make sure `USE_LOCAL_SERVER = true` in `api.ts`
2. Server is running (you already have it running!)
3. Rebuild your app if you made changes to `Info.plist`
4. Test the registration flow

**Check the console** - you should see:
```
🌐 API Base URL: http://localhost:3000
```

Or for Android:
```
🌐 API Base URL: http://10.0.2.2:3000
```

---

## 🎉 Success Indicators

**In Metro Bundler Console:**
```
🌐 API Base URL: http://localhost:3000
```

**In Backend Terminal:**
```
Server running http://localhost:3000
✅ MongoDB connected successfully.
```

**When Testing Send OTP:**
```
Backend Terminal:
OTP sent to user@example.com: 123456 (expires at ...)
```

**Everything working!** 🚀

---

## 🆘 Still Having Issues?

1. **Restart everything:**
   ```bash
   # Kill backend
   Ctrl+C in server terminal
   
   # Kill React Native
   # Close Metro Bundler
   
   # Restart backend
   cd fly-book-server
   nodemon
   
   # Restart React Native
   cd FlyBook
   npm run ios  # or npm run android
   ```

2. **Check firewall settings** (Mac):
   - System Settings → Network → Firewall
   - Allow incoming connections for Node

3. **Verify IP address** (for physical device):
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **Test with cURL first**:
   ```bash
   curl http://localhost:3000/users/send-otp \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

If cURL works but mobile app doesn't, the issue is in the mobile app configuration.

If cURL doesn't work, the issue is in the backend.

---

**Your setup is now ready for local development!** 🎊
