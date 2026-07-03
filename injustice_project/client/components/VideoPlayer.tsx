import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { normalizeMediaUrl } from '../shared/mediaUrl';
import { colors, radius } from '../shared/theme';

type Props = {
  uri: string;
  style?: ViewStyle;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  nativeControls?: boolean;
  resizeMode?: ResizeMode;
};

function objectFit(resizeMode: ResizeMode = ResizeMode.CONTAIN) {
  return resizeMode === ResizeMode.COVER ? 'cover' : 'contain';
}

export function VideoPlayer({
  uri,
  style,
  autoPlay = false,
  loop = false,
  muted = false,
  nativeControls = true,
  resizeMode = ResizeMode.CONTAIN,
}: Props) {
  const videoRef = useRef<Video>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const src = normalizeMediaUrl(uri) ?? uri;
  const fit = objectFit(resizeMode);

  useEffect(() => {
    setFailed(false);
    setLoading(true);
  }, [src]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        <video
          src={src}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted || autoPlay}
          controls={nativeControls}
          playsInline
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fit,
            backgroundColor: colors.bgSecondary,
            display: 'block',
          }}
        />
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandLight} />
          </View>
        ) : null}
      </View>
    );
  }

  if (Platform.OS === 'ios' || failed) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #18191a; }
            video {
              width: 100%;
              height: 100%;
              object-fit: ${fit};
              background: #18191a;
            }
          </style>
        </head>
        <body>
          <video
            src="${src}"
            ${nativeControls ? 'controls' : ''}
            playsinline
            webkit-playsinline
            ${autoPlay ? 'autoplay muted' : ''}
            ${loop ? 'loop' : ''}
            ${muted ? 'muted' : ''}
          ></video>
        </body>
      </html>
    `;

    return (
      <View style={[styles.wrap, style]}>
        <WebView
          source={{ html }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandLight} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Video
        ref={videoRef}
        source={{ uri: src }}
        style={styles.videoFill}
        resizeMode={resizeMode}
        useNativeControls={nativeControls}
        isLooping={loop}
        isMuted={muted}
        shouldPlay={autoPlay}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.brandLight} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgSecondary,
    overflow: 'hidden',
    borderRadius: radius.md,
    position: 'relative',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgSecondary,
  },
  videoFill: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
