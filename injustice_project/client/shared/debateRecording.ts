import { Platform } from 'react-native';

export type DebateRecorder = {
  stop: () => Promise<Blob | null>;
  onStopped: (callback: () => void) => void;
};

export type DebateRecordingError = 'unsupported' | 'denied' | 'failed';

export type DebateRecordingResult = {
  recorder: DebateRecorder | null;
  error?: DebateRecordingError;
};

/** Capture screen + audio while the host runs a live debate (web only). */
export async function startDebateRecording(): Promise<DebateRecordingResult> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return { recorder: null, error: 'unsupported' };
  }

  if (typeof MediaRecorder === 'undefined') {
    return { recorder: null, error: 'unsupported' };
  }

  try {
    const displayMediaOptions: DisplayMediaStreamOptions & { preferCurrentTab?: boolean } = {
      video: { displaySurface: 'browser' } as MediaTrackConstraints,
      audio: true,
      preferCurrentTab: true,
    };

    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

    const mimeType =
      ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) =>
        MediaRecorder.isTypeSupported(type),
      ) ?? 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    let stoppedCallback: (() => void) | null = null;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    for (const track of stream.getVideoTracks()) {
      track.onended = () => {
        stoppedCallback?.();
      };
    }

    recorder.start(1000);

    return {
      recorder: {
        onStopped: (callback) => {
          stoppedCallback = callback;
        },
        stop: () =>
          new Promise((resolve) => {
            recorder.onstop = () => {
              stream.getTracks().forEach((track) => track.stop());
              resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
            };
            if (recorder.state !== 'inactive') recorder.stop();
            else resolve(null);
          }),
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return { recorder: null, error: 'denied' };
    }
    return { recorder: null, error: 'failed' };
  }
}

export function recordingErrorMessage(error: DebateRecordingError): string {
  switch (error) {
    case 'unsupported':
      return 'Recording only works in Chrome or Edge on the web. Open this debate in a desktop browser.';
    case 'denied':
      return 'Screen capture was blocked. Choose this browser tab and allow audio when prompted so the debate can be saved.';
    default:
      return 'Could not start recording. Try Chrome on desktop and allow screen capture for this tab.';
  }
}
