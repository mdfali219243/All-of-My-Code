import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { mp4FallbackUrl, normalizeMediaUrl } from '../shared/mediaUrl';
import { useTheme } from '../contexts/ThemeContext';
import { radius, type ThemeColors } from '../shared/theme';

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

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.bgSecondary,
      overflow: 'hidden',
      borderRadius: radius.md,
      position: 'relative',
      width: '100%',
    },
    fill: {
      width: '100%',
      height: '100%',
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
      backgroundColor: colors.overlay,
    },
    errorBox: {
      flex: 1,
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
    },
    errorText: {
      color: colors.textDim,
      fontSize: 14,
    },
    errorLink: {
      color: colors.brandLight,
      fontWeight: '600',
      fontSize: 14,
    },
  });
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const videoRef = useRef<Video>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackSrc, setPlaybackSrc] = useState<string | null>(null);
  const triedFallback = useRef(false);
  const normalized = normalizeMediaUrl(uri) ?? uri;
  const fit = objectFit(resizeMode);

  useEffect(() => {
    setFailed(false);
    setLoading(true);
    setPlaybackSrc(normalized);
    triedFallback.current = false;
  }, [normalized]);

  function handleError() {
    const fallback = mp4FallbackUrl(playbackSrc ?? normalized);
    if (!triedFallback.current && fallback && fallback !== playbackSrc) {
      triedFallback.current = true;
      setLoading(true);
      setPlaybackSrc(fallback);
      return;
    }
    setLoading(false);
    setFailed(true);
  }

  if (Platform.OS === 'web') {
    const isLocalBlob = (playbackSrc ?? normalized).startsWith('blob:') || (playbackSrc ?? normalized).startsWith('data:');
    return (
      <View style={[styles.wrap, style]}>
        {!failed ? (
          <video
            key={playbackSrc ?? normalized}
            src={playbackSrc ?? normalized}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted || autoPlay}
            controls={nativeControls}
            playsInline
            preload="metadata"
            // crossOrigin breaks some blob: previews and is unnecessary for local blobs.
            {...(isLocalBlob ? {} : { crossOrigin: 'anonymous' as const })}
            onLoadedData={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 220,
              objectFit: fit,
              backgroundColor: colors.bgSecondary,
              display: 'block',
            }}
          />
        ) : (
          <View style={styles.errorBox}>
            <Ionicons name="videocam-off-outline" size={32} color={colors.textDim} />
            <Text style={styles.errorText}>Video could not load</Text>
            {!isLocalBlob ? (
              <Pressable onPress={() => Linking.openURL(playbackSrc ?? normalized)}>
                <Text style={styles.errorLink}>Open video file</Text>
              </Pressable>
            ) : (
              <Text style={styles.errorText}>Try Upload recording — the file is still on this device.</Text>
            )}
          </View>
        )}
        {loading && !failed ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandLight} />
          </View>
        ) : null}
      </View>
    );
  }

  const src = playbackSrc ?? normalized;

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
      <View style={[styles.wrap, style, styles.fill]}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brandLight} />
          </View>
        ) : null}
        <WebView
          source={{ html }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          onLoadEnd={() => setLoading(false)}
          onError={() => handleError()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style, styles.fill]}>
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.brandLight} />
        </View>
      ) : null}
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
        onError={() => handleError()}
      />
    </View>
  );
}
