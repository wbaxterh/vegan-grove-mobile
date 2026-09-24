/**
 * Expo app config. This file is authoritative; there is no app.json.
 *
 * Env-sourced values:
 * - EAS_PROJECT_ID: set after `eas init` creates the project. Push tokens
 *   cannot be issued until it is present.
 *
 * `updates` is left unconfigured on purpose: over-the-air updates are a
 * release-policy decision (channel per profile, rollout, signing) that has
 * not been made yet, and an unconfigured block is safer than a half-right one.
 */

import type { ConfigContext, ExpoConfig } from 'expo/config';

const BRAND_BG = '#0B0F0C';
const BRAND_PRIMARY = '#3DFF8A';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vegan Grove',
  slug: 'vegan-grove',
  version: '0.1.0',
  scheme: 'vegangrove',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: 'org.vegangrove.app',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Vegan Grove uses your location only to center the map. It is never sent to our servers.',
      NSCameraUsageDescription: 'Vegan Grove uses the camera for your avatar and post photos.',
      NSPhotoLibraryUsageDescription:
        'Vegan Grove uses your photos for your avatar and posts. Location data is removed before upload.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'org.vegangrove.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: BRAND_BG,
    },
    // Minimal set. Notifications and location come from the plugins below;
    // nothing here asks for background location, contacts, or phone state.
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    blockedPermissions: [
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.RECORD_AUDIO',
    ],
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: BRAND_BG,
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Vegan Grove uses your location only to center the map. It is never sent to our servers.',
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        motionUsagePermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-notifications',
      {
        color: BRAND_PRIMARY,
        icon: './assets/images/notification-icon.png',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Vegan Grove uses your photos for your avatar and posts. Location data is removed before upload.',
        cameraPermission: 'Vegan Grove uses the camera for your avatar and post photos.',
        microphonePermission: false,
      },
    ],
    // MapLibre's plugin edits gradle.properties and the Podfile itself; no
    // expo-build-properties settings are required for it on SDK 57.
    '@maplibre/maplibre-react-native',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      // Placeholder until `eas init` runs; Wes creates the project and sets the env.
      projectId: process.env.EAS_PROJECT_ID,
    },
    router: {},
  },
});
