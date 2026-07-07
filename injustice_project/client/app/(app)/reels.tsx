import { ReelsScreen } from '../../screens/ReelsScreen';
import { RequireAuth } from '../../components/RequireAuth';

export default function ReelsRoute() {
  return (
    <RequireAuth>
      <ReelsScreen />
    </RequireAuth>
  );
}
