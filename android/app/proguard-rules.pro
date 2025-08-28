# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native specific rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }

# Remove debug logs
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Optimization options
-optimizationpasses 5
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose

# Remove unused code
-dontshrink
-dontoptimize

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native components
-keep public class * extends com.facebook.react.ReactActivity
-keep public class * extends com.facebook.react.ReactApplication

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
