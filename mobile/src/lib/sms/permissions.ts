import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';
import { apiPatch } from '@nexpo/shared';
import { API_ROUTES } from '@nexpo/shared';
import { ensureNotificationPermissions } from './syncNotifications';

export type SmsPermissionState = {
  androidSmsGranted: boolean;
  notificationsGranted: boolean;
  callGranted: boolean;
  locationGranted: boolean;
};

async function requestAndroidSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);

  return (
    results[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
    results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED
  );
}

async function requestCallPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestLocationPermission(): Promise<boolean> {
  const result = await Location.requestForegroundPermissionsAsync();
  return result.granted;
}

export async function requestSmsImportPermissions(): Promise<SmsPermissionState> {
  const [androidSmsGranted, notificationsGranted, callGranted, locationGranted] = await Promise.all([
    requestAndroidSmsPermission(),
    ensureNotificationPermissions(),
    requestCallPermission(),
    requestLocationPermission(),
  ]);

  const state: SmsPermissionState = {
    androidSmsGranted,
    notificationsGranted,
    callGranted,
    locationGranted,
  };

  await apiPatch(API_ROUTES.sms.settings, {
    android_sms_granted: androidSmsGranted,
    notifications_granted: notificationsGranted,
    call_granted: callGranted,
    location_granted: locationGranted,
  }).catch(() => undefined);

  return state;
}
