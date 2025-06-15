import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout for all requests
});

// Add a request interceptor to include the auth token in every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const checkServerConnection = async () => {
  try {
    console.log('Checking server connection at:', API_URL);
    
    // Try to reach the root API endpoint with a shorter timeout
    const response = await axios.get(API_URL.replace('/api', ''), { 
      timeout: 3000,
      // Prevent throwing on HTTP error responses
      validateStatus: function (status) {
        return status >= 200 && status < 600; // Consider any response a success
      }
    });
    
    console.log('Server connection response:', response.status);
    return response.status < 500; // Any response that's not a server error
  } catch (error) {
    console.error('Server connection check failed:', error.message);
    // Log more details about the error
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
};

export const fetchDashboardData = async () => {
  try {
    const response = await apiClient.get('/dashboard');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get('/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUsername = async (username) => {
  try {
    const response = await apiClient.put('/profile/username', { username });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/profile/password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStockItems = async () => {
  try {
    const response = await apiClient.get('/stock');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStockItemById = async (id) => {
  try {
    const response = await apiClient.get(`/stock/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchStockItems = async (query) => {
  try {
    const response = await apiClient.get(`/stock/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POS related APIs
export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const response = await apiClient.get('/orders');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrdersSummary = async () => {
  try {
    const response = await apiClient.get('/orders/summary/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Customer related APIs
export const getCustomers = async () => {
  try {
    const response = await apiClient.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    throw error;
  }
};

export const addCustomer = async (customerData) => {
  try {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error adding customer:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await apiClient.put(`/customers/${customerId}`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    const response = await apiClient.delete(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting customer:', error.response?.data || error.message);
    throw error;
  }
};

export default apiClient;
