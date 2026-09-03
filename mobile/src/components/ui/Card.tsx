import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

interface CardProps extends ViewProps {
  glass?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({ glass = false, className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-xl p-md',
        glass
          ? 'bg-white/85 border border-outline-variant shadow-sm'
          : 'bg-surface-container-lowest border border-outline-variant shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
