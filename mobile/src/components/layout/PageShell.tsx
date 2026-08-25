import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { cn } from '../../lib/cn';

interface PageShellProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  contentClassName?: string;
}

export function PageShell({
  children,
  scrollable = true,
  className,
  contentClassName,
  ...props
}: PageShellProps) {
  if (scrollable) {
    return (
      <ScrollView
        className={cn('flex-1 bg-background', className)}
        contentContainerClassName={cn('p-lg pb-36', contentClassName)}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={cn('flex-1 bg-background p-lg pb-36', className, contentClassName)}>
      {children}
    </View>
  );
}
