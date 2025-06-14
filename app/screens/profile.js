import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { AuthContext } from '../../context/AuthContext';
import { updatePassword, updateUsername } from '../../utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useContext(AuthContext);
  
  const [username, setUsername] = useState(userInfo?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle username update
  const handleUsernameUpdate = async () => {
    if (!username || username.trim() === '') {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    
    // No change if username is the same
    if (username === userInfo?.username) {
      Alert.alert('Info', 'No changes were made to username');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
        const response = await updateUsername(username);
      
      // Update local user info with the updated username
      if (response && response.user) {
        const updatedUserInfo = {
          ...userInfo,
          username: response.user.username
        };
        
        // Update state
        setUserInfo(updatedUserInfo);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        
        setSuccessMessage('Username updated successfully');
      }
    } catch (error) {
      console.error('Username update error:', error);
      setError(error.response?.data?.message || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    // Check for empty fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    // Check password length
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      await updatePassword(currentPassword, newPassword);
      
      // Reset password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccessMessage('Password updated successfully');
    } catch (error) {
      console.error('Password update error:', error);
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={18} color="#2196F3" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile Management</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.dashboardButton} 
          onPress={() => router.push('/dashboard')}
        >
          <FontAwesome name="th-large" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-circle" size={80} color="#2196F3" />
          </View>
          <ThemedText style={styles.profileName}>
            {userInfo?.username || 'Representative'}
          </ThemedText>
          <ThemedText style={styles.profileRole}>
            Agency Representative
          </ThemedText>
        </View>
      
        {/* Success message */}
        {successMessage ? (
          <View style={styles.successContainer}>
            <FontAwesome name="check-circle" size={20} color="#388e3c" style={{ marginRight: 10 }} />
            <ThemedText style={styles.successText}>{successMessage}</ThemedText>
          </View>
        ) : null}
        
        {/* Error message */}
        {error ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-circle" size={20} color="#d32f2f" style={{ marginRight: 10 }} />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="user" size={18} color="#2196F3" />
            <ThemedText style={styles.cardTitle}>Update Username</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardBody}>
            <ThemedText style={styles.inputLabel}>Username</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter new username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleUsernameUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome name="check" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.buttonText}>Update Username</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="lock" size={18} color="#4CAF50" />
            <ThemedText style={styles.cardTitle}>Change Password</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardBody}>
            <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#999"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            
            <ThemedText style={styles.inputLabel}>New Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            
            <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} 
              onPress={handlePasswordUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome name="key" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.buttonText}>Update Password</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="info-circle" size={18} color="#FF9800" />
            <ThemedText style={styles.cardTitle}>Account Information</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Role:</ThemedText>
              <ThemedText style={styles.infoValue}>Agency Representative</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Status:</ThemedText>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.statusText}>Active</ThemedText>
              </View>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Last Login:</ThemedText>
              <ThemedText style={styles.infoValue}>Today, 10:30 AM</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  dashboardButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileRole: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
    padding: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  cardBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 15,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  successText: {
    color: '#388e3c',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  errorText: {
    color: '#d32f2f',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#757575',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: '#388e3c',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 30,
  },
});
