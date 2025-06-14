import { Stack } from 'expo-router';
import { GuestGuard } from '../../components/AuthGuard';

export default function AuthLayout() {
  return (
    <GuestGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </GuestGuard>
  );
}
