/**
 * react-native.config.js
 *
 * react-native-vision-camera-face-detector is excluded from iOS auto-linking because
 * its dependency GoogleMLKit/FaceDetection requires GoogleDataTransport < 10.0,
 * which is incompatible with @react-native-firebase v23 (Firebase iOS SDK 12.x)
 * that requires GoogleDataTransport ~> 10.1.
 *
 * Face detection works on Android. On iOS the standard Camera is used with a
 * manual capture fallback (see FaceCaptureScreen.tsx).
 */
module.exports = {
  dependencies: {
    'react-native-vision-camera-face-detector': {
      platforms: {
        ios: null, // disable iOS auto-linking for this package
      },
    },
  },
};
