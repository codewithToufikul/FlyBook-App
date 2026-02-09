# 🔐 FlyBook Authentication System

Complete authentication implementation with login, registration, and session management.

---

## ✨ What Was Implemented

### 📦 Components Created

1. **AuthContext & Provider** - Global authentication state management
2. **Login Screen** - Phone number + password login
3. **Register Screen** - Full registration with location
4. **Splash Screen** - Initial auth checking screen
5. **Updated Navigation** - Auth-aware routing

### 📄 Files Created/Modified

```
FlyBook/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          ✨ Auth state management
│   ├── hooks/
│   │   └── useAuth.ts                🎣 Auth hook export
│   ├── screens/
│   │   └── AuthScreens/
│   │       ├── Login.tsx             🔑 Login screen
│   │       ├── Register.tsx          📝 Registration screen
│   │       └── SplashScreen.tsx      ⏳ Loading screen
│   ├── navigations/
│   │   ├── RootNavigator.tsx         ✏️ Updated with auth
│   │   └── stacks/
│   │       └── AuthStack.tsx         📚 Auth navigation
│   └── components/
│       └── CustomDrawer.tsx          ✏️ Added logout
├── App.tsx                            ✏️ Wrapped with AuthProvider
└── AUTHENTICATION_README.md           📖 This file
```

### 📦 Packages Installed

```bash
@react-native-community/geolocation  # Location services
@expo/vector-icons                    # Icons
```

---

## 🚀 Features

### ✅ Login

- Phone number (11 digits, starts with 01) validation
- Password masking with show/hide toggle
- Remember me option
- Forgot password link (coming soon)
- Loading states with beautiful loader
- Error handling with user-friendly messages

### ✅ Registration

- Full name validation
- Email validation
- Phone number validation (Bangladesh format)
- Password strength requirement (min 6 characters)
- Confirm password matching
- Optional referrer username
- **Location-based registration** (required for nearby features)
- Real-time validation feedback

### ✅ Authentication Flow

- Automatic token storage in AsyncStorage
- JWT-based authentication
- Auto-redirect based on auth status
- Session persistence across app restarts
- Splash screen during auth check
- Protected routes

### ✅ Logout

- Confirmation dialog
- Clean token/data removal
- Loading state
- Auto-redirect to login

---

## 🔧 Configuration

### Backend Integration

Backend URL is configured in `src/services/api.ts`:

```typescript
const BASE_URL = 'https://fly-book-server-lzu4.onrender.com';
```

### API Endpoints Used

- **POST** `/users/login` - User login
  ```json
  {
    "number": "01XXXXXXXXX",
    "password": "password"
  }
  ```

- **POST** `/users/register` - User registration
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "number": "01XXXXXXXXX",
    "password": "password",
    "userLocation": {
      "latitude": 23.8103,
      "longitude": 90.4125
    },
    "referrerUsername": "optional"
  }
  ```

### iOS Permissions (Required)

Add to `ios/FlyBook/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>FlyBook needs your location to show nearby books and services</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>FlyBook needs your location to provide personalized nearby content</string>
```

### Android Permissions (Already in AndroidManifest)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## 📱 Usage

### Login Flow

```tsx
// User opens app
// ↓
// SplashScreen (checking auth)
// ↓
// If not authenticated → Login Screen
// ↓
// User enters phone + password
// ↓
// Validates input
// ↓
// Calls /users/login API
// ↓
// Saves token + user data
// ↓
// Auto-redirects to Main App
```

### Register Flow

```tsx
// User taps "Sign Up"
// ↓
// Register Screen
// ↓
// Requests location permission
// ↓
// User fills form
// ↓
// Validates all inputs
// ↓
// Calls /users/register API
// ↓
// Success → Navigate to Login
// ↓
// User logs in
```

### Using Auth in Components

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }

  return (
    <View>
      <Text>Welcome {user?.name}!</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Coins: {user?.coins}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

### Protecting Routes

Routes are automatically protected by `RootNavigator`:

```tsx
// In RootNavigator.tsx
const { isAuthenticated, isLoading } = useAuth();

if (isLoading) {
  return <SplashScreen />; // Shows splash
}

