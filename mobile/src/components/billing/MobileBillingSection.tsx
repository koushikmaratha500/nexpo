import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { API_ROUTES, apiGet, apiPatch, apiPost, getApiBaseUrl } from '@nexpo/shared';
import { useMobilePlanContext } from '../../context/PlanContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface SubscriptionSummary {
  plan: string;
  planStatus: string;
  billingInterval: string;
  currentPeriodEndsAt: string | null;
  billingGstin: string | null;
  canCancel: boolean;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  planLabel: string;
  totalInr: string;
  issuedAt: string;
}

export function MobileBillingSection() {
  const { plan, refresh, setUpgradeOpen } = useMobilePlanContext();
  const { addToast } = useToast();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiGet<SubscriptionSummary>(API_ROUTES.billing.subscription).catch(() => null),
      apiGet<InvoiceRow[]>(API_ROUTES.billing.invoices).catch(() => []),
    ])
      .then(([sub, inv]) => {
        if (!mounted) return;
        setSummary(sub);
        setGstin(sub?.billingGstin ?? '');
        setInvoices(inv ?? []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saveGstin = async () => {
    setSaving(true);
    try {
      const res = await apiPatch<{ billingGstin: string | null }>(API_ROUTES.billing.profile, {
        billingGstin: gstin.trim() || null,
      });
      setGstin(res.billingGstin ?? '');
      addToast('GSTIN saved.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save GSTIN', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      await apiPost(API_ROUTES.billing.cancel);
      addToast('Starter will cancel at period end.', 'success');
      await refresh();
      const sub = await apiGet<SubscriptionSummary>(API_ROUTES.billing.subscription);
      setSummary(sub);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Cancel failed', 'error');
    }
  };

  const openInvoice = async (id: string) => {
    try {
      await apiGet<{ base64: string; invoiceNumber: string }>(API_ROUTES.billing.invoiceById(id));
      addToast('Invoice ready — open the web app Settings page to download PDFs.', 'info');
      const webUrl = `${getApiBaseUrl().replace(/\/$/, '')}/customer/settings`;
      await Linking.openURL(webUrl);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load invoice', 'error');
    }
  };

  if (loading || !plan) return null;

  const prices = plan.catalog?.pricesInr;

  return (
    <Card className="mb-lg gap-md">
      <Text className="font-title-md font-bold text-primary">Billing</Text>
      <Text className="text-sm text-on-surface-variant">
        {plan.plan === 'PRO'
          ? 'Pro · lifetime'
          : plan.plan === 'STARTER'
            ? `Starter · ${plan.billingInterval === 'YEAR' ? 'yearly' : 'monthly'}`
            : plan.writesLocked
              ? 'Trial ended — upgrade to keep editing'
              : `Freemium trial · ${plan.trialDaysLeft} days left`}
      </Text>

      {plan.limits && !plan.isPaid && !plan.writesLocked && (
        <View className="gap-1">
          <Text className="text-xs font-bold uppercase text-on-surface-variant">Trial usage</Text>
          <Text className="text-sm text-on-surface">
            Txns {plan.usage.personalTransactions}/{plan.limits.personalTransactions} · OCR{' '}
            {plan.usage.ocr}/{plan.limits.ocr} · AI {plan.usage.aiMessages}/{plan.limits.aiMessages}
          </Text>
        </View>
      )}

      {plan.plan !== 'PRO' && prices && (
        <View className="gap-sm">
          {!plan.isPaid && (
            <>
              <Button
                title={`Starter monthly · ₹${prices.starterMonthly}`}
                variant="secondary"
                onPress={() => setUpgradeOpen(true)}
              />
              <Button
                title={`Starter yearly · ₹${prices.starterYearly}`}
                variant="secondary"
                onPress={() => setUpgradeOpen(true)}
              />
            </>
          )}
          <Button title={`Pro lifetime · ₹${prices.proLifetime}`} onPress={() => setUpgradeOpen(true)} />
        </View>
      )}

      <Input
        label="GSTIN (optional)"
        value={gstin}
        onChangeText={setGstin}
        autoCapitalize="characters"
      />
      <Button title="Save GSTIN" variant="secondary" loading={saving} onPress={saveGstin} />

      {summary?.canCancel && (
        <Button title="Cancel Starter at period end" variant="secondary" onPress={cancelSubscription} />
      )}

      {invoices.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase text-on-surface-variant">Invoices</Text>
          {invoices.slice(0, 5).map((invoice) => (
            <Button
              key={invoice.id}
              title={`${invoice.invoiceNumber} · ${invoice.totalInr}`}
              variant="secondary"
              onPress={() => openInvoice(invoice.id)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}
