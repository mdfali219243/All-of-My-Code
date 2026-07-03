import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function handleNotificationNavigation(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined,
) {
  if (!data) return;

  if (data.type === 'dm' && typeof data.username === 'string') {
    router.push(`/(app)/inbox/${data.username}`);
    return;
  }

  if (data.type === 'debate' && data.room_id) {
    router.push(`/(app)/debate/${data.room_id}`);
  }
}

export function useNotificationObserver(userLoggedIn: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' || !userLoggedIn) return;

    let subscription: { remove: () => void } | undefined;

    async function setup() {
      const Notifications = await import('expo-notifications');

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        handleNotificationNavigation(
          router,
          last.notification.request.content.data as Record<string, unknown>,
        );
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(
          router,
          response.notification.request.content.data as Record<string, unknown>,
        );
      });
    }

    setup().catch(() => {
      // push APIs unavailable on this platform
    });

    return () => subscription?.remove();
  }, [router, userLoggedIn]);
}
