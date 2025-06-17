import axios from 'axios';
import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000';

// Configure global axios defaults
axios.defaults.timeout = 15000; // 15 seconds
axios.defaults.baseURL = API_URL; // Set the base URL for all axios requests

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Request timeout or network error:', error.message);
      toast.error('Connection timeout. Please check your internet connection and try again.');
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if we have user info in localStorage
    const storedUserInfo = localStorage.getItem('userInfo');
    
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedUserInfo);
        
        // Configure axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUserInfo.token}`;
      } catch (error) {
        console.error('Error parsing user info from localStorage:', error);
        localStorage.removeItem('userInfo');
      }
    }
  }, []);
  
  // Register a new user
  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`/api/auth/register`, {
        username,
        email,
        password
      });
      
      toast.success('Registration successful! Please log in.');
      navigate('/login');
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`/api/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Only allow login for admin users in the web admin panel
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        throw new Error('Only admin users can access the admin panel');
      }
      
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token
      };
      
      setUserInfo(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Login failed. Please check your credentials.';
      
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('You have been logged out.');
    navigate('/login');
  };
  
  const updateUser = (updatedInfo) => {
    const updatedUserInfo = { ...userInfo, ...updatedInfo };
    setUserInfo(updatedUserInfo);
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
  };
  
  return (
    <AuthContext.Provider
      value={{
        userInfo,
        setUserInfo,
        isLoading,
        register,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
