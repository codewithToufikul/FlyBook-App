# Authentication Error Fix - Session Expired Issue

## সমস্যা (Problem)

যখন Opinion post create করতে যাচ্ছেন, তখন এই error আসছে:

```
Error: Session expired. Please login again.
Status: 401
Data: {error: 'Access denied. No token provided.'}
```

## কারণ (Root Cause)

এই error এর মানে হল আপনার authentication token হয়:

1. **AsyncStorage এ নেই** (login করার সময় save হয়নি)
2. **Expired হয়ে গেছে** (server থেকে reject হচ্ছে)
3. **Request header এ যুক্ত হচ্ছে না** (interceptor issue)

## সমাধান (Solution)

### Step 1: Debug Logs Check করুন

আমি debugging code যোগ করেছি। এখন যখন আপনি post create করতে যাবেন, console এ এই logs দেখবেন:

```
📝 Creating post - Debug info:
  - User exists: true/false
  - User ID: ...
  - User name: ...

🔍 ===== AUTH STATE DEBUG =====
Token exists: true/false
Token preview: ...
User data exists: true/false
...
===== END DEBUG =====

🔑 Request Interceptor Debug:
  - URL: /opinion/post
  - Token exists: true/false
  - Token preview: ...
  - Authorization header set: Bearer ...
```

### Step 2: সমস্যা নির্ণয় (Diagnosis)

#### যদি "Token exists: false" দেখেন:

**সমস্যা:** Token save হয়নি
**সমাধান:** আপনাকে **re-login** করতে হবে

#### যদি "Token exists: true" কিন্তু এখনও 401 error:

**সমস্যা:** Token expired বা invalid
**সমাধান:** আপনাকে **re-login** করতে হবে

#### যদি "No token found or headers unavailable" দেখেন:

**সমস্যা:** Request interceptor এ সমস্যা
**সমাধান:** App restart করুন এবং re-login করুন

### Step 3: Re-Login Process

1. **App থেকে Logout করুন:**

   - Profile page এ যান
   - Logout button এ click করুন

2. **App Restart করুন:**

   - App close করুন (background থেকেও)
   - App আবার open করুন

3. **Login করুন:**

   - আপনার credentials দিয়ে login করুন
   - Login successful হলে token automatically save হবে

4. **Test করুন:**
   - Opinion create করার চেষ্টা করুন
   - Console logs check করুন

### Step 4: যদি এখনও কাজ না করে

#### Backend Server Check করুন:

```bash
# Terminal এ run করুন
curl http://localhost:3000/profile -H "Authorization: Bearer YOUR_TOKEN"
```

যদি backend response না দেয়, তাহলে:

1. Backend server running আছে কিনা check করুন
2. Backend এর `/opinion/post` endpoint working আছে কিনা verify করুন
3. Backend এর authentication middleware check করুন

## Code Changes Made

### 1. `/src/services/api.ts`

- Request interceptor এ detailed logging যোগ করা হয়েছে
- Token retrieval এবং header attachment track করা যাবে

### 2. `/src/screens/OpinionScreens/CreateOpinion.tsx`

- Post creation এর আগে authentication state check করা হচ্ছে
- Token existence verify করা হচ্ছে
- Comprehensive debugging logs যোগ করা হয়েছে

### 3. `/src/utils/authDebug.ts` (NEW)

- Authentication state debug করার utility
- AsyncStorage এর সব keys check করা যায়
- Token এবং user data inspect করা যায়

## Testing Steps

1. **App চালু করুন:**

   ```bash
   npx react-native start --reset-cache
   ```

2. **Login করুন** (যদি logged out থাকেন)

3. **Console খুলুন** (Metro bundler terminal বা React Native Debugger)

4. **Opinion create করার চেষ্টা করুন**

5. **Console logs পড়ুন:**

   - Token exists কিনা দেখুন
   - Authorization header set হচ্ছে কিনা দেখুন
   - কোন error message আছে কিনা দেখুন

6. **Logs এর screenshot নিন** এবং আমাকে পাঠান যদি এখনও সমস্যা থাকে

## Expected Console Output (Success Case)

```
📝 Creating post - Debug info:
  - User exists: true
  - User ID: 507f1f77bcf86cd799439011
  - User name: John Doe

🔍 ===== AUTH STATE DEBUG =====
Token exists: true
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6...
Token length: 256
User data exists: true
User ID: 507f1f77bcf86cd799439011
User name: John Doe
User email: john@example.com
All AsyncStorage keys: ['@flybook_token', '@flybook_user']
===== END DEBUG =====

🔑 Request Interceptor Debug:
  - URL: /opinion/post
  - Token exists: true
  - Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6...
  - Authorization header set: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...

  - Post data prepared: {
      userId: '507f1f77bcf86cd799439011',
      userName: 'John Doe',
      hasImage: false,
      hasPdf: false,
      privacy: 'public'
    }
```

## Next Steps

1. **এখনই test করুন** - App এ post create করার চেষ্টা করুন
2. **Console logs দেখুন** - কি output আসছে
3. **Screenshot পাঠান** - যদি এখনও error থাকে

## Additional Debug Commands

যদি manually debug করতে চান:

```typescript
// React Native Debugger console এ run করুন:
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check token
AsyncStorage.getItem('@flybook_token').then(console.log);

// Check user
AsyncStorage.getItem('@flybook_user').then(console.log);

// Check all keys
AsyncStorage.getAllKeys().then(console.log);
```

---

**মনে রাখবেন:** এই debugging code শুধুমাত্র সমস্যা খুঁজে বের করার জন্য। সমস্যা solve হলে এই logs remove করা যাবে।
