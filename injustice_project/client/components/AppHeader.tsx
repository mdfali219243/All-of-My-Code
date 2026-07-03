import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import type { AppTab } from '../shared/types';
import { colors, spacing } from '../shared/theme';

type Props = {
  activeTab: AppTab;
};

export function AppHeader({ activeTab }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const tabs: { key: AppTab; href: '/(app)' | '/(app)/inbox' | '/(app)/reels'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'feed', href: '/(app)', icon: 'chatbubbles' },
    { key: 'inbox', href: '/(app)/inbox', icon: 'chatbox-ellipses-outline' },
    { key: 'reels', href: '/(app)/reels', icon: 'videocam-outline' },
  ];

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <Pressable style={styles.left} onPress={() => router.push('/(app)')}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>In</Text>
          </View>
        </Pressable>

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => router.push(tab.href)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Ionicons name={tab.icon} size={26} color={active ? colors.brandLight : colors.textDim} />
                {active ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.right}>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
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
    backgroundColor: colors.brand,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceHover,
  },
  logoutText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
});
