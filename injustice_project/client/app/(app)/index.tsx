import { Redirect } from 'expo-router';

import { FeedScreen } from '../../screens/FeedScreen';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <FeedScreen />;
}
