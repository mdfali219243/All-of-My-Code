import { Redirect } from 'expo-router';

import { ReelsScreen } from '../../screens/ReelsScreen';
import { useAuth } from '../../contexts/AuthContext';

export default function ReelsRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ReelsScreen />;
}
