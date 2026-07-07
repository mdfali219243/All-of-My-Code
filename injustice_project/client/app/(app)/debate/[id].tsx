import { DebateScreen } from '../../../screens/DebateScreen';
import { RequireAuth } from '../../../components/RequireAuth';

export default function DebateRoute() {
  return (
    <RequireAuth>
      <DebateScreen />
    </RequireAuth>
  );
}
