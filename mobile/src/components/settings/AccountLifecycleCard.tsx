import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { API_ROUTES, apiGet, apiPost, apiUrl } from '@nexpo/shared';
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
type ModalAction = 'RESET' | 'DELETE';

export function AccountLifecycleCard() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [lifecycle, setLifecycle] = useState<LifecycleStatus | null>(null);
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [loading, setLoading] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const [otp, setOtp] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const openOtpFlow = async (action: ModalAction) => {
    setLoading(true);
    setModalError(null);
    try {
      await apiPost(API_ROUTES.account.otpSend, { action, channel });
      if (action === 'RESET') {
        addToast(
          `Reset OTP sent to your ${channel === 'email' ? 'email' : 'phone'}. Enter it to continue.`,
          'success',
        );
      } else {
        addToast(
          `Account deletion OTP sent to your ${channel === 'email' ? 'email' : 'phone'}. Enter it to continue.`,
          'success',
        );
      }
      setOtp('');
      setTermsAccepted(false);
      setModalAction(action);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTermsAndConditions = () => {
    void Linking.openURL(apiUrl('/terms-and-conditions'));
  };

  const submitOtp = async () => {
    if (!termsAccepted) {
      setModalError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!modalAction || otp.length !== 6) {
      setModalError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setModalError(null);
    try {
      if (modalAction === 'RESET') {
        await apiPost(API_ROUTES.account.reset, {
          confirmation: 'RESET',
          channel,
          otp,
        });
        setModalAction(null);
        setOtp('');
        addToast('Account reset complete.', 'success');
        await load();
      } else {
        await apiPost(API_ROUTES.account.delete, {
          confirmation: 'DELETE',
          channel,
          otp,
        });
        setModalAction(null);
        setOtp('');
        addToast('Account scheduled for deletion. Signing you out…', 'info');
        await logout();
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
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

  const modalTitle =
    modalAction === 'DELETE' ? 'Confirm account deletion' : 'Confirm account reset';

  return (
    <>
      <Card className="mb-lg gap-md">
        <View>
          <Text className="font-title-md font-bold text-primary">Account data</Text>
          <Text className="mt-1 font-body-md text-on-surface-variant">
            Reset or delete requires email or SMS OTP. Data is kept for 7 days, then permanently removed.
          </Text>
        </View>

        {lifecycle.mode !== 'ACTIVE' ? (
          <View className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
            <Text className="font-body-sm text-on-surface-variant">
              {lifecycle.mode === 'RESET_PENDING'
                ? 'Reset in progress — personal transactions are hidden.'
                : 'Account scheduled for deletion.'}
              {lifecycle.purge_at
                ? ` Recovery until ${new Date(lifecycle.purge_at).toLocaleString()}.`
                : ''}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-sm">
          <Button
            title="Email OTP"
            variant={channel === 'email' ? 'primary' : 'secondary'}
            onPress={() => setChannel('email')}
            className="flex-1"
            disabled={Boolean(modalAction)}
          />
          <Button
            title="SMS OTP"
            variant={channel === 'sms' ? 'primary' : 'secondary'}
            onPress={() => setChannel('sms')}
            className="flex-1"
            disabled={Boolean(modalAction)}
          />
        </View>

        {lifecycle.can_restore ? (
          <Button
            title="Restore account & transactions"
            variant="secondary"
            loading={loading}
            disabled={Boolean(modalAction)}
            onPress={restoreAccount}
          />
        ) : null}

        <Button
          title="Reset account"
          variant="secondary"
          loading={loading && !modalAction}
          disabled={Boolean(modalAction)}
          onPress={() => openOtpFlow('RESET')}
        />
        <Button
          title="Delete account"
          variant="secondary"
          loading={loading && !modalAction}
          disabled={Boolean(modalAction)}
          onPress={() => openOtpFlow('DELETE')}
        />
      </Card>

      <Modal
        visible={modalAction !== null}
        animationType="fade"
        transparent
        onRequestClose={() => undefined}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
            <Text className="font-headline-sm font-bold text-primary">{modalTitle}</Text>
            <Text className="mt-2 font-body-md text-on-surface-variant">
              Enter the 6-digit code we sent to your {channel === 'email' ? 'email' : 'phone'}.
            </Text>
            <Input
              className="mt-4"
              label="Verification code"
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
            <View className="mt-4 flex-row items-start gap-3">
              <Pressable
                onPress={() => !loading && setTermsAccepted((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                hitSlop={8}
              >
                <View
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                    termsAccepted ? 'border-primary bg-primary' : 'border-outline-variant bg-surface'
                  }`}
                >
                  {termsAccepted ? <Text className="text-xs font-bold text-on-primary">✓</Text> : null}
                </View>
              </Pressable>
              <Text className="flex-1 font-body-sm text-on-surface-variant">
                I accept the{' '}
                <Text className="font-semibold text-primary underline" onPress={openTermsAndConditions}>
                  Terms &amp; Conditions
                </Text>
              </Text>
            </View>
            {modalError ? (
              <Text className="mt-2 font-label-sm text-error text-center">{modalError}</Text>
            ) : null}
            <Button
              className="mt-4"
              title={
                modalAction === 'DELETE' ? 'Verify and delete account' : 'Verify and reset account'
              }
              loading={loading}
              onPress={submitOtp}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
