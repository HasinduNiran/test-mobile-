import { AuthGuard } from '../components/AuthGuard';
import DashboardScreen from './screens/dashboard';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardScreen />
    </AuthGuard>
  );
}
