import { MaterialIcons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

cssInterop(MaterialIcons, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  dashboard: 'dashboard',
  receipt_long: 'receipt-long',
  groups: 'groups',
  notifications_active: 'notifications-active',
  bar_chart: 'bar-chart',
  smart_toy: 'smart-toy',
  settings: 'settings',
  help: 'help',
  logout: 'logout',
  add: 'add',
  search: 'search',
  close: 'close',
  notifications: 'notifications',
  arrow_forward: 'arrow-forward',
  info: 'info',
  south_west: 'south-west',
  north_east: 'north-east',
  error: 'error',
  check: 'check',
  send: 'send',
  stop_circle: 'stop-circle',
};

export function AppIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const mapped = ICON_MAP[name] ?? 'circle';
  return <MaterialIcons name={mapped} size={size} className={className} />;
}
