import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { API_ROUTES, apiPost } from '@nexpo/shared';
import { PageShell } from '../../src/components/layout/PageShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/hooks/useToast';
import { showSyncNotification } from '../../src/lib/sms/syncNotifications';

export default function SmsImportScreen() {
  const { addToast } = useToast();
  const [body, setBody] = useState('');
  const [sender, setSender] = useState('manual');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!body.trim()) {
      addToast('Paste a bank SMS message first', 'error');
      return;
    }

    setSubmitting(true);
    await showSyncNotification('uploading', 'Uploading 1 message', true);
    try {
      const result = await apiPost<{
        success: boolean;
        accepted?: number;
        error?: string;
      }>(API_ROUTES.sms.manual, {
        body: body.trim(),
        sender: sender.trim() || 'manual',
      });

      if (!result.success) {
        await showSyncNotification('failed', result.error, true);
        addToast(result.error ?? 'Import failed', 'error');
        return;
      }

      await showSyncNotification('complete', 'Message sent for parsing', true);
      addToast('SMS sent for import', 'success');
      router.push('/(app)/sms-sync-status');
    } catch (err) {
      await showSyncNotification('failed', undefined, true);
      addToast(err instanceof Error ? err.message : 'Import failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <ScreenHeader
        title="Import SMS"
        subtitle="Paste a bank debit/credit SMS. Auto-read is not available on iOS."
      />

      <Card className="gap-md">
        <Input label="Sender (optional)" value={sender} onChangeText={setSender} autoCapitalize="none" />
        <Input
          label="Bank SMS text"
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Paste the full SMS message here"
        />
        <Button title="Upload transaction" loading={submitting} onPress={onSubmit} />
      </Card>

      <View className="mt-md">
        <Text className="font-label-sm text-label-sm text-on-surface-variant">
          OTP and promotional messages are automatically skipped during parsing.
        </Text>
      </View>
    </PageShell>
  );
}
