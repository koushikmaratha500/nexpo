import { describe, expect, it } from 'vitest';
import { getActiveNavPath, navLinkMatchesPath } from '@/components/layout/SidebarNav';

const customerNav = [
  { name: 'Dashboard', path: '/customer', icon: 'dashboard' },
  { name: 'Transactions', path: '/customer/transactions', icon: 'receipt_long' },
  { name: 'Groups', path: '/customer/groups', icon: 'groups' },
];

describe('SidebarNav active route matching', () => {
  it('highlights dashboard only on the exact dashboard path', () => {
    expect(navLinkMatchesPath('/customer', '/customer')).toBe(true);
    expect(navLinkMatchesPath('/customer/support', '/customer')).toBe(false);
    expect(getActiveNavPath('/customer/support', customerNav)).toBeNull();
  });

  it('highlights nested section routes and their children', () => {
    expect(getActiveNavPath('/customer/transactions', customerNav)).toBe('/customer/transactions');
    expect(getActiveNavPath('/customer/transactions/abc', customerNav)).toBe('/customer/transactions');
    expect(getActiveNavPath('/customer/groups/42', customerNav)).toBe('/customer/groups');
  });
});
