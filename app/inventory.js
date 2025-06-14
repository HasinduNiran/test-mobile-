import { AuthGuard } from '../components/AuthGuard';
import InventoryScreen from './screens/inventory';

export default function Inventory() {
  return (
    <AuthGuard>
      <InventoryScreen />
    </AuthGuard>
  );
}
