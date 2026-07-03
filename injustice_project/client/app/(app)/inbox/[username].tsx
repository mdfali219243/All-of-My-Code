import { Redirect } from 'expo-router';

import { ChatScreen } from '../../../screens/ChatScreen';
import { useAuth } from '../../../contexts/AuthContext';

export default function ChatRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ChatScreen />;
}
