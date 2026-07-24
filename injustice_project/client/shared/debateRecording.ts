import { Platform } from 'react-native';

export type DebateRecorder = {
  stop: () => Promise<Blob | null>;
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  getMimeType: () => string;
  getChunkCount: () => number;
  onStopped: (callback: () => void) => void;
};

export type DebateRecordingError = 'unsupported' | 'denied' | 'failed' | 'empty';

export type DebateRecordingResult = {
  recorder: DebateRecorder | null;
  error?: DebateRecordingError;
};

const IDB_NAME = 'injustice-debate-recordings';
const IDB_STORE = 'recordings';
const IDB_VERSION = 1;

type DisplayMediaOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
};

/** True when this browser can capture a tab with MediaRecorder (desktop Chrome/Edge). */
export function isDebateRecordingSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  // Prefer real browser capability over Platform.OS — Expo web is 'web', but
  // capability checks also cover odd RN-web builds where Platform is wrong.
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
    return false;
  }
  // Native iOS/Android shells do not support tab capture even if APIs are stubbed.
  if (Platform.OS === 'ios' || Platform.OS === 'android') return false;
  return true;
}

function pickMimeType(): string | undefined {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function createMediaRecorder(stream: MediaStream): { recorder: MediaRecorder; mimeType: string } {
  const mimeType = pickMimeType();
  try {
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 })
      : new MediaRecorder(stream, { videoBitsPerSecond: 2_500_000 });
    return { recorder, mimeType: recorder.mimeType || mimeType || 'video/webm' };
  } catch {
    const recorder = new MediaRecorder(stream);
    return { recorder, mimeType: recorder.mimeType || 'video/webm' };
  }
}

function openRecordingDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

/** Persist a recording blob locally so review works even if upload fails. */
export async function saveRecordingBackup(roomId: number, blob: Blob): Promise<void> {
  if (typeof indexedDB === 'undefined' || !blob.size) return;
  try {
    const db = await openRecordingDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
      tx.objectStore(IDB_STORE).put(
        { blob, mimeType: blob.type, savedAt: Date.now() },
        String(roomId),
      );
    });
    db.close();
  } catch {
    /* best-effort backup */
  }
}

export async function loadRecordingBackup(roomId: number): Promise<Blob | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openRecordingDb();
    const row = await new Promise<{ blob: Blob } | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(String(roomId));
      req.onsuccess = () => resolve(req.result as { blob: Blob } | undefined);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    });
    db.close();
    return row?.blob?.size ? row.blob : null;
  } catch {
    return null;
  }
}

export async function clearRecordingBackup(roomId: number): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openRecordingDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
      tx.objectStore(IDB_STORE).delete(String(roomId));
    });
    db.close();
  } catch {
    /* ignore */
  }
}

async function buildRecordingStream(displayStream: MediaStream): Promise<{
  stream: MediaStream;
  cleanup: () => void;
}> {
  const cleanups: Array<() => void> = [];
  const videoTracks = displayStream.getVideoTracks();
  const displayAudio = displayStream.getAudioTracks();

  let micStream: MediaStream | null = null;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    cleanups.push(() => micStream?.getTracks().forEach((t) => t.stop()));
  } catch {
    /* mic may already be held by Jitsi; tab audio alone may still work */
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx || (!displayAudio.length && !micStream)) {
    return {
      stream: displayStream,
      cleanup: () => {
        cleanups.forEach((fn) => fn());
      },
    };
  }

  const audioContext = new AudioCtx();
  const destination = audioContext.createMediaStreamDestination();

  const connectTrack = (track: MediaStreamTrack) => {
    try {
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      source.connect(destination);
    } catch {
      /* skip unusable track */
    }
  };

  displayAudio.forEach(connectTrack);
  micStream?.getAudioTracks().forEach(connectTrack);

  cleanups.push(() => {
    void audioContext.close().catch(() => {});
  });

  const mixedAudio = destination.stream.getAudioTracks();
  const stream = new MediaStream([
    ...videoTracks,
    ...(mixedAudio.length ? mixedAudio : displayAudio),
  ]);

  return {
    stream,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };
}

