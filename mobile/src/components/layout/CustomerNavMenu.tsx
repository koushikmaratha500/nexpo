import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../ui/AppIcon';
import { BrandLogo } from '../brand/BrandLogo';
import { APP_TITLE, DRAWER_NAV } from '../../constants/navigation';
import { useNavMenu } from '../../context/NavMenuContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

export function CustomerNavMenu() {
  const { isOpen, closeMenu } = useNavMenu();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const translateX = useSharedValue(-PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      translateX.value = withTiming(0, { duration: 260 });
      backdropOpacity.value = withTiming(1, { duration: 260 });
      return;
    }

    if (!visible) {
      return;
    }

    translateX.value = withTiming(-PANEL_WIDTH, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setVisible)(false);
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 220 });
  }, [isOpen, visible, translateX, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const onNavigate = (href: string) => {
    closeMenu();
    router.push(href as never);
  };

  const onLogout = async () => {
    closeMenu();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={closeMenu}>
      <View className="flex-1 flex-row">
        <Animated.View
          style={[
            panelStyle,
            {
              width: PANEL_WIDTH,
              height: '100%',
            },
          ]}
          className="bg-surface-container-lowest shadow-2xl"
        >
          <View
            className="h-full"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          >
            <View className="border-b border-outline-variant/30 px-md pb-md pt-sm">
              <View className="flex-row items-center gap-3">
                <BrandLogo variant="icon" theme="mono" compact />
                <View className="flex-1">
                  <Text className="font-headline-sm text-headline-sm font-bold text-primary">{APP_TITLE}</Text>
                  <Text className="font-label-md text-label-md text-on-surface-variant">Menu</Text>
                </View>
              </View>
            </View>

            <ScrollView className="flex-1 px-sm py-sm" showsVerticalScrollIndicator={false}>
              {DRAWER_NAV.map((item) => (
                <Pressable
                  key={item.href}
                  onPress={() => onNavigate(item.href)}
                  className="mb-1 flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-surface-container-low"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-container">
                    <AppIcon name={item.icon} size={20} className="text-on-primary-container" />
                  </View>
                  <Text className="font-title-md text-title-md text-on-surface">{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View className="border-t border-outline-variant/30 px-md py-md">
              <Pressable
                onPress={onLogout}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-error-container/30'
                )}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-error-container">
                  <AppIcon name="logout" size={20} className="text-error" />
                </View>
                <Text className="font-title-md text-title-md text-error">Sign out</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}>
          <Pressable className="flex-1" onPress={closeMenu} accessibilityLabel="Close menu" />
        </Animated.View>
      </View>
    </Modal>
  );
}

export function HamburgerMenuButton() {
  const { openMenu } = useNavMenu();

  return (
    <Pressable
      onPress={openMenu}
      className="ml-4 rounded-full bg-surface-container-low p-2 active:bg-surface-container"
      accessibilityLabel="Open menu"
    >
      <AppIcon name="menu" size={22} className="text-on-surface-variant" />
    </Pressable>
  );
}
