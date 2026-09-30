import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { API_ROUTES, apiGet, apiPost } from '@nexpo/shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';

type LifecycleStatus = {
  mode: 'ACTIVE' | 'RESET_PENDING' | 'DELETE_PENDING';
  requested_at: string | null;
  purge_at: string | null;
  days_remaining: number | null;
  can_restore: boolean;
};

type OtpChannel = 'email' | 'sms';

export function AccountLifecycleCard() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [lifecycle, setLifecycle] = useState<LifecycleStatus | null>(null);
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [otp, setOtp] = useState('');
  const [otpSentFor, setOtpSentFor] = useState<'RESET' | 'DELETE' | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiGet<{ success: boolean; lifecycle: LifecycleStatus }>(
        API_ROUTES.account.lifecycle,
      );
      setLifecycle(response.lifecycle);
    } catch {
      setLifecycle(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sendOtp = async (action: 'RESET' | 'DELETE') => {
    setLoading(true);
    try {
      await apiPost(API_ROUTES.account.otpSend, { action, channel });
      setOtpSentFor(action);
      addToast(`Code sent via ${channel === 'email' ? 'email' : 'SMS'}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to send code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAccount = () => {
    if (otpSentFor !== 'RESET' || otp.length !== 6) {
      addToast('Send and enter the verification code first', 'error');
      return;
    }

    Alert.alert(
      'Reset account',
      'Personal transactions will be hidden. Recover within 7 days by signing in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiPost(API_ROUTES.account.reset, {
                confirmation: 'RESET',
                channel,
                otp,
              });
              addToast('Account reset started', 'success');
              setOtp('');
              setOtpSentFor(null);
              await load();
            } catch (err) {
              addToast(err instanceof Error ? err.message : 'Reset failed', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    if (otpSentFor !== 'DELETE' || otp.length !== 6) {
      addToast('Send and enter the verification code first', 'error');
      return;
    }

    Alert.alert(
      'Delete account',
      'Sign in within 7 days to cancel. After that, your account is permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiPost(API_ROUTES.account.delete, {
                confirmation: 'DELETE',
                channel,
                otp,
              });
              addToast('Account scheduled for deletion', 'info');
              await logout();
            } catch (err) {
              addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const restoreAccount = async () => {
    setLoading(true);
    try {
      await apiPost(API_ROUTES.account.restore, {});
      addToast('Account restored', 'success');
      await load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Restore failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!lifecycle) {
    return null;
  }

  return (
    <Card className="mb-lg gap-md">
      <View>
        <Text className="font-title-md font-bold text-primary">Account data</Text>
        <Text className="mt-1 font-body-md text-on-surface-variant">
          Reset or delete requires email or SMS OTP. Data is kept for 7 days, then permanently removed.
        </Text>
      </View>

      <View className="flex-row gap-sm">
        <Button
          title="Email OTP"
          variant={channel === 'email' ? 'primary' : 'secondary'}
          onPress={() => setChannel('email')}
          className="flex-1"
        />
        <Button
          title="SMS OTP"
          variant={channel === 'sms' ? 'primary' : 'secondary'}
          onPress={() => setChannel('sms')}
          className="flex-1"
        />
      </View>

      <Input
        label="Verification code"
        value={otp}
        onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
      />

      {lifecycle.can_restore ? (
        <Button title="Restore account" variant="secondary" loading={loading} onPress={restoreAccount} />
      ) : null}

      <Button title="Send code (reset)" variant="secondary" loading={loading} onPress={() => sendOtp('RESET')} />
      <Button title="Reset account" variant="secondary" loading={loading} onPress={resetAccount} />
      <Button title="Send code (delete)" variant="secondary" loading={loading} onPress={() => sendOtp('DELETE')} />
      <Button title="Delete account" variant="secondary" loading={loading} onPress={deleteAccount} />
    </Card>
  );
}