async function requestDisplayStream(): Promise<MediaStream> {
  const preferred: DisplayMediaOptions = {
    video: {
      displaySurface: 'browser',
      frameRate: 30,
    } as MediaTrackConstraints,
    audio: true,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    systemAudio: 'include',
    monitorTypeSurfaces: 'exclude',
    surfaceSwitching: 'exclude',
  };

  try {
    return await navigator.mediaDevices.getDisplayMedia(preferred);
  } catch (err) {
    // Some browsers reject the richer Chrome-only constraints — retry minimal options.
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
      throw err;
    }
    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  }
}

/**
 * Capture the debate tab (video) + tab/system audio, mixed with the host mic when available.
 * Prefer calling from a user gesture; some browsers deny getDisplayMedia otherwise.
 */
export async function startDebateRecording(roomId?: number): Promise<DebateRecordingResult> {
  if (!isDebateRecordingSupported()) {
    return { recorder: null, error: 'unsupported' };
  }

  try {
    const displayStream = await requestDisplayStream();
    const { stream, cleanup } = await buildRecordingStream(displayStream);
    const { recorder, mimeType } = createMediaRecorder(stream);
    const chunks: Blob[] = [];
    let stoppedCallback: (() => void) | null = null;
    let backupTimer: ReturnType<typeof setInterval> | null = null;
    let finalized = false;

    const persistBackup = () => {
      if (roomId == null || !chunks.length) return;
      const blob = new Blob(chunks, { type: mimeType });
      void saveRecordingBackup(roomId, blob);
    };

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        // Persist promptly so a mid-session crash still leaves a usable draft.
        if (roomId != null && chunks.length % 5 === 0) {
          persistBackup();
        }
      }
    };

    for (const track of displayStream.getVideoTracks()) {
      track.onended = () => {
        if (recorder.state !== 'inactive') {
          try {
            recorder.requestData();
          } catch {
            /* ignore */
          }
          try {
            recorder.stop();
          } catch {
            /* ignore */
          }
        }
        stoppedCallback?.();
      };
    }

    // Timeslice keeps chunks flowing so IndexedDB backups are never empty.
    recorder.start(1000);
    backupTimer = setInterval(persistBackup, 5000);

    const finalize = (): Blob | null => {
      if (finalized) {
        if (!chunks.length) return null;
        const existing = new Blob(chunks, { type: mimeType });
        return existing.size > 0 ? existing : null;
      }
      finalized = true;
      if (backupTimer) {
        clearInterval(backupTimer);
        backupTimer = null;
      }
      cleanup();
      displayStream.getTracks().forEach((track) => track.stop());
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          /* already stopped */
        }
      });
      if (!chunks.length) return null;
      const blob = new Blob(chunks, { type: mimeType });
      if (roomId != null && blob.size > 0) {
        void saveRecordingBackup(roomId, blob);
      }
      return blob.size > 0 ? blob : null;
    };

    return {
      recorder: {
        getMimeType: () => mimeType,
        getChunkCount: () => chunks.length,
        onStopped: (callback) => {
          stoppedCallback = callback;
        },
        pause: () => {
          if (recorder.state === 'recording') recorder.pause();
        },
        resume: () => {
          if (recorder.state === 'paused') recorder.resume();
        },
        isPaused: () => recorder.state === 'paused',
        stop: () =>
          new Promise((resolve) => {
            if (recorder.state === 'inactive') {
              resolve(finalize());
              return;
            }
            recorder.onstop = () => {
              resolve(finalize());
            };
            try {
              recorder.requestData();
            } catch {
              /* unsupported */
            }
            recorder.stop();
          }),
      },
    };
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
      return { recorder: null, error: 'denied' };
    }
    return { recorder: null, error: 'failed' };
  }
}

export function recordingErrorMessage(error: DebateRecordingError): string {
  switch (error) {
    case 'unsupported':
      return 'Recording only works in Chrome or Edge on desktop web. Open this debate in a desktop browser — the mobile app cannot capture the meeting yet.';
    case 'denied':
      return 'Screen capture is required. Click “Start screen recording”, choose This tab / this browser tab, and enable “Share tab audio” (or Allow).';
    case 'empty':
      return 'Recording started but captured no video data. Retry screen capture and keep this tab selected until you end the debate.';
    default:
      return 'Could not start recording. Use Chrome or Edge on desktop, click Start screen recording, and allow capture of this tab with audio.';
  }
}
