import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  API_ROUTES,
  apiGet,
  apiPatch,
  type CountryOption,
  type CurrencyOption,
  type UserMetadata,
} from '@nexpo/shared';
import { useAuth } from '../../../src/context/AuthContext';
import { useToast } from '../../../src/hooks/useToast';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { PageShell } from '../../../src/components/layout/PageShell';
import { MobileBillingSection } from '../../../src/components/billing/MobileBillingSection';
import { pickAndUploadImage } from '../../../src/lib/imageUpload';

type ProfileResponse = {
  username?: string | null;
  firstName?: string;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
};

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [countryId, setCountryId] = useState(user?.countryId || '');
  const [currencyId, setCurrencyId] = useState(user?.currencyId || '');
  const [avatar, setAvatar] = useState('');
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    void (async () => {
      try {
        const [metadata, profile] = await Promise.all([
          apiGet<UserMetadata>(API_ROUTES.metadata),
          apiGet<ProfileResponse>(API_ROUTES.auth.profile),
        ]);

        setCountries(metadata.countries || []);
        setCurrencies(metadata.currencies || []);

        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        if (profile.username) setUsername(profile.username);
        if (profile.countryId) setCountryId(profile.countryId);
        if (profile.currencyId) setCurrencyId(profile.currencyId);
        if (profile.profileImageUrl) setAvatar(profile.profileImageUrl);
      } catch {
        const metadata = await apiGet<UserMetadata>(API_ROUTES.metadata);
        setCountries(metadata.countries || []);
        setCurrencies(metadata.currencies || []);
      }
    })();
  }, []);

  const pickAvatar = async () => {
    setSubmitting(true);
    addToast('Uploading profile image...', 'info');
    try {
      const url = await pickAndUploadImage();
      if (!url) {
        return;
      }
      setAvatar(url);
      addToast('Profile image uploaded. Tap Save profile to apply.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to upload image.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async () => {
    setSubmitting(true);
    try {
      await apiPatch(API_ROUTES.auth.profile, {
        username: username.trim() || undefined,
        firstName,
        lastName: lastName || null,
        profileImageUrl: avatar || null,
        countryId: countryId || null,
        currencyId: currencyId || null,
      });
      updateUser({ username, firstName, lastName, avatar, countryId, currencyId });
      addToast('Profile updated.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length <= 6) {
      addToast('Password must be more than 6 characters.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiPatch(API_ROUTES.auth.profile, { oldPassword, newPassword });
      addToast('Password updated.', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Password update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <PageShell>
      <ScreenHeader title="Settings" subtitle="Profile, security, and preferences" />

      <MobileBillingSection />

      <Card className="mb-lg gap-md">
        <Text className="font-title-md font-bold text-primary">Profile</Text>

        <View className="items-center gap-sm">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="h-20 w-20 rounded-full border border-outline-variant bg-surface-container-low"
            />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low">
              <Text className="font-headline-sm font-bold text-on-surface-variant">
                {(firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <Button
            title={avatar ? 'Change photo' : 'Upload photo'}
            variant="secondary"
            loading={submitting}
            onPress={pickAvatar}
          />
        </View>

        <Input label="First name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} />
        <Input label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Input label="Email" value={user?.email || ''} editable={false} />
        <Input label="Phone" value={user?.phone || ''} editable={false} />

        <Text className="text-xs font-bold uppercase text-on-surface-variant">Country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
          {countries.map((c) => (
            <Button
              key={c.id}
              title={c.name}
              variant={countryId === c.id ? 'primary' : 'secondary'}
              onPress={() => setCountryId(c.id)}
              className="mr-sm mb-sm"
            />
          ))}
        </ScrollView>

        <Text className="text-xs font-bold uppercase text-on-surface-variant">Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
          {currencies.map((c) => (
            <Button
              key={c.id}
              title={`${c.code} (${c.symbol})`}
              variant={currencyId === c.id ? 'primary' : 'secondary'}
              onPress={() => setCurrencyId(c.id)}
              className="mr-sm mb-sm"
            />
          ))}
        </ScrollView>

        <Button title="Save profile" loading={submitting} onPress={saveProfile} />
      </Card>

      <Card className="mb-lg gap-md">
        <Text className="font-title-md font-bold text-primary">Security</Text>
        <Input label="Current password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
        <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <Button title="Update password" variant="secondary" loading={submitting} onPress={savePassword} />
      </Card>

      <Card className="mb-lg gap-sm">
        <Button
          title="Notifications"
          variant="secondary"
          onPress={() => router.push('/(app)/notifications')}
        />
        <Button title="Help Center" variant="secondary" onPress={() => router.push('/(app)/support')} />
        <Button title="Sign out" variant="danger" onPress={onLogout} className="mt-sm" />
      </Card>
    </PageShell>
  );
}
