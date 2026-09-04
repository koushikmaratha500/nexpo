'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOptionalAnalytics } from '@/components/analytics/AnalyticsProvider';
import { BrandLogo } from '@/components/brand/BrandLogo';

export interface NavLink {
  name: string;
  path: string;
  icon: string;
}

/** Longest matching nav path so nested routes (e.g. /groups/[id]) highlight the parent item. */
export function navLinkMatchesPath(pathname: string, linkPath: string): boolean {
  if (pathname === linkPath) return true;
  if (!pathname.startsWith(`${linkPath}/`)) return false;

  // Section roots like /customer or /admin should not match every sibling route.
  const linkSegments = linkPath.split('/').filter(Boolean);
  return linkSegments.length >= 2;
}

export function getActiveNavPath(pathname: string, navLinks: NavLink[]): string | null {
  let best: string | null = null;

  for (const link of navLinks) {
    const matches = navLinkMatchesPath(pathname, link.path);
    if (matches && (!best || link.path.length > best.length)) {
      best = link.path;
    }
  }

  return best;
}

export function isNavLinkActive(pathname: string, linkPath: string, navLinks: NavLink[]): boolean {
  return getActiveNavPath(pathname, navLinks) === linkPath;
}

export interface SidebarNavProps {
  navLinks: NavLink[];
  roleLabel: string;
  appTitle: string;
  appSubtitle: string;
  showHelpCenter?: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  onLogoutClick: () => void;
  onLinkClick?: () => void;
}

export function SidebarNav({
  navLinks,
  roleLabel,
  appTitle,
  appSubtitle,
  showHelpCenter = true,
  isMobileMenuOpen,
  onMobileMenuClose,
  onLogoutClick,
  onLinkClick,
}: SidebarNavProps) {
  const pathname = usePathname();
  const analytics = useOptionalAnalytics();
  const activeNavPath = getActiveNavPath(pathname, navLinks);

  const trackNav = (link: NavLink, navSurface: 'sidebar' | 'bottom_nav') => {
    analytics?.trackNavEvent({
      navItem: link.name,
      navPath: link.path,
      navSurface,
    });
  };

  const renderNavLinks = (mobile = false) =>
    navLinks.map((link) => {
      const isActive = activeNavPath === link.path;
      const baseClassName = mobile
        ? `flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-surface-container-high text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`
        : `flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-surface-container-high text-primary font-bold shadow-sm'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`;

      return (
        <Link
          key={link.path}
          href={link.path}
          onClick={() => {
            trackNav(link, 'sidebar');
            if (mobile) onLinkClick?.();
          }}
          className={baseClassName}
        >
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
          </div>
          <span className="font-body-md text-body-md">{link.name}</span>
        </Link>
      );
    });

  const renderFooterLinks = (mobile = false) => (
    <>
      {showHelpCenter && (
        <Link
          href="/customer/support"
          onClick={() =>
            analytics?.trackNavEvent({
              navItem: 'Help Center',
              navPath: '/customer/support',
              navSurface: 'sidebar',
            })
          }
          className={`flex items-center gap-4 px-4 py-2 transition-colors ${
            mobile
              ? 'text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </div>
          <span className="font-body-md text-body-md">Help Center</span>
        </Link>
      )}
      <button
        onClick={onLogoutClick}
        type="button"
        data-track="auth_logout"
        data-track-type="button"
        data-track-label="Logout"
        data-track-section="sidebar_footer"
        className={`flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg text-left transition-colors cursor-pointer ${mobile ? '' : ''}`}
      >
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </div>
        <span className="font-body-md text-body-md">Logout</span>
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container-low p-4 gap-2 w-64 z-50">
        <div className="mb-6 px-2 py-4 border-b border-outline-variant/50">
          <BrandLogo variant="wordmark" theme="mono" size="sm" />
          <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-bold opacity-70 mt-1">
            {appSubtitle}
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-1 mt-4">
          {renderNavLinks()}
        </nav>

        <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
          {renderFooterLinks()}
        </div>
      </aside>

      {/* Mobile Slide-Out Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={onMobileMenuClose}
          />
          <div className="relative w-64 bg-surface-container-low border-r border-outline-variant h-full flex flex-col p-4 gap-2 animate-in slide-in-from-left duration-200">
            <div className="mb-6 px-2 py-4 border-b border-outline-variant/50 flex justify-between items-center">
              <div>
                <BrandLogo variant="wordmark" theme="mono" size="sm" />
                <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mt-1">
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={onMobileMenuClose}
                className="text-on-surface-variant hover:text-primary p-1 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
              {renderNavLinks(true)}
            </nav>

            <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
              {renderFooterLinks(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
