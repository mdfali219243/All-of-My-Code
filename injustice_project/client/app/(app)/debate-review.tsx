import { DebateReviewScreen } from '../../screens/DebateReviewScreen';
import { RequireAuth } from '../../components/RequireAuth';

export default function DebateReviewRoute() {
  return (
    <RequireAuth>
      <DebateReviewScreen />
    </RequireAuth>
  );
}
