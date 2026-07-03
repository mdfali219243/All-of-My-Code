import { Redirect } from 'expo-router';

import { DebateScreen } from '../../../screens/DebateScreen';
import { useAuth } from '../../../contexts/AuthContext';

export default function DebateRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <DebateScreen />;
}
