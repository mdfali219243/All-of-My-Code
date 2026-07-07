import { ProfileScreen } from '../../../screens/ProfileScreen';
import { RequireAuth } from '../../../components/RequireAuth';

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <ProfileScreen />
    </RequireAuth>
  );
}
