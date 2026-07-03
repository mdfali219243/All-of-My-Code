import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useNotificationObserver } from '../notifications/useNotificationObserver';

function RootNavigator() {
  const { user } = useAuth();
  useNotificationObserver(Boolean(user));

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#18191a' } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
