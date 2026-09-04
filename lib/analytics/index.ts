export * from '@/lib/analytics/types';
export { PAGE_REGISTRY, resolvePageContext } from '@/lib/analytics/pageRegistry';
export {
  parseTrackedElement,
  resetAnalyticsPageStateForTests,
  trackClick,
  trackNavSelect,
  trackPageView,
  trackTabSelect,
} from '@/lib/analytics/track';
