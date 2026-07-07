import { Platform } from 'react-native';

export type DebateRecorder = {
  stop: () => Promise<Blob | null>;
};

/** Capture screen + audio while the host runs a live debate (web only). */
export async function startDebateRecording(): Promise<DebateRecorder | null> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.start(1000);

    return {
      stop: () =>
        new Promise((resolve) => {
          recorder.onstop = () => {
            stream.getTracks().forEach((track) => track.stop());
            resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
          };
          if (recorder.state !== 'inactive') recorder.stop();
          else resolve(null);
        }),
    };
  } catch {
    return null;
  }
}
