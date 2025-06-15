import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { AuthContext } from '../../../context/AuthContext';
import { addCustomer, deleteCustomer, getCustomers, updateCustomer } from '../../../utils/api';

export default function CustomerScreen() {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    telephone: '',
    route: '',
    creditLimit: '0',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentCustomer(null);
    setFormData({ name: '', telephone: '', route: '', creditLimit: '0' });
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      telephone: customer.telephone,
      route: customer.route || '',
      creditLimit: customer.creditLimit?.toString() || '0',
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.telephone) {
      setFormError('Name and Telephone are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
      };
      if (isEditing && currentCustomer) {
        await updateCustomer(currentCustomer._id, payload);
      } else {
        await addCustomer(payload);
      }
      setModalVisible(false);
      fetchCustomers(); // Refresh list
    } catch (err) {
      console.error('Error saving customer:', err);
      setFormError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDelete = async (customerId) => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true); // Indicate loading state
              await deleteCustomer(customerId);
              fetchCustomers(); // Refresh the list
              Alert.alert("Success", "Customer deleted successfully.");
            } catch (err) {
              console.error('Error deleting customer:', err);
              Alert.alert("Error", err.response?.data?.message || "Failed to delete customer.");
              setLoading(false); // Reset loading state on error
            }
          },
        },
      ]
    );
  };

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <ThemedText style={styles.customerName}>{item.name}</ThemedText>
        <ThemedText style={styles.customerDetail}><FontAwesome name="phone" /> {item.telephone}</ThemedText>
        {item.route && <ThemedText style={styles.customerDetail}><FontAwesome name="map-marker" /> {item.route}</ThemedText>}
        <ThemedText style={styles.customerDetail}><FontAwesome name="money" /> Credit Limit: Rs {item.creditLimit.toFixed(2)}</ThemedText>
        <ThemedText style={styles.customerDetail}><FontAwesome name="credit-card" /> Current Credits: Rs {item.currentCredits.toFixed(2)}</ThemedText>
        {userInfo.role === 'admin' && item.addedBy && (
            <ThemedText style={styles.customerDetailSubtle}><FontAwesome name="user-plus" /> Added by: {item.addedBy.username}</ThemedText>
        )}
      </View>
      <View style={styles.customerActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <FontAwesome name="pencil" size={18} color="#007bff" />
        </TouchableOpacity>
        {userInfo.role === 'admin' && (
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
                <FontAwesome name="trash" size={18} color="#dc3545" />
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !customers.length && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <ThemedText>Loading customers...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Customers</ThemedText>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && !loading && (
        <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-circle" size={30} color="#dc3545" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButtonAlt}>
                <ThemedText style={styles.retryButtonTextAlt}>Tap to Retry</ThemedText>
            </TouchableOpacity>
        </View>
      )}

      {customers.length === 0 && !loading && !error && (
        <View style={styles.emptyContainer}>
          <FontAwesome name="users" size={50} color="#ccc" />
          <ThemedText style={styles.emptyText}>No customers found.</ThemedText>
          <ThemedText style={styles.emptySubText}>Tap the '+' button to add a new customer.</ThemedText>
        </View>
      )}

      {customers.length > 0 && (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2196F3"]}/>}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{isEditing ? 'Edit Customer' : 'Add New Customer'}</ThemedText>
            {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Name *"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Telephone *"
              value={formData.telephone}
              onChangeText={(text) => handleInputChange('telephone', text)}
              keyboardType="phone-pad"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Route (e.g., Town A, Area B)"
              value={formData.route}
              onChangeText={(text) => handleInputChange('route', text)}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Credit Limit (Rs)"
              value={formData.creditLimit}
              onChangeText={(text) => handleInputChange('creditLimit', text)}
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)} 
                disabled={formLoading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleFormSubmit} 
                disabled={formLoading}
              >
                {formLoading ? 
                    <ActivityIndicator size="small" color="#fff" /> : 
                    <Text style={styles.modalButtonText}>{isEditing ? 'Save Changes' : 'Add Customer'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Adjust for status bar
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  retryButtonAlt: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonTextAlt: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 5,
  },
  customerDetail: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 3,
  },
  customerDetailSubtle: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 2,
  },
  customerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  formErrorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
