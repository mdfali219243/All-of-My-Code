import { InboxScreen } from '../../../screens/InboxScreen';
import { RequireAuth } from '../../../components/RequireAuth';

export default function InboxRoute() {
  return (
    <RequireAuth>
      <InboxScreen />
    </RequireAuth>
  );
}
