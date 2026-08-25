import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'tertiary';
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  children,
  variant = 'primary',
  loading,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const label = children ?? title;

  const variants = {
    primary: 'bg-primary active:opacity-90',
    secondary: 'border border-outline-variant bg-surface-container-lowest active:bg-surface-container-low',
    ghost: 'active:bg-surface-container-low',
    danger: 'bg-error active:opacity-90',
    tertiary: 'bg-tertiary active:opacity-90',
  };

  const textVariants = {
    primary: 'text-on-primary',
    secondary: 'text-on-surface',
    ghost: 'text-on-surface-variant',
    danger: 'text-on-error',
    tertiary: 'text-on-tertiary',
  };

  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-1 rounded-lg px-4 py-2 min-h-[44px] active:scale-[0.98]',
        variants[variant],
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#000' : '#fff'} />
      ) : typeof label === 'string' ? (
        <Text className={cn('font-title-md text-title-md', textVariants[variant], textClassName)}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );
}
