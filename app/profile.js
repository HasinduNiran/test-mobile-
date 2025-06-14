import { AuthGuard } from '../components/AuthGuard';
import ProfileScreen from './screens/profile';

export default function Profile() {
  return (
    <AuthGuard>
      <ProfileScreen />
    </AuthGuard>
  );
}
