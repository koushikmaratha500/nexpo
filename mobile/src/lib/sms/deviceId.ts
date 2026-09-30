import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'nexpo_device_id';

export async function getDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }

  const generated =
    Platform.OS === 'android'
      ? Application.getAndroidId() ?? `android-${Date.now()}`
      : `ios-${Application.applicationId ?? 'app'}-${Date.now()}`;

  await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);
  return generated;
}
