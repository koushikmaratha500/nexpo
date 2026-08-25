export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  username?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  countryId?: string | null;
  currencyId?: string | null;
  role: UserRole;
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  forcePasswordReset?: boolean;
  user?: {
    username?: string | null;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    mobile?: string | null;
    email: string;
    countryId?: string | null;
    currencyId?: string | null;
  };
  error?: string;
}
