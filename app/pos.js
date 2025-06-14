import { View } from 'react-native';
import { AuthGuard } from '../components/AuthGuard';
import PosScreen from './screens/pos';

export default function Pos() {
  return (
    <AuthGuard>
      <View style={{ flex: 1 }}>
        <PosScreen />
      </View>
    </AuthGuard>
  );
}
