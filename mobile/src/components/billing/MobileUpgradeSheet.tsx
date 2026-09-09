import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { API_ROUTES, apiPost } from '@nexpo/shared';
import { useMobilePlanContext } from '../../context/PlanContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';

type CheckoutSku = 'STARTER_MONTHLY' | 'STARTER_YEARLY' | 'PRO_LIFETIME';

export function MobileUpgradeSheet() {
  const { plan, upgradeOpen, setUpgradeOpen, refresh } = useMobilePlanContext();
  const { addToast } = useToast();

  const prices = plan?.catalog?.pricesInr;
  const checkoutAvailable = plan?.catalog?.checkoutAvailable ?? false;
  const isPro = plan?.plan === 'PRO';
  const isStarterActive = plan?.plan === 'STARTER' && plan.isPaid;

  const startCheckout = async (sku: CheckoutSku) => {
    try {
      const res = await apiPost<{
        client: { kind: string; url?: string };
      }>(API_ROUTES.billing.checkout, { sku });
      if (res.client.kind === 'stripe' && res.client.url) {
        await Linking.openURL(res.client.url);
        setUpgradeOpen(false);
        return;
      }
      addToast('Open the web app Settings page to complete Razorpay checkout.', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Checkout failed', 'error');
    }
  };

  return (
    <Modal visible={upgradeOpen} animationType="slide" transparent onRequestClose={() => setUpgradeOpen(false)}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-2xl bg-background p-5 max-h-[85%]">
          <Text className="text-lg font-bold text-primary mb-2">
            {isStarterActive ? 'Upgrade to Pro' : 'Choose a plan'}
          </Text>
          <Text className="text-sm text-on-surface-variant mb-4">
            {isPro
              ? 'You already have Pro lifetime access.'
              : checkoutAvailable
                ? 'Prices exclude 18% GST at checkout.'
                : 'Checkout is not configured yet.'}
          </Text>

          {!isStarterActive && prices && (
            <View className="gap-2 mb-4">
              <Text className="font-semibold text-on-surface">Starter</Text>
              <Button
                title={`Monthly · ₹${prices.starterMonthly}`}
                variant="secondary"
                onPress={() => startCheckout('STARTER_MONTHLY')}
              />
              <Button
                title={`Yearly · ₹${prices.starterYearly}`}
                variant="secondary"
                onPress={() => startCheckout('STARTER_YEARLY')}
              />
            </View>
          )}

          {prices && (
            <View className="gap-2 mb-4">
              <Text className="font-semibold text-on-surface">Pro lifetime</Text>
              <Button
                title={isPro ? 'Pro active' : `Buy · ₹${prices.proLifetime}`}
                disabled={isPro}
                onPress={() => startCheckout('PRO_LIFETIME')}
              />
            </View>
          )}

          <Pressable onPress={() => setUpgradeOpen(false)} className="py-3 items-center">
            <Text className="font-semibold text-on-surface-variant">Close</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void refresh();
              setUpgradeOpen(false);
            }}
            className="py-2 items-center"
          >
            <Text className="text-xs text-primary">Refresh plan status</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
