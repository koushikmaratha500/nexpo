export type SignupSource = 'EMAIL' | 'GOOGLE' | 'MOBILE';

/** Original account origin — not last login method. */
export function formatSignupSource(provider?: string | null): string {
  switch (provider) {
    case 'GOOGLE':
      return 'Google';
    case 'MOBILE':
      return 'Mobile';
    case 'EMAIL':
    default:
      return 'Email';
  }
}
