import { Redirect } from 'expo-router';

import { ProfileScreen } from '../../../screens/ProfileScreen';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ProfileScreen />;
}
