import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fetchShareContacts, shareToDm, shareToFeed } from '../api/social';
import type { ShareContact } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

type Props = {
  visible: boolean;
  postId: number;
  onClose: () => void;
  onShared: () => void;
};

export function ShareModal({ visible, postId, onClose, onShared }: Props) {
  const [contacts, setContacts] = useState<ShareContact[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadContacts() {
    try {
      const data = await fetchShareContacts();
      setContacts(data);
    } catch {
      setContacts([]);
    }
  }

  function handleShow() {
    loadContacts();
  }

  async function handleShareFeed() {
    setLoading(true);
    try {
      const result = await shareToFeed(postId);
      Alert.alert('Shared', result.message);
      onShared();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not share');
    } finally {
      setLoading(false);
    }
  }

  async function handleShareDm(username: string) {
    setLoading(true);
    try {
      const result = await shareToDm(postId, username);
      Alert.alert('Sent', result.message);
      onShared();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not send');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={handleShow}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Share post</Text>

          <Pressable style={styles.option} onPress={handleShareFeed} disabled={loading}>
            <Ionicons name="person-circle-outline" size={22} color={colors.brandLight} />
            <Text style={styles.optionText}>Share to your profile</Text>
          </Pressable>

          {contacts.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Send in a message</Text>
              {contacts.map((c) => (
                <Pressable
                  key={c.username}
                  style={styles.option}
                  onPress={() => handleShareDm(c.username)}
                  disabled={loading}
                >
                  <Ionicons name="paper-plane-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.optionText}>{c.display_name}</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { color: colors.text, fontSize: 16 },
  cancelBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: { color: colors.textDim, fontWeight: '600' },
});
