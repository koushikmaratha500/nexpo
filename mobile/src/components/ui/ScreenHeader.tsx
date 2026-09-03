import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({ title, subtitle, action, className }: ScreenHeaderProps) {
  return (
    <View className={cn('mb-lg flex-row items-end justify-between gap-md border-b border-outline-variant/30 pb-lg', className)}>
      <View className="flex-1">
        <Text className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-body-lg text-body-lg text-on-surface-variant">{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
