import { Redirect } from 'expo-router';

import { InboxScreen } from '../../../screens/InboxScreen';
import { useAuth } from '../../../contexts/AuthContext';

export default function InboxRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <InboxScreen />;
}
