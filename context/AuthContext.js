import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Dynamically set API_URL based on platform and environment
let API_URL;

// IMPORTANT: For physical devices, use your computer's actual local network IP address
// To find your IP: Open command prompt and type 'ipconfig' and look for IPv4 Address
// For example: const YOUR_LOCAL_IP = "192.168.1.5";
const YOUR_LOCAL_IP = "192.168.8.103"; // Replace with your actual local IP

// Check if running in an emulator or on a physical device
if (Platform.OS === 'android') {
  // Check if running in an emulator
  const isEmulator = !global.HermesInternal && !!global.nativeCallSyncHook; // Basic detection
  
  if (isEmulator) {
    // 10.0.2.2 is the special IP for Android emulator to reach host machine's localhost
    API_URL = 'http://10.0.2.2:5000/api';
  } else {
    // For physical Android devices, use your computer's actual LAN IP
    API_URL = `http://${YOUR_LOCAL_IP}:5000/api`;
  }
} else if (Platform.OS === 'ios') {
  // For iOS simulator
  API_URL = 'http://localhost:5000/api';
} else {
  // Web environment
  API_URL = 'http://localhost:5000/api';
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const register = async (username, email, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Import checkServerConnection function
      const { checkServerConnection } = require('../utils/api');
      
      // Check if server is reachable before attempting registration
      const isServerReachable = await checkServerConnection();
      if (!isServerReachable) {
        throw new Error('Network Error: Server is unreachable. Please check your internet connection or try again later.');
      }
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store user data
      setUserInfo(user);
      setUserToken(token);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      await AsyncStorage.setItem('userToken', token);
      
      setIsLoading(false);
      return true;    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle network errors specifically
      if (error.message === 'Network Error') {
        setError('Network Error: Cannot connect to the server. Please check your internet connection or the server may be down.');
      } else {
        // Handle other types of errors
        const message = 
          error.response?.data?.message ||
          error.message ||
          'Registration failed. Please try again.';
        
        setError(message);
      }
      
      setIsLoading(false);
      return false;
    }
  };
  const login = async (email, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Import checkServerConnection function
      const { checkServerConnection } = require('../utils/api');
      
      // Check if server is reachable before attempting login
      const isServerReachable = await checkServerConnection();
      if (!isServerReachable) {
        throw new Error('Network Error: Server is unreachable. Please check your internet connection or try again later.');
      }
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store user data
      setUserInfo(user);
      setUserToken(token);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      await AsyncStorage.setItem('userToken', token);
      
      setIsLoading(false);
      return true;    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network errors specifically
      if (error.message === 'Network Error') {
        setError('Network Error: Cannot connect to the server. Please check your internet connection or the server may be down.');
      } else {
        // Handle other types of errors
        const message = 
          error.response?.data?.message ||
          error.message ||
          'Login failed. Please check your credentials.';
        
        setError(message);
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    // Remove data from state
    setUserToken(null);
    setUserInfo(null);
    
    // Remove from AsyncStorage
    await AsyncStorage.removeItem('userInfo');
    await AsyncStorage.removeItem('userToken');
    
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      
      // Get stored values
      let userToken = await AsyncStorage.getItem('userToken');
      let userInfo = await AsyncStorage.getItem('userInfo');
      
      if (userInfo) {
        userInfo = JSON.parse(userInfo);
      }
      
      if (userToken) {
        setUserToken(userToken);
        setUserInfo(userInfo);
      }
      
      setIsLoading(false);
    } catch (e) {
      console.log('isLoggedIn error:', e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userInfo,
        setUserInfo,
        error,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
