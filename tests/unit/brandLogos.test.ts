import { describe, expect, it } from 'vitest';
import {
  getBrandEmailLogoUrl,
  getBrandLogoAssetPath,
  getBrandLogoDisplaySize,
  getBrandLogoSrcSet,
  getBrandOgImagePath,
} from '@/lib/brand/logos';

describe('brand logos', () => {
  it('resolves variant and theme asset paths', () => {
    expect(getBrandLogoAssetPath('full', 'mono')).toBe('/brand/logo-full-mono@2x.png');
    expect(getBrandLogoAssetPath('wordmark', 'light')).toBe('/brand/logo-wordmark-light.png');
    expect(getBrandLogoAssetPath('icon', 'dark', 'svg')).toBe('/brand/logo-icon-dark.svg');
  });

  it('builds retina srcset for full logos', () => {
    expect(getBrandLogoSrcSet('full', 'mono')).toContain('@3x.png 3x');
    expect(getBrandLogoSrcSet('icon', 'mono')).toBeUndefined();
  });

  it('calculates display sizes from aspect ratio', () => {
    expect(getBrandLogoDisplaySize('icon', 'md')).toEqual({ width: 40, height: 40 });
    expect(getBrandLogoDisplaySize('full', 'lg').height).toBe(48);
  });

  it('exposes og and email asset paths', () => {
    expect(getBrandOgImagePath()).toBe('/brand/og-image.png');
    expect(getBrandEmailLogoUrl()).toContain('/brand/email-header-560x160.png');
  });
});
