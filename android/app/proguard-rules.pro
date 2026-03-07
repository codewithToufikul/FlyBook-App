# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# WebRTC (Stream Video SDK)
-keep class org.webrtc.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.core.** { *; }

# React Native Video
-keep class com.brentvatne.react.** { *; }
-keep class com.google.android.exoplayer2.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# Google Maps
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.libraries.maps.** { *; }
