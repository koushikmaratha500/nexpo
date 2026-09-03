import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@nexpo/shared';

const TOKEN_KEY = 'nexpo_mobile_token';

/** JWT lives only in SecureStore — never in AsyncStorage. */
export const mobileTokenStorage: TokenStorage = {
  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token) {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};
