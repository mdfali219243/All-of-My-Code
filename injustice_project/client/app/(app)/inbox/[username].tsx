import { ChatScreen } from '../../../screens/ChatScreen';
import { RequireAuth } from '../../../components/RequireAuth';

export default function ChatRoute() {
  return (
    <RequireAuth>
      <ChatScreen />
    </RequireAuth>
  );
}
