import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useInboxBadge } from '../contexts/InboxBadgeContext';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTab } from '../shared/types';
import { spacing } from '../shared/theme';
import { Avatar } from './Avatar';
import { MenuButton } from './MenuButton';

type Props = {
  activeTab: AppTab;
};

export function AppHeader({ activeTab }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadTotal } = useInboxBadge();
  const router = useRouter();

  const tabs: {
    key: AppTab;
    href: '/(app)' | '/(app)/inbox' | '/(app)/reels';
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'feed', href: '/(app)', icon: 'home-outline', activeIcon: 'home' },
    { key: 'inbox', href: '/(app)/inbox', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
    { key: 'reels', href: '/(app)/reels', icon: 'play-circle-outline', activeIcon: 'play-circle' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.bar}>
        <View style={styles.left}>
          <MenuButton />
          <Pressable onPress={() => router.push('/(app)')}>
            <View style={[styles.logoBadge, { backgroundColor: colors.brand }]}>
              <Text style={styles.logoText}>In</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const showBadge = tab.key === 'inbox' && unreadTotal > 0;
            return (
              <Pressable
                key={tab.key}
                onPress={() => router.push(tab.href)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                accessibilityLabel={tab.key === 'inbox' && showBadge ? `Inbox, ${unreadTotal} unread` : tab.key}
              >
                <View>
                  <Ionicons
                    name={active ? tab.activeIcon : tab.icon}
                    size={26}
                    color={active ? colors.brandLight : colors.textDim}
                  />
                  {showBadge ? (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={styles.badgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                    </View>
                  ) : null}
                </View>
                {active ? <View style={[styles.tabIndicator, { backgroundColor: colors.brand }]} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.right}>
          <Pressable
            onPress={() => router.push('/(app)/search')}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceHover }]}
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => user && router.push(`/(app)/profile/${user.username}`)}>
            <Avatar name={user?.username ?? 'U'} size={36} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    borderBottomWidth: 1,
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  tabBtn: {
    width: 72,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  tabBtnActive: {},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
