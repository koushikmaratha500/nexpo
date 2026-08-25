import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@nexpo/shared';
import { useAuthStore } from '../store/authStore';

const TOKEN_KEY = 'nexpo_mobile_token';

/** SecureStore-backed token; Zustand persist holds user profile. */
export const mobileTokenStorage: TokenStorage = {
  async getToken() {
    const fromSecure = await SecureStore.getItemAsync(TOKEN_KEY);
    if (fromSecure) return fromSecure;
    return useAuthStore.getState().token;
  },
  async setToken(token) {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};
