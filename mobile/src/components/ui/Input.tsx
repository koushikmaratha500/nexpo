import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName, className, ...props }: InputProps) {
  return (
    <View className={cn('gap-1', containerClassName)}>
      {label ? (
        <Text className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          {label}
        </Text>
      ) : null}
      <TextInput
        className={cn(
          'w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 font-body-md text-body-md text-on-surface',
          error && 'border-error',
          className
        )}
        placeholderTextColor="#45464d"
        {...props}
      />
      {error ? <Text className="text-xs font-semibold text-error">{error}</Text> : null}
    </View>
  );
}