return (
  <Stack.Navigator>
    {isAuthenticated ? (
      <Stack.Screen name="Main" component={DrawerNavigator} />
    ) : (
      <Stack.Screen name="Auth" component={AuthStack} />
    )}
  </Stack.Navigator>
);
```

---

## 🎨 UI Features

### Login Screen

- Clean, modern design
- FlyBook logo at top
- Icon-prefixed input fields
- Password visibility toggle
- Remember me checkbox
- Responsive keyboard handling
- Smooth animations

### Register Screen

- Multi-field form with validation
- Real-time location status indicator
- Password confirmation
- Optional referrer field
- Location permission handling
- ScrollView for small screens

### Drawer Menu

- Shows user profile with avatar
- Displays user name and email
- Shows coin balance
- Online status indicator
- Logout button with confirmation

---

## 🔐 Security Features

✅ JWT token authentication  
✅ Secure token storage (AsyncStorage)  
✅ Password masking  
✅ Auto-logout on 401 errors  
✅ Input validation  
✅ Phone number format validation  
✅ Email format validation  
✅ Password strength requirements  

---

## 🧪 Testing

### Test Login

1. Open app
2. Wait for splash screen
3. Login screen appears
4. Enter test credentials:
   - Phone: `01XXXXXXXXX` (11 digits)
   - Password: Your password
5. Tap Login
6. Should redirect to home

### Test Registration

1. Tap "Sign Up"
2. Allow location permission when prompted
3. Fill all required fields:
   - Name: Test User
   - Email: test@example.com
   - Phone: 01123456789
   - Password: test123
   - Confirm Password: test123
4. Tap "Create Account"
5. Should navigate to login
6. Login with new credentials

### Test Logout

1. When logged in, open drawer menu
2. Tap "Logout" button
3. Confirm in dialog
4. Should redirect to login screen

---

## 🐛 Troubleshooting

### Issue: "Location Required" Alert

**Solution**: 
- iOS: Grant location permission in device settings
- Android: Grant location permission in device settings
- Make sure location services are enabled

### Issue: Login fails with "Network Error"

**Solution**:
- Check internet connection
- Verify backend is running at `https://fly-book-server-lzu4.onrender.com`
- Check API logs for errors

### Issue: "Invalid phone number" error

**Solution**:
- Phone must be exactly 11 digits
- Must start with "01" (Bangladesh format)
- Example: 01712345678

### Issue: Token not persisting

**Solution**:
- Check AsyncStorage permissions
- Clear app data and try again
- Check console for storage errors

### Issue: Stuck on splash screen

**Solution**:
- Check console for errors
- Verify AuthContext is properly wrapped in App.tsx
- Clear app data and reinstall

---

## 🎯 Next Steps

### Immediate
- [x] Implement login
- [x] Implement registration
- [x] Add logout functionality
- [x] Add auth state management
- [x] Update navigation

### Coming Soon
- [ ] Forgot password flow
- [ ] Email verification
- [ ] Phone OTP verification
- [ ] Social login (Google, Facebook)
- [ ] Biometric authentication
- [ ] Remember me persistence
- [ ] Profile editing

---

## 📊 Auth Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                   App Start                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              AuthProvider                        │
│         (Check AsyncStorage)                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│             SplashScreen                         │
│        (isLoading = true)                       │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
   Token Found      No Token
         │                 │
         ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Main App   │   │ Auth Stack  │
│  (Drawer)   │   │   (Login)   │
└─────────────┘   └─────────────┘
```

---

## 💡 Implementation Details

### Token Management

```typescript
// Saving token after login
await saveToken(response.token);
await saveUser(response.user);
setUser(response.user);

// Token automatically added to all API requests
// Via interceptor in api.ts
```

### Auth State

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### User Object

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  role?: string;
  verified?: boolean;
  coins?: number;
  createdAt?: string;
}
```

---

## 🎉 Success!

Your FlyBook app now has a complete, production-ready authentication system! Users can:

✅ Register with phone number  
✅ Login securely  
✅ Stay logged in across restarts  
✅ Logout safely  
✅ See their profile in drawer  

The system is integrated with your backend at:
**https://fly-book-server-lzu4.onrender.com**

---

**Built with ❤️ for FlyBook**
