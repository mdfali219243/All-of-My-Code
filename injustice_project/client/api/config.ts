import { Platform } from 'react-native';

// Django API — same backend for website + mobile app
const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${LOCAL_HOST}:8000/api`;
