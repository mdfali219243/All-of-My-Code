import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useMenu } from '../contexts/MenuContext';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../shared/theme';

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/(app)/about' | '/(app)/faq' | '/(app)/feedback' | '/(app)/theme';
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'about', label: 'About', icon: 'information-circle-outline', href: '/(app)/about' },
  { key: 'faq', label: 'Q&A', icon: 'help-circle-outline', href: '/(app)/faq' },
  { key: 'feedback', label: 'Feedback', icon: 'chatbox-outline', href: '/(app)/feedback' },
  { key: 'theme', label: 'Theme', icon: 'color-palette-outline', href: '/(app)/theme' },
];

export function AppSidebar() {
  const { open, closeMenu } = useMenu();
  const { logout } = useAuth();
  const { colors, mode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(300, width * 0.82);
  const slide = useRef(new Animated.Value(-panelWidth)).current;

  async function handleLogout() {
    closeMenu();
    await logout();
    router.replace('/login');
  }

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 0 : -panelWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, panelWidth, slide]);

  function navigate(href: MenuItem['href']) {
    closeMenu();
    router.push(href);
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
      <View style={styles.root}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={closeMenu} />
        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: colors.brand }]}>
              <Text style={styles.logoText}>In</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.brandName, { color: colors.text }]}>Project Injustice</Text>
              <Text style={[styles.brandTag, { color: colors.textMuted }]}>Menu</Text>
            </View>
            <Pressable onPress={closeMenu} style={[styles.closeBtn, { backgroundColor: colors.surfaceHover }]}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.items}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.href)}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: pressed ? colors.surfaceHover : 'transparent' },
                ]}
              >
                <View style={[styles.itemIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={item.icon} size={20} color={colors.brandLight} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
            ))}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.footerMeta}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={16}
                color={colors.textDim}
              />
              <Text style={[styles.footerText, { color: colors.textDim }]}>
                {mode === 'dark' ? 'Dark mode' : 'Light mode'} active
              </Text>
            </View>
            <Pressable
              onPress={() => void handleLogout()}
              style={({ pressed }) => [
                styles.logoutBtn,
                { backgroundColor: pressed ? colors.errorBg : colors.surfaceHover },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>Log out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  headerText: {
    flex: 1,
  },
  brandName: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  brandTag: {
    fontSize: 13,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
