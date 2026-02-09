# 🚀 Quick Setup Guide - Authentication

## Step 1: iOS Permissions (If building for iOS)

Add location permissions to `ios/FlyBook/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>FlyBook needs your location to show nearby books and services</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>FlyBook needs your location to provide personalized nearby content</string>
```

## Step 2: Run the App

```bash
cd /Users/toufikulislam/projects/flybook/FlyBook

# For iOS
npm run ios

# For Android
npm run android
```

## Step 3: Test Login

### Option A: Use Existing Account

If you have an account on the web app:
1. Open app
2. Enter your phone number (11 digits, starts with 01)
3. Enter your password
4. Tap "Login"

### Option B: Create New Account

1. Open app
2. Tap "Sign Up"
3. Allow location permission
4. Fill in details:
   - Full Name
   - Email
   - Phone (01XXXXXXXXX)
   - Password (min 6 chars)
   - Confirm Password
5. Tap "Create Account"
6. Login with new credentials

## Step 4: Test Features

### ✅ Login
- [x] Enter phone and password
- [x] See loading animation
- [x] Redirected to home on success

### ✅ Navigation
- [x] Open drawer menu (swipe from left or tap menu icon)
- [x] See your name, email, and coins
- [x] Navigate to different sections

### ✅ Logout
- [x] Tap "Logout" in drawer
- [x] Confirm in dialog
- [x] Redirected to login

## Common Issues

### "Location Required" Error
- Grant location permission in device settings
- Restart app and try again

### "Invalid phone number"
- Must be 11 digits
- Must start with "01"
- Example: 01712345678

### Network Error
- Check internet connection
- Verify backend is accessible: https://fly-book-server-lzu4.onrender.com

## Backend Connection

Your app is connected to:
```
https://fly-book-server-lzu4.onrender.com
```

This is configured in: `src/services/api.ts`

## What's Next?

1. **Test all auth flows** (login, register, logout)
2. **Check drawer menu** shows your user data
3. **Test API calls** work with authentication
4. **Add more screens** that use the auth state

## Architecture

```
App.tsx
  └── AuthProvider (Global auth state)
       └── NavigationContainer
            └── RootNavigator
                 ├── If authenticated → Main App (Drawer)
                 └── If not authenticated → Auth Stack (Login/Register)
```

## Key Files

- `src/contexts/AuthContext.tsx` - Auth state management
- `src/services/api.ts` - API client with JWT
- `src/services/authServices.ts` - Auth API calls
- `src/screens/AuthScreens/Login.tsx` - Login UI
- `src/screens/AuthScreens/Register.tsx` - Register UI
- `src/navigations/RootNavigator.tsx` - Auth-aware routing

---

**That's it! Your authentication is ready to go! 🎉**
