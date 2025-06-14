import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export function AuthGuard({ children }) {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  
  if (!userToken) {
    return <Redirect href="/auth/login" />;
  }
  
  return <>{children}</>;
}

export function GuestGuard({ children }) {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  
  if (userToken) {
    return <Redirect href="/dashboard" />;
  }
  
  return <>{children}</>;
}
