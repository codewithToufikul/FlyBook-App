# 🎨 FlyBook Loaders Guide

Beautiful, animated loading components for the FlyBook React Native app.

---

## 📦 Available Loaders

### 1. **Loader** (Main Loader)
Full-featured loader with logo animation, spinner, and pulsing effects.

#### Usage:
```tsx
import { Loader } from '@/components/common';

// Fullscreen loader
<Loader message="Loading..." />

// With custom options
<Loader 
  message="Fetching data..."
  size="large"
  variant="fullscreen"
  showLogo={true}
  color="#3B82F6"
/>
```

#### Props:
- `message?: string` - Loading message (default: "Loading...")
- `size?: 'small' | 'medium' | 'large'` - Loader size (default: 'medium')
- `variant?: 'fullscreen' | 'inline' | 'overlay'` - Display style (default: 'fullscreen')
- `showLogo?: boolean` - Show FlyBook logo (default: true)
- `color?: string` - Spinner color (default: '#3B82F6')

#### Variants:
```tsx
// Fullscreen - Takes entire screen
<Loader variant="fullscreen" message="Loading app..." />

// Inline - Fits within container
<View style={{ padding: 20 }}>
  <Loader variant="inline" size="small" message="Loading posts..." />
</View>

// Overlay - Dark overlay over content
<Loader variant="overlay" message="Processing..." />
```

---

### 2. **ButtonLoader**
Compact spinner for buttons and inline loading states.

#### Usage:
```tsx
import { ButtonLoader } from '@/components/common';

// In a button
<TouchableOpacity 
  style={styles.button}
  disabled={loading}
>
  {loading ? (
    <ButtonLoader size="medium" color="#FFFFFF" />
  ) : (
    <Text>Submit</Text>
  )}
</TouchableOpacity>
```

#### Props:
- `size?: 'small' | 'medium' | 'large'` - Loader size (default: 'medium')
- `color?: string` - Spinner color (default: '#FFFFFF')

#### Example - Login Button:
```tsx
<TouchableOpacity 
  style={[styles.loginButton, loading && styles.disabled]}
  onPress={handleLogin}
  disabled={loading}
>
  {loading ? (
    <ButtonLoader color="#FFFFFF" />
  ) : (
    <Text style={styles.buttonText}>Login</Text>
  )}
</TouchableOpacity>
```

---

### 3. **SkeletonLoader**
Content placeholder with shimmer effect.

#### Basic Usage:
```tsx
import { SkeletonLoader } from '@/components/common';

// Text skeleton
<SkeletonLoader width="80%" height={16} />

// Image skeleton
<SkeletonLoader width={200} height={150} borderRadius={8} />

// Circle skeleton (avatar)
<SkeletonLoader variant="circle" width={50} height={50} />
```

#### Predefined Layouts:
```tsx
import { 
  PostSkeleton, 
  ProductCardSkeleton, 
  ListItemSkeleton 
} from '@/components/common';

// Loading feed
<ScrollView>
  <PostSkeleton />
  <PostSkeleton />
  <PostSkeleton />
</ScrollView>

// Loading products
<View style={styles.grid}>
  <ProductCardSkeleton />
  <ProductCardSkeleton />
</View>

// Loading list
<FlatList
  data={loading ? [1, 2, 3, 4, 5] : data}
  renderItem={({ item }) => 
    loading ? <ListItemSkeleton /> : <ListItem data={item} />
  }
/>
```

#### Custom Skeleton:
```tsx
// User profile skeleton
<View style={styles.profile}>
  <SkeletonLoader variant="circle" width={80} height={80} />
  <SkeletonLoader width="60%" height={20} style={{ marginTop: 12 }} />
  <SkeletonLoader width="40%" height={16} style={{ marginTop: 8 }} />
</View>
```

---

### 4. **PullToRefreshLoader**
Animated loader for pull-to-refresh interactions.

#### Usage:
```tsx
import { PullToRefreshLoader } from '@/components/common';
import { RefreshControl, ScrollView } from 'react-native';

const [refreshing, setRefreshing] = useState(false);

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={['#3B82F6']}
      tintColor="#3B82F6"
    />
  }
>
  {content}
</ScrollView>

// Or custom loader at top
{refreshing && (
  <View style={styles.refreshContainer}>
    <PullToRefreshLoader color="#3B82F6" size={40} />
  </View>
)}
```

---

### 5. **LoadingOverlay**
Modal overlay with loading indicator.

