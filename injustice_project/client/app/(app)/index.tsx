import { FeedScreen } from '../../screens/FeedScreen';
import { RequireAuth } from '../../components/RequireAuth';

export default function HomeRoute() {
  return (
    <RequireAuth>
      <FeedScreen />
    </RequireAuth>
  );
}
