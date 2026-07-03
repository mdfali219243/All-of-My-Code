import { useCallback, useEffect, useRef } from 'react';

import { WS_BASE_URL } from './config';
import { getAccessToken } from './storage';
import type { DebateMessage, DirectMessage } from '../shared/types';

type SocketStatus = 'connecting' | 'open' | 'closed';

function useReconnectingSocket(
  path: string | null,
  onPayload: (data: Record<string, unknown>) => void,
  enabled = true,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  const connect = useCallback(async () => {
    if (!path || !enabled) return;

    const token = await getAccessToken();
    if (!token) return;

    const url = `${WS_BASE_URL}${path}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as Record<string, unknown>;
        onPayloadRef.current(data);
      } catch {
        // ignore malformed payloads
      }
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 3000);
    };
  }, [path, enabled]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const status: SocketStatus =
    wsRef.current?.readyState === WebSocket.OPEN
      ? 'open'
      : wsRef.current?.readyState === WebSocket.CONNECTING
        ? 'connecting'
        : 'closed';

  return { sendJson, status };
}

export function useInboxSocket(
  username: string | undefined,
  onMessage: (message: DirectMessage) => void,
  enabled = true,
) {
  const path = username ? `/ws/inbox/${encodeURIComponent(username)}/` : null;

  const { sendJson } = useReconnectingSocket(
    path,
    (data) => {
      if (data.type === 'message' && data.message) {
        onMessage(data.message as DirectMessage);
      }
    },
    enabled,
  );

  const sendText = useCallback(
    (text: string) => sendJson({ type: 'message', text }),
    [sendJson],
  );

  return { sendText };
}

export function useInboxListSocket(onPreview: (preview: Record<string, unknown>) => void, enabled = true) {
  useReconnectingSocket(
    enabled ? '/ws/inbox/' : null,
    (data) => {
      if (data.type === 'inbox_preview' && data.preview) {
        onPreview(data.preview as Record<string, unknown>);
      }
    },
    enabled,
  );
}

export function useDebateSocket(
  roomId: number | undefined,
  onMessage: (message: DebateMessage) => void,
  enabled = true,
) {
  const path = roomId ? `/ws/debate/${roomId}/` : null;

  const { sendJson } = useReconnectingSocket(
    path,
    (data) => {
      if (data.type === 'message' && data.message) {
        onMessage(data.message as DebateMessage);
      }
    },
    enabled,
  );

  const sendText = useCallback(
    (text: string) => sendJson({ type: 'message', text }),
    [sendJson],
  );

  return { sendText };
}
