import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { createElement, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, spacing } from '../shared/theme';

// meet.jit.si requires OAuth login to become moderator; lobby cannot be disabled client-side.
// jitsi.riot.im grants moderator to the first joiner without Jitsi login (matches Django debate_room.html).
const JITSI_DOMAIN = process.env.EXPO_PUBLIC_JITSI_DOMAIN ?? 'jitsi.riot.im';

const HOST_TOOLBAR = [
  'microphone',
  'camera',
  'desktop',
  'fullscreen',
  'hangup',
  'chat',
  'raisehand',
  'tileview',
  'participants-pane',
  'mute-everyone',
  'settings',
];

const SPECTATOR_TOOLBAR = ['chat', 'fullscreen', 'hangup', 'tileview', 'raisehand'];

export function getJitsiRoomName(roomId: number) {
  return `InjusticeDebate${roomId}`;
}

function buildConfigOverwrite(isHost: boolean) {
  return {
    prejoinPageEnabled: false,
    prejoinConfig: { enabled: false },
    requireDisplayName: false,
    enableWelcomePage: false,
    enableLobby: false,
    lobby: { enabled: false, autoKnock: false, enableChat: false },
    enableLobbyChat: false,
    hideLobbyButton: true,
    disableDeepLinking: true,
    enableUserRolesBasedOnToken: false,
    startWithAudioMuted: !isHost,
    startWithVideoMuted: !isHost,
    disableReactions: !isHost,
  };
}

function buildInterfaceConfigOverwrite(isHost: boolean) {
  return {
    TOOLBAR_BUTTONS: isHost ? HOST_TOOLBAR : SPECTATOR_TOOLBAR,
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    HIDE_INVITE_MORE_HEADER: true,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
  };
}

function configToHashParams(isHost: boolean) {
  const config = buildConfigOverwrite(isHost);
  const muted = isHost ? 'false' : 'true';
  return (
    `#config.prejoinPageEnabled=false` +
    `&config.prejoinConfig.enabled=false` +
    `&config.requireDisplayName=false` +
    `&config.enableWelcomePage=false` +
    `&config.enableLobby=false` +
    `&config.lobby.enabled=false` +
    `&config.lobby.autoKnock=false` +
    `&config.enableLobbyChat=false` +
    `&config.hideLobbyButton=true` +
    `&config.disableDeepLinking=true` +
    `&config.enableUserRolesBasedOnToken=false` +
    `&config.startWithAudioMuted=${muted}` +
    `&config.startWithVideoMuted=${muted}` +
    `&config.disableReactions=${isHost ? 'false' : 'true'}`
  );
}

export function getJitsiUrl(roomId: number, isHost = false, displayName?: string) {
  const room = getJitsiRoomName(roomId);
  const nameParam = displayName ? `&userInfo.displayName="${encodeURIComponent(displayName)}"` : '';
  return `https://${JITSI_DOMAIN}/${room}${configToHashParams(isHost)}${nameParam}`;
}

export type JitsiParticipant = {
  id: string;
  displayName: string;
};

export type JitsiApi = {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addEventListener: (event: string, listener: (payload: unknown) => void) => void;
  removeEventListener: (event: string, listener: (payload: unknown) => void) => void;
  getParticipantsInfo?: () => Array<{ participantId: string; displayName: string }>;
  getMyUserId?: () => string;
  getDisplayName?: () => string;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

function activateHostRoom(api: JitsiApi) {
  const disableLobby = () => {
    try {
      api.executeCommand('toggleLobby', false);
    } catch {
      /* lobby may already be off or user not yet moderator */
    }
  };

  disableLobby();

  const myId = api.getMyUserId?.();
  if (myId) {
    try {
      api.executeCommand('grantModerator', myId);
    } catch {
      /* grantModerator requires moderator rights on some servers */
    }
  }

  // Retry after role assignment settles (first joiner on community servers).
  window.setTimeout(disableLobby, 500);
  window.setTimeout(disableLobby, 2000);
}

function buildJitsiOptions(
  roomId: number,
  parentNode: HTMLElement,
  displayName: string | undefined,
  isHost: boolean,
) {
  return {
    roomName: getJitsiRoomName(roomId),
    parentNode,
    width: '100%',
    height: '100%',
    userInfo: displayName ? { displayName } : undefined,
    configOverwrite: buildConfigOverwrite(isHost),
    interfaceConfigOverwrite: buildInterfaceConfigOverwrite(isHost),
  };
}

type Props = {
  roomId: number;
  displayName?: string;
  isHost?: boolean;
  onApiReady?: (api: JitsiApi | null) => void;
};

function WebJitsiEmbed({ roomId, displayName, isHost = false, onApiReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const onApiReadyRef = useRef(onApiReady);
  const displayNameRef = useRef(displayName);
  const url = getJitsiUrl(roomId, isHost, displayName);

  onApiReadyRef.current = onApiReady;
  displayNameRef.current = displayName;

  useEffect(() => {
    const parentNode = hostRef.current;
    if (!parentNode) return;

    let cancelled = false;
    parentNode.innerHTML = '';

    const mount = () => {
      if (cancelled || !window.JitsiMeetExternalAPI || !hostRef.current) return;
      apiRef.current?.dispose();
      const api = new window.JitsiMeetExternalAPI(
        JITSI_DOMAIN,
        buildJitsiOptions(roomId, hostRef.current, displayNameRef.current, isHost),
      );
      apiRef.current = api;

      if (isHost) {
        const onHostReady = () => activateHostRoom(api);
        api.addEventListener('videoConferenceJoined', onHostReady);
        api.addEventListener('participantRoleChanged', onHostReady);
      }

      onApiReadyRef.current?.(api);
    };

    if (window.JitsiMeetExternalAPI) {
      mount();
    } else {
      const script = document.createElement('script');
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = mount;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      onApiReadyRef.current?.(null);
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomId, isHost]);

  return (
    <View style={styles.container}>
      {createElement('div', {
        ref: hostRef,
        style: { flex: 1, width: '100%', height: '100%', minHeight: 360, background: '#000' },
      })}
      <Pressable style={styles.fallbackBtn} onPress={() => Linking.openURL(url)}>
        <Ionicons name="open-outline" size={16} color={colors.white} />
        <Text style={styles.fallbackText}>Open video in new tab</Text>
      </Pressable>
    </View>
  );
}

export function JitsiEmbed({ roomId, displayName, isHost = false, onApiReady }: Props) {
  if (Platform.OS === 'web') {
    return (
      <WebJitsiEmbed
        roomId={roomId}
        displayName={displayName}
        isHost={isHost}
        onApiReady={onApiReady}
      />
    );
  }

  return (
    <WebView
      source={{ uri: getJitsiUrl(roomId, isHost, displayName) }}
      style={styles.webview}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mediaCapturePermissionGrantType="grant"
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fallbackText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
