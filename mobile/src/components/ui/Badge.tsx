import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | 'debit' | 'credit' | 'success';
}) {
  return (
    <View
      className={cn(
        'rounded-full px-2 py-0.5',
        variant === 'debit' && 'bg-error-container/30',
        variant === 'credit' && 'bg-secondary-container/30',
        variant === 'success' && 'bg-secondary-container/30',
        variant === 'default' && 'bg-surface-container-low'
      )}
    >
      <Text
        className={cn(
          'text-[10px] font-bold uppercase',
          variant === 'debit' && 'text-error',
          variant === 'credit' && 'text-on-secondary-container',
          variant === 'success' && 'text-on-secondary-container',
          variant === 'default' && 'text-on-surface-variant'
        )}
      >
        {label}
      </Text>
    </View>
  );
}
