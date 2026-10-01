/** Public marketing / legal routes (replace page copy before launch). */
export const SITE_DOCUMENT_ROUTES = {
  termsAndConditions: '/terms-and-conditions',
  privacyPolicy: '/privacy-policy',
  termsOfUse: '/terms-of-use',
  faq: '/faq',
  contactUs: '/contact-us',
} as const;

export const SITE_DOCUMENT_FOOTER_LINKS = [
  { href: SITE_DOCUMENT_ROUTES.termsAndConditions, label: 'Terms & Conditions' },
  { href: SITE_DOCUMENT_ROUTES.privacyPolicy, label: 'Privacy Policy' },
  { href: SITE_DOCUMENT_ROUTES.termsOfUse, label: 'Terms of Use' },
  { href: SITE_DOCUMENT_ROUTES.faq, label: 'FAQ' },
  { href: SITE_DOCUMENT_ROUTES.contactUs, label: 'Contact Us' },
] as const;
