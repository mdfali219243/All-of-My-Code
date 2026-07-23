import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { JitsiApi, JitsiParticipant } from './JitsiEmbed';
import { confirmDestructive, showAlert } from '../shared/confirm';
import { colors, radius, spacing } from '../shared/theme';

type Props = {
  jitsiApi: JitsiApi | null;
  onEndDebate: () => Promise<void>;
  onRetryRecording?: () => void;
  onToggleRecordingPause?: () => void;
  ending: boolean;
  recording?: boolean;
  recordingPaused?: boolean;
  recordingError?: string;
};

export function DebateHostPanel({
  jitsiApi,
  onEndDebate,
  onRetryRecording,
  onToggleRecordingPause,
  ending,
  recording,
  recordingPaused,
  recordingError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<JitsiParticipant[]>([]);

  const refreshParticipants = useCallback(() => {
    if (!jitsiApi?.getParticipantsInfo) return;

    const myId = jitsiApi.getMyUserId?.();
    const seen = new Set<string>();
    const list: JitsiParticipant[] = [];

    const localName = jitsiApi.getDisplayName?.();
    if (localName) {
      list.push({ id: myId ?? 'local', displayName: `${localName} (You)` });
      seen.add(myId ?? localName);
    }

    for (const p of jitsiApi.getParticipantsInfo()) {
      if (myId && p.participantId === myId) continue;
      if (seen.has(p.participantId)) continue;
      seen.add(p.participantId);
      list.push({
        id: p.participantId,
        displayName: p.displayName || 'Guest',
      });
    }

    setParticipants(list);
  }, [jitsiApi]);

  useEffect(() => {
    if (!jitsiApi || Platform.OS !== 'web') return;

    const onJoined = () => refreshParticipants();
    const onLeft = () => refreshParticipants();

    jitsiApi.addEventListener('participantJoined', onJoined);
    jitsiApi.addEventListener('participantLeft', onLeft);
    jitsiApi.addEventListener('videoConferenceJoined', onJoined);

    refreshParticipants();

    return () => {
      jitsiApi.removeEventListener('participantJoined', onJoined);
      jitsiApi.removeEventListener('participantLeft', onLeft);
      jitsiApi.removeEventListener('videoConferenceJoined', onJoined);
    };
  }, [jitsiApi, refreshParticipants]);

  function runCommand(label: string, command: string, ...args: unknown[]) {
    if (!jitsiApi) {
      showAlert('Host controls', 'Join the video room first (web) or use Jitsi toolbar on mobile.');
      return;
    }
    try {
      jitsiApi.executeCommand(command, ...args);
    } catch (e) {
      showAlert(label, e instanceof Error ? e.message : 'Command failed');
    }
  }

  async function confirmEnd() {
    const confirmed = await confirmDestructive(
      'End debate?',
      'Everyone will be removed and the room will close.',
      'End debate',
    );
    if (!confirmed) return;

    await onEndDebate();
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.toggle} onPress={() => setOpen((v) => !v)}>
        <Ionicons name="shield-checkmark" size={18} color={colors.white} />
        <Text style={styles.toggleText}>Host controls</Text>
        <Ionicons name={open ? 'chevron-down' : 'chevron-up'} size={16} color={colors.white} />
      </Pressable>

      {open ? (
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
          <Text style={styles.hint}>
            {recording
              ? recordingPaused
                ? 'Recording is paused. Resume or end the debate to review and publish your video.'
                : 'Recording is on. End the debate to review your video before posting to the feed.'
              : recordingError
                ? recordingError
                : 'You are the debate host and join automatically — no need to sign in again in the video room.'}
          </Text>

          {recording && onToggleRecordingPause ? (
            <Pressable style={styles.btn} onPress={onToggleRecordingPause}>
              <Text style={styles.btnText}>{recordingPaused ? 'Resume recording' : 'Pause recording'}</Text>
            </Pressable>
          ) : null}

          {recordingError && onRetryRecording ? (
            <Pressable style={styles.btn} onPress={onRetryRecording}>
              <Text style={styles.btnText}>Retry recording</Text>
            </Pressable>
          ) : null}

          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => runCommand('Mute all', 'muteEveryone')}>
              <Text style={styles.btnText}>Mute all</Text>
            </Pressable>
            <Pressable
              style={styles.btn}
              onPress={() => runCommand('Turn off lobby', 'toggleLobby', false)}
            >
              <Text style={styles.btnText}>Open room</Text>
            </Pressable>
          </View>

          {Platform.OS === 'web' && participants.length > 0 ? (
            <View style={styles.participantBlock}>
              <Text style={styles.sectionTitle}>Participants</Text>
              {participants.map((p) => (
                <View key={p.id} style={styles.participantRow}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.displayName}
                  </Text>
                  <View style={styles.participantActions}>
                    <Pressable
                      style={styles.smallBtn}
                      onPress={() => runCommand('Mute', 'muteParticipant', p.id)}
                    >
                      <Text style={styles.smallBtnText}>Mute</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, styles.kickBtn]}
                      onPress={() => runCommand('Kick', 'kickParticipant', p.id)}
                    >
                      <Text style={styles.smallBtnText}>Kick</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[styles.endBtn, ending && styles.endBtnDisabled]}
            disabled={ending}
            onPress={() => void confirmEnd()}
          >
            <Text style={styles.endBtnText}>{ending ? 'Ending…' : 'End debate for everyone'}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#4338ca',
  },
  toggleText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  panel: { maxHeight: 220 },
  panelContent: { padding: spacing.md, gap: spacing.sm },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  participantBlock: { gap: spacing.xs },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  participantName: { flex: 1, color: colors.text, fontSize: 14 },
  participantActions: { flexDirection: 'row', gap: 6 },
  smallBtn: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kickBtn: { backgroundColor: '#7f1d1d' },
  smallBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  endBtn: {
    backgroundColor: '#dc2626',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  endBtnDisabled: { opacity: 0.6 },
  endBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
