import { PrivacyScreen } from '../../../screens/PrivacyScreen';
import { RequireAuth } from '../../../components/RequireAuth';

export default function PrivacyRoute() {
  return (
    <RequireAuth>
      <PrivacyScreen />
    </RequireAuth>
  );
}
