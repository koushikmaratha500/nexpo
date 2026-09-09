import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMobilePlanContext } from '../../context/PlanContext';

export function useMobilePlan() {
  const { plan } = useMobilePlanContext();
  if (!plan) return null;
  return {
    plan: plan.plan,
    trialDaysLeft: plan.trialDaysLeft,
    writesLocked: plan.writesLocked,
  };
}

export function PlanStatusBanner() {
  const { plan, setUpgradeOpen } = useMobilePlanContext();
  if (!plan) return null;
  if (plan.plan !== 'FREEMIUM' && !plan.writesLocked) return null;

  const locked = plan.writesLocked;
  const showUpgrade = locked || plan.plan === 'FREEMIUM';

  return (
    <View
      className={`px-4 py-3 flex-row items-center justify-between gap-3 ${
        locked ? 'bg-error-container' : 'bg-surface-container-low'
      }`}
    >
      <Text className="text-sm text-on-surface flex-1">
        {locked
          ? 'Trial ended. Upgrade to Starter or Pro to add or edit data.'
          : `Freemium trial: ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? '' : 's'} left.`}
      </Text>
      {showUpgrade && (
        <Pressable
          onPress={() => {
            if (locked) {
              setUpgradeOpen(true);
            } else {
              router.push('/(app)/(tabs)/settings');
            }
          }}
          className="rounded-lg bg-primary px-3 py-2 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-on-primary">
            {locked ? 'Upgrade' : 'Plans'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
