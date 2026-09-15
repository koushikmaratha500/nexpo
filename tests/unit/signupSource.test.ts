import { describe, expect, it } from 'vitest';
import { formatSignupSource } from '@/lib/auth/signupSource';

describe('formatSignupSource', () => {
  it('labels email, google, and mobile origins', () => {
    expect(formatSignupSource('EMAIL')).toBe('Email');
    expect(formatSignupSource('GOOGLE')).toBe('Google');
    expect(formatSignupSource('MOBILE')).toBe('Mobile');
  });

  it('defaults unknown values to Email', () => {
    expect(formatSignupSource(null)).toBe('Email');
    expect(formatSignupSource(undefined)).toBe('Email');
  });
});