#### Usage:
```tsx
import { LoadingOverlay } from '@/components/common';

const [uploading, setUploading] = useState(false);

<LoadingOverlay 
  visible={uploading}
  message="Uploading image..."
/>
```

#### Props:
- `visible: boolean` - Show/hide overlay
- `message?: string` - Loading message (default: "Loading...")
- `dismissable?: boolean` - Allow backdrop press to dismiss (default: false)
- `onDismiss?: () => void` - Callback when dismissed
- `transparent?: boolean` - Lighter background (default: false)

#### Examples:
```tsx
// Standard overlay
<LoadingOverlay 
  visible={loading}
  message="Processing payment..."
/>

// Dismissable overlay
<LoadingOverlay 
  visible={loading}
  message="Loading content..."
  dismissable={true}
  onDismiss={() => setLoading(false)}
/>

// Transparent overlay (doesn't block UI as much)
<LoadingOverlay 
  visible={loading}
  message="Saving..."
  transparent={true}
/>
```

---

## 🎯 Real-World Examples

### Login Screen
```tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { ButtonLoader, LoadingOverlay } from '@/components/common';
import { login } from '@/services';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email, password });
      // Navigate to home
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput 
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ButtonLoader color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      {/* Or use overlay */}
      <LoadingOverlay 
        visible={loading}
        message="Logging in..."
      />
    </View>
  );
};
```

### Feed with Skeleton
```tsx
import { useState, useEffect } from 'react';
import { FlatList } from 'react-native';
import { PostSkeleton } from '@/components/common';
import { get } from '@/services';

const FeedScreen = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await get('/posts');
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FlatList
        data={[1, 2, 3, 4, 5]}
        renderItem={() => <PostSkeleton />}
        keyExtractor={(item) => `skeleton-${item}`}
      />
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostCard post={item} />}
      keyExtractor={(item) => item._id}
    />
  );
};
```

### Profile Image Upload
```tsx
import { useState } from 'react';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { LoadingOverlay } from '@/components/common';
import { updateProfileImage } from '@/services';

const ProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const handleUpload = async (uri: string) => {
    setUploading(true);
    try {
      await updateProfileImage(uri);
      setImageUri(uri);
      Alert.alert('Success', 'Profile image updated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={selectImage}>
        <Image source={{ uri: imageUri }} style={styles.avatar} />
      </TouchableOpacity>
      
      <LoadingOverlay 
        visible={uploading}
        message="Uploading image..."
      />
    </>
  );
};
```

### Pull to Refresh
```tsx
import { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { get } from '@/services';

const ContentScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const newData = await get('/content');
      setData(newData);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Content */}
    </ScrollView>
  );
};
```

---

## 🎨 Customization

### Custom Colors
```tsx
// Brand colors
<Loader color="#8B5CF6" />
<ButtonLoader color="#EF4444" />
<PullToRefreshLoader color="#10B981" />
```

### Custom Sizes
```tsx
<Loader size="small" />   // Compact
<Loader size="medium" />  // Default
<Loader size="large" />   // Prominent
```

### Custom Messages
```tsx
<Loader message="Syncing data..." />
<LoadingOverlay message="Creating account..." />
```

---

## 🚀 Best Practices

1. **Use appropriate loader for context**:
   - Fullscreen loader: Initial app load, authentication
   - Inline loader: Content sections, cards
   - Button loader: Form submissions, actions
   - Skeleton loader: List items, feeds
   - Overlay: File uploads, processing

2. **Provide meaningful messages**:
   ```tsx
   // ✅ Good
   <Loader message="Loading your library..." />
   
   // ❌ Avoid
   <Loader message="Please wait..." />
   ```

3. **Use skeletons for better UX**:
   - Shows content structure while loading
   - Reduces perceived loading time
   - Better than blank screens

4. **Keep loading states minimal**:
   - Show loaders only when necessary
   - Use optimistic UI updates when possible
   - Cache data to reduce loading screens

---

## 🎯 Animation Details

All loaders use **react-native-reanimated** for:
- Smooth 60 FPS animations
- Native thread performance
- Low battery impact
- Gesture-driven animations

Animations included:
- ✨ **Scale pulse** - Logo breathing effect
- 🔄 **Rotation** - Spinner rotation
- 💫 **Opacity fade** - Gentle fading
- 🎪 **Bounce** - Animated dots
- ✨ **Shimmer** - Skeleton loading effect

---

## 📱 Platform Notes

- All loaders work on iOS and Android
- Tested on React Native 0.83.1
- Uses Reanimated 4.x
- No native module linking required
- Fully TypeScript typed

---

**Happy Loading! 🚀**
