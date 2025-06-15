import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { fetchStockItems } from '../../utils/api';

export default function InventoryScreen() {
  const router = useRouter();
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchStockItems();
      setStockItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  // Apply search filter
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredItems(stockItems);
    } else {
      const filtered = stockItems.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) || 
        (item.barcode && item.barcode.toLowerCase().includes(searchText.toLowerCase())) ||
        item.description.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchText, stockItems]);
  
  const handleItemPress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };
  
  // Stock item card component
  const renderStockItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemCardContent}>
        <View style={styles.itemImageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
              defaultSource={require('../../assets/images/icon.png')}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="cube" size={30} color="#A1CEDC" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          <ThemedText style={styles.itemCategory}>{item.category}</ThemedText>
          <View style={styles.itemMetaRow}>
            <ThemedText style={styles.itemPrice}>Rs.{item.price.toFixed(2)}</ThemedText>
            <View style={styles.quantityContainer}>
              <ThemedText style={[
                styles.itemQuantity, 
                item.quantity < 10 ? styles.lowQuantity : null
              ]}>
                {item.quantity}
              </ThemedText>
              <ThemedText style={styles.itemUnit}>units</ThemedText>
            </View>
          </View>
          {item.barcode && (
            <View style={styles.barcodeContainer}>
              <FontAwesome name="barcode" size={14} color="#333" />
              <ThemedText style={styles.barcodeText} selectable={true}>{item.barcode}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Detail modal for stock item
  const renderItemDetailsModal = () => {
    if (!selectedItem) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="times" size={20} color="#333" />
            </TouchableOpacity>
            
            <View style={styles.modalScrollContent}>
              {selectedItem.imageUrl ? (
                <Image
                  source={{ uri: selectedItem.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                  defaultSource={require('../../assets/images/icon.png')}
                />
              ) : (
                <View style={styles.modalPlaceholder}>
                  <FontAwesome name="cube" size={60} color="#A1CEDC" />
                </View>
              )}
              
              <ThemedText style={styles.modalTitle}>{selectedItem.name}</ThemedText>
              
              <View style={styles.modalInfoRow}>
                <ThemedText style={styles.modalLabel}>Category:</ThemedText>
                <ThemedText style={styles.modalValue}>{selectedItem.category}</ThemedText>
              </View>
              
              <View style={styles.modalInfoRow}>
                <ThemedText style={styles.modalLabel}>Price:</ThemedText>
                <ThemedText style={styles.modalValue}>${selectedItem.price.toFixed(2)}</ThemedText>
              </View>
              
              <View style={styles.modalInfoRow}>
                <ThemedText style={styles.modalLabel}>In Stock:</ThemedText>
                <ThemedText style={[
                  styles.modalValue,
                  selectedItem.quantity < 10 ? styles.modalLowQuantity : null
                ]}>
                  {selectedItem.quantity} units
                </ThemedText>
              </View>
              
              {selectedItem.barcode && (
                <View style={styles.modalInfoRow}>
                  <ThemedText style={styles.modalLabel}>Barcode:</ThemedText>
                  <View style={styles.modalBarcodeValue}>
                    <FontAwesome name="barcode" size={18} color="#333" />
                    <ThemedText style={styles.modalValue} selectable={true}> {selectedItem.barcode}</ThemedText>
                  </View>
                </View>
              )}
              
              <View style={styles.divider} />
              
              <ThemedText style={styles.modalLabel}>Description:</ThemedText>
              <ThemedText style={styles.modalDescription}>
                {selectedItem.description || "No description available"}
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <ThemedText style={styles.loadingText}>Loading inventory...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Inventory</ThemedText>
      </View>
      
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#333" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, barcode, category..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText !== '' && (
          <TouchableOpacity 
            style={styles.clearSearch} 
            onPress={() => setSearchText('')}
          >
            <FontAwesome name="times-circle" size={16} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={32} color="#d32f2f" style={styles.errorIcon} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderStockItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="inbox" size={50} color="#ccc" />
              <ThemedText style={styles.emptyText}>
                {searchText ? "No matching items found" : "No inventory items available"}
              </ThemedText>
            </View>
          }
        />
      )}
      
      {/* Render item details modal */}
      {renderItemDetailsModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearSearch: {
    padding: 5,
  },
  listContent: {
    padding: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemCardContent: {
    flexDirection: 'row',
    padding: 10,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },  itemCategory: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemQuantity: {
    fontSize: 14,
    marginRight: 3,
  },
  lowQuantity: {
    color: '#d32f2f',
  },  itemUnit: {
    fontSize: 12,
    color: '#333',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },  barcodeText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },  emptyText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalScrollContent: {
    paddingTop: 10,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  modalPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
  },
  modalValue: {
    fontSize: 14,
    flex: 1,
  },
  modalLowQuantity: {
    color: '#d32f2f',
  },
  modalBarcodeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  }
});
