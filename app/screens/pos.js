import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { AuthContext } from '../../context/AuthContext';
import { createOrder, searchStockItems } from '../../utils/api';

// Company info for receipt
const COMPANY_INFO = {
  name: "Agency Mobile Shop",
  address: "123 Main Street, City, Country",
  phone: "+123 456 7890",
  email: "info@agencymobilestore.com",
  website: "www.agencymobilestore.com",
  logo: require('../../assets/images/icon.png')
};

export default function PosScreen() {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePanel, setVisiblePanel] = useState('scanner'); // 'scanner', 'cart', 'receipt'
  const [receiptData, setReceiptData] = useState(null);
  const searchInputRef = useRef(null);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paidQuantity, setPaidQuantity] = useState('1');
  const [freeQuantity, setFreeQuantity] = useState('0'); // New state for free quantity
  const [customPrice, setCustomPrice] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('0'); // New state for discount input

  const [orderPlacedMessage, setOrderPlacedMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Calculate cart totals (no tax)
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity * (1 - item.discountPercent/100)), 0);
  const total = subtotal; // No tax

  // Handle search input change
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchText.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchText]);

  // Handle search
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      // Try first as barcode
      let results = [];
      
      if (searchText.trim().length > 0) {
        // First try as barcode
        try {
          results = await searchStockItems(searchText);
        } catch (error) {
          console.error("Error searching stock items:", error);
        }
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Search Error", "Failed to search inventory");
    } finally {
      setIsSearching(false);
    }
  };  // Select product from search results
  const selectProduct = (item) => {
    setSelectedProduct(item);
    setCustomPrice(item.price.toString());
    setPaidQuantity('1');
    setFreeQuantity('0'); // Initialize free quantity
    setDiscountPercentInput('0'); // Initialize discount input
  };
    // Add item to cart
  const addToCart = () => {
    if (!selectedProduct) return;

    const currentPaidQuantity = parseInt(paidQuantity) || 0;
    const currentFreeQuantity = parseInt(freeQuantity) || 0;
    const priceForPaidItems = parseFloat(customPrice) || selectedProduct.price;
    let currentDiscountPercent = parseFloat(discountPercentInput) || 0;

    if (currentDiscountPercent < 0 || currentDiscountPercent > 100) {
      Alert.alert("Invalid Discount", "Discount must be between 0 and 100.");
      return;
    }

    if (currentPaidQuantity <= 0 && currentFreeQuantity <= 0) {
      Alert.alert("No Quantity", "Please enter a quantity for paid or free items.");
      return;
    }

    let itemsToAdd = [];

    // Handle paid items
    if (currentPaidQuantity > 0) {
      if (priceForPaidItems < 0 || isNaN(priceForPaidItems)) {
        Alert.alert("Invalid Price", "Please enter a valid price for paid items.");
        return;
      }
      const paidItem = {
        ...selectedProduct,
        price: priceForPaidItems,
        originalPrice: selectedProduct.price,
        quantity: currentPaidQuantity,
        discountPercent: currentDiscountPercent,
        isFreeItem: false,
        // Ensure a unique key part if adding paid and free of same product simultaneously,
        // if merging logic doesn't distinguish them enough.
        // For now, relying on distinct price/discount or isFreeItem to separate.
        cartKey: `${selectedProduct._id}_paid_${priceForPaidItems}_${currentDiscountPercent}` 
      };
      itemsToAdd.push(paidItem);
    }

    // Handle free items
    if (currentFreeQuantity > 0) {
      const freeItem = {
        ...selectedProduct,
        price: 0, // Free items have zero price
        originalPrice: selectedProduct.price,
        quantity: currentFreeQuantity,
        discountPercent: 100, // Effectively 100% discount
        isFreeItem: true,
        cartKey: `${selectedProduct._id}_free`
      };
      itemsToAdd.push(freeItem);
    }

    setCartItems(prevItems => {
      let updatedItems = [...prevItems];
      itemsToAdd.forEach(itemToAdd => {
        const existingItemIndex = updatedItems.findIndex(i =>
          i._id === itemToAdd._id &&
          i.isFreeItem === itemToAdd.isFreeItem &&
          (i.isFreeItem || (i.price === itemToAdd.price && i.discountPercent === itemToAdd.discountPercent))
        );

        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity,
          };
        } else {
          updatedItems.push(itemToAdd);
        }
      });
      return updatedItems;
    });

    // Clear search and selection after adding
    setSearchText('');
    setSearchResults([]);
    setSelectedProduct(null); // This will hide the product options
    setCustomPrice('');
    setPaidQuantity('1');
    setFreeQuantity('0');
    setDiscountPercentInput('0');
    
    if (searchText === selectedProduct.barcode) {
      setLastScannedCode(selectedProduct.barcode);
    }
  };
  
  // Update cart item quantity
  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(prevItems => prevItems.filter(item => item.cartKey !== cartKey));
    } else {
      // Update quantity
      setCartItems(prevItems => 
        prevItems.map(item =>
          item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  // Remove item from cart
  const removeFromCart = (cartKey) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartKey !== cartKey));
  };
    // Handle barcode scan
  const handleBarcodeScanned = async (barcode) => {
    try {
      setSearchText(barcode);
      const results = await searchStockItems(barcode);
      
      if (results && results.length > 0) {
        // Find exact barcode match
        const exactMatch = results.find(item => item.barcode === barcode);
        if (exactMatch) {
          // Select the product first, which is the new flow
          selectProduct(exactMatch);
          return;
        }
      }
      
      // If no exact match, show search results
      setSearchResults(results);
    } catch (error) {
      console.error("Barcode scan error:", error);
      Alert.alert("Scan Error", "Failed to process barcode");
    }
  };
    // Process checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items before checking out.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create order data
      const orderData = {
        items: cartItems.map(item => ({
          productId: item._id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price * (1 - (item.discountPercent || 0)/100), // Apply discount
          subtotal: item.price * item.quantity * (1 - (item.discountPercent || 0)/100)
        })),
        subtotal,
        tax: 0, // No tax
        total,
        paymentMethod: "Cash", // Default payment method
        status: "Completed",
        customerName: "Walk-in Customer", // Default customer
        soldBy: userInfo.id
      };
      
      // Create receipt data
      const receipt = {
        orderId: `ORD-${Date.now()}`,
        date: new Date().toLocaleString(),
        items: cartItems,
        subtotal,
        tax: 0, // No tax
        total,
        soldBy: userInfo.username,
        customerName: "Walk-in Customer",
        paymentMethod: "Cash"
      };
      
      // Submit order to API
      try {
        const result = await createOrder(orderData);
        if (result && result._id) {
          setOrderPlacedMessage(`Order #${result._id} placed successfully. Stock updated.`);
        }
      } catch (error) {
        console.error("Error creating order:", error);
        Alert.alert("Order Error", "Failed to process order but receipt generated.");
      }
      
      // Show receipt
      setReceiptData(receipt);
      setVisiblePanel('receipt');
      
      // Clear cart
      setCartItems([]);
      
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Checkout Error", "Failed to process checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
    // New Sale / Reset everything
  const startNewSale = () => {
    setCartItems([]);
    setSearchText('');
    setSearchResults([]);
    setReceiptData(null);
    setVisiblePanel('scanner');
    setSelectedProduct(null);
    setCustomPrice('');
    setPaidQuantity('1');
    setFreeQuantity('0');
    setDiscountPercentInput('0');
    setOrderPlacedMessage('');
    setIsPrinting(false);
  };
    // Search results item component
  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.searchResultItem, 
        selectedProduct && selectedProduct._id === item._id && styles.selectedSearchItem
      ]}
      onPress={() => selectProduct(item)}
    >
      <View style={styles.searchItemContent}>
        <View style={styles.searchItemInfo}>
          <ThemedText style={styles.searchItemName}>{item.name}</ThemedText>
          <ThemedText style={styles.searchItemCategory}>{item.category}</ThemedText>
          {item.barcode && (            <View style={styles.searchItemBarcode}>
              <Text>
                <FontAwesome name="barcode" size={12} color="#333" />
              </Text>
              <ThemedText style={styles.searchItemBarcodeText}>{item.barcode}</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.searchItemPriceContainer}>
          <ThemedText style={styles.searchItemPrice}>Rs {item.price.toFixed(2)}</ThemedText>
          <ThemedText style={styles.searchItemStock}>In stock: {item.quantity}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
    // Cart item component
  const renderCartItem = ({ item, index }) => (
    <View style={styles.cartItem}>      <View style={styles.cartItemInfo}>
        <ThemedText style={styles.cartItemName}>{item.name}</ThemedText>
        <View style={styles.cartItemPriceRow}>
          <ThemedText style={styles.cartItemPrice}>
            Rs {item.price.toFixed(2)} each
            {item.originalPrice && item.originalPrice !== item.price && (
              <ThemedText style={styles.originalPriceText}>
                {' '}(was Rs {item.originalPrice.toFixed(2)})
              </ThemedText>
            )}
          </ThemedText>
          {item.discountPercent > 0 && !item.isFreeItem && (
            <ThemedText style={styles.discountText}>
              {item.discountPercent}% off
            </ThemedText>
          )}
          {item.isFreeItem && (
            <ThemedText style={styles.freeItemText}>FREE ITEM</ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.cartItemQuantity}>        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.cartKey, item.quantity - 1)}
        >
          <Text>
            <FontAwesome name="minus" size={12} color="#fff" />
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
          <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.cartKey, item.quantity + 1)}
        >
          <Text>
            <FontAwesome name="plus" size={12} color="#fff" />
          </Text>
        </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.cartItemTotal}>
        Rs {(item.price * item.quantity * (1 - item.discountPercent/100)).toFixed(2)}
      </ThemedText>
        <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromCart(item.cartKey)}
      >
        <Text>
          <FontAwesome name="trash" size={16} color="#FF5252" />
        </Text>
      </TouchableOpacity>
    </View>
  );
    // Receipt view
  const renderReceipt = () => {
    if (!receiptData) return null;
    
    return (
      <View style={styles.receiptContainer}>
        <View style={styles.receiptHeader}>
          <Image source={COMPANY_INFO.logo} style={styles.receiptLogo} />
          <ThemedText style={styles.receiptCompanyName}>{COMPANY_INFO.name}</ThemedText>
          <ThemedText style={styles.receiptCompanyAddress}>{COMPANY_INFO.address}</ThemedText>                <ThemedText style={styles.receiptCompanyContact}>
            {COMPANY_INFO.phone + " | " + COMPANY_INFO.email}
          </ThemedText>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptOrderInfo}>
            <View style={styles.receiptOrderInfoRow}>
              <ThemedText style={styles.receiptLabel}>Receipt #:</ThemedText>
              <ThemedText style={styles.receiptValue}>{receiptData.orderId}</ThemedText>
            </View>
            <View style={styles.receiptOrderInfoRow}>
              <ThemedText style={styles.receiptLabel}>Date:</ThemedText>
              <ThemedText style={styles.receiptValue}>{receiptData.date}</ThemedText>
            </View>
            <View style={styles.receiptOrderInfoRow}>
              <ThemedText style={styles.receiptLabel}>Cashier:</ThemedText>
              <ThemedText style={styles.receiptValue}>{receiptData.soldBy}</ThemedText>
            </View>
          </View>
          <View style={styles.receiptDivider} />
        </View>
        
        <View style={styles.receiptItemsHeader}>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 2 }]}>Item</ThemedText>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.5, textAlign: 'right' }]}>Qty</ThemedText>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.8, textAlign: 'right' }]}>Price</ThemedText>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.8, textAlign: 'right' }]}>Total</ThemedText>
        </View>
        
        <FlatList
          data={receiptData.items}
          keyExtractor={(item) => item.cartKey} 
          style={styles.receiptItemsList}
          renderItem={({ item }) => (
            <View style={styles.receiptItem}>
              <View style={[{flex: 2}, styles.receiptItemNameContainer]}>
                <ThemedText style={styles.receiptItemNamePrimary} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                {item.isFreeItem && (
                  <ThemedText style={styles.receiptFreeTagDisplay}>FREE ITEM</ThemedText>
                )}
                {!item.isFreeItem && item.originalPrice && item.originalPrice !== item.price && (
                  <ThemedText style={styles.receiptOriginalPriceDisplay}>
                    (Original Price: Rs {item.originalPrice.toFixed(2)})
                  </ThemedText>
                )}
                {!item.isFreeItem && item.discountPercent > 0 && (
                  <ThemedText style={styles.receiptDiscountDisplay}>
                    ({item.discountPercent}% off)
                  </ThemedText>
                )}
              </View>
              <ThemedText style={[styles.receiptItemText, { flex: 0.5, textAlign: 'right' }]}>
                {item.quantity}
              </ThemedText>
              <ThemedText style={[styles.receiptItemText, { flex: 0.8, textAlign: 'right' }]}>
                Rs {(item.price * (1 - (item.discountPercent || 0)/100)).toFixed(2)}
              </ThemedText>
              <ThemedText style={[styles.receiptItemText, { flex: 0.8, textAlign: 'right' }]}>
                Rs {(item.quantity * item.price * (1 - (item.discountPercent || 0)/100)).toFixed(2)}
              </ThemedText>
            </View>
          )}
        />
        
        <View style={styles.receiptDivider} />
        
        <View style={styles.receiptSummary}>
          <View style={styles.receiptSummaryRow}>
            <ThemedText style={styles.receiptSummaryLabel}>Subtotal:</ThemedText>
            <ThemedText style={styles.receiptSummaryValue}>
              Rs {receiptData.subtotal.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.receiptSummaryRowTotal}>
            <ThemedText style={styles.receiptSummaryLabelTotal}>TOTAL:</ThemedText>
            <ThemedText style={styles.receiptSummaryValueTotal}>
              Rs {receiptData.total.toFixed(2)}
            </ThemedText>
          </View>
        </View>
          <View style={styles.receiptFooter}>
          <ThemedText style={styles.receiptFooterText}>
            Thank you for shopping with us!
          </ThemedText>          <ThemedText style={styles.receiptWebsite}>
            {'Visit us at ' + COMPANY_INFO.website}
          </ThemedText>
        </View>
          {orderPlacedMessage ? (
          <View style={styles.orderSuccessMessage}>
            <Text>
              <FontAwesome name="check-circle" size={24} color="#4CAF50" />
            </Text>
            <ThemedText style={styles.orderSuccessText}>{orderPlacedMessage}</ThemedText>
          </View>
        ) : null}
        
        <View style={styles.receiptButtonsContainer}>
          <TouchableOpacity 
            style={styles.printButton} 
            onPress={() => {
              setIsPrinting(true);
              // Simulate printing process
              setTimeout(() => {
                setIsPrinting(false);
                Alert.alert("Print", "Receipt printed (simulated).");
              }, 2000);
            }}
            disabled={isPrinting}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{marginRight: 5}}>
                <FontAwesome name="print" size={16} color="#fff" style={styles.buttonIcon} />
              </Text>
              <Text style={styles.buttonText}>
                {isPrinting ? "Printing..." : "Print Receipt"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newSaleButton} onPress={startNewSale}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{marginRight: 5}}>
                <FontAwesome name="refresh" size={16} color="#fff" style={styles.buttonIcon} />
              </Text>
              <Text style={styles.buttonText}>New Sale</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </Text>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Point of Sale</ThemedText>
        <View style={styles.tabButtons}>          <TouchableOpacity 
            style={[styles.tabButton, visiblePanel === 'scanner' && styles.activeTabButton]}
            onPress={() => setVisiblePanel('scanner')}
          >
            <Text>
              <FontAwesome name="barcode" size={18} color="#fff" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, visiblePanel === 'cart' && styles.activeTabButton]}
            onPress={() => setVisiblePanel('cart')}
          >            <View style={{position: 'relative'}}>
              <Text>
                <FontAwesome name="shopping-cart" size={18} color="#fff" />
              </Text>
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Content */}
      {visiblePanel === 'scanner' && (
        <View style={styles.scannerContainer}>          {/* Scanner Info */}          <ThemedView style={styles.scannerInfoContainer}>
            <Text>
              <FontAwesome name="barcode" size={20} color="#2196F3" />
            </Text>
            <ThemedText style={styles.scannerInfoText}>
              First scan barcode, then select product
            </ThemedText>
          </ThemedView>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Enter barcode to find product..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
              keyboardType="numeric"
            />            {isSearching ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : searchText ? (
              <TouchableOpacity 
                style={styles.searchClearButton} 
                onPress={() => setSearchText('')}
              >
                <Text>
                  <FontAwesome name="times-circle" size={18} color="#333" />
                </Text>
              </TouchableOpacity>            ) : (
              <Text>
                <FontAwesome name="barcode" size={18} color="#333" />
              </Text>
            )}
          </View>
          
          {/* Search Results List */}
          {searchResults.length > 0 && !selectedProduct && ( // Hide when a product is selected
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item, index) => `${item._id}-${index}`} // Modified to ensure unique keys
              style={styles.searchResults}
            />
          )}
            {/* Product Selection Options */}
          {selectedProduct && (
            <View style={styles.productOptionsContainer}>
              <View style={styles.selectedProductInfo}>
                <ThemedText style={styles.selectedProductName}>{selectedProduct.name}</ThemedText>
                <ThemedText style={styles.selectedProductPrice}>Original Price: Rs {selectedProduct.price.toFixed(2)}</ThemedText>
                <ThemedText style={styles.selectedProductStock}>Stock: {selectedProduct.quantity}</ThemedText>
              </View>
              
              <View style={styles.optionsContainer}>
                {/* Price Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Price (Rs):</ThemedText>
                  <TextInput
                    style={styles.priceInput}
                    value={customPrice}
                    onChangeText={setCustomPrice}
                    placeholder="Enter price"
                    keyboardType="numeric"
                  />
                </View>
                  {/* Paid Quantity Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Paid Quantity:</ThemedText>
                  <TextInput
                    style={styles.quantityInput}
                    value={paidQuantity}
                    onChangeText={setPaidQuantity}
                    placeholder="Paid Qty"
                    keyboardType="numeric"
                  />
                </View>

                {/* Free Quantity Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Free Quantity:</ThemedText>
                  <TextInput
                    style={styles.quantityInput}
                    value={freeQuantity}
                    onChangeText={setFreeQuantity}
                    placeholder="Free Qty"
                    keyboardType="numeric"
                  />
                </View>
                
                {/* Discount Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Discount % (for paid items):</ThemedText>
                  <TextInput
                    style={styles.discountInput}
                    value={discountPercentInput}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setDiscountPercentInput(numericValue);
                    }}
                    placeholder="e.g., 10"
                    keyboardType="numeric"
                  />
                </View>

                {/* Removed Free Item Toggle and Discount Buttons */}
                
                {/* Total Preview */}
                <View style={styles.totalPreview}>
                  <ThemedText style={styles.totalPreviewText}>
                    Selected Item Total: Rs {
                      (() => {
                        const pq = parseInt(paidQuantity) || 0;
                        const cp = parseFloat(customPrice) || 0;
                        const dp = parseFloat(discountPercentInput) || 0;
                        if (pq > 0) {
                          return (cp * pq * (1 - dp / 100)).toFixed(2);
                        }
                        return '0.00';
                      })()
                    }
                  </ThemedText>
                  <ThemedText style={styles.totalPreviewSubText}>
                    (Paid: {paidQuantity || '0'}, Free: {freeQuantity || '0'})
                  </ThemedText>
                </View>
                
                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={addToCart}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{marginRight: 5}}>
                      <FontAwesome name="shopping-cart" size={16} color="#fff" />
                    </Text>
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Quick Product Selection (Recently Scanned) - for quick access */}
          {lastScannedCode && searchResults.length === 0 && !searchText && (
            <View style={styles.quickSelectContainer}>
              <ThemedText style={styles.quickSelectTitle}>Recently Scanned</ThemedText>
              <TouchableOpacity 
                style={styles.quickSelectButton}
                onPress={() => setSearchText(lastScannedCode)}
              >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{marginRight: 5}}>
                    <FontAwesome name="barcode" size={14} color="#2196F3" />
                  </Text>
                  <ThemedText style={styles.quickSelectButtonText}>
                    Barcode: {lastScannedCode}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <TouchableOpacity 
              style={styles.cartSummaryButton}
              onPress={() => setVisiblePanel('cart')}
            >
              <View style={styles.cartSummaryContent}>                  <View style={styles.cartSummaryInfo}>
                    <View style={styles.cartCountContainer}>
                      <ThemedText style={styles.cartCount}>
                        {cartItems.reduce((total, item) => total + item.quantity, 0)}
                      </ThemedText>
                      <ThemedText style={styles.cartCountLabel}>items</ThemedText>
                    </View>
                    <ThemedText style={styles.cartTotal}>
                      Rs {total.toFixed(2)}
                    </ThemedText>
                  </View>                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <ThemedText style={styles.viewCartText}>
                    View Cart
                  </ThemedText>
                  <Text style={{color: "#fff", marginLeft: 5}}>
                    <FontAwesome name="angle-right" size={14} color="#fff" />
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {visiblePanel === 'cart' && (
        <View style={styles.cartContainer}>
          {cartItems.length === 0 ? (            <View style={styles.emptyCartContainer}>
              <Text>
                <FontAwesome name="shopping-cart" size={50} color="#ddd" />
              </Text>
              <ThemedText style={styles.emptyCartText}>Your cart is empty</ThemedText>
              <TouchableOpacity 
                style={styles.addItemsButton}
                onPress={() => setVisiblePanel('scanner')}
              >
                <ThemedText style={styles.addItemsButtonText}>Add Items</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.cartKey} 
                style={styles.cartList}
              />
                <View style={styles.cartSummaryContainer}>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Subtotal:</ThemedText>
                  <ThemedText style={styles.summaryValue}>Rs {subtotal.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.summaryRowTotal}>
                  <ThemedText style={styles.summaryLabelTotal}>Total:</ThemedText>
                  <ThemedText style={styles.summaryValueTotal}>Rs {total.toFixed(2)}</ThemedText>
                </View>
                
                <View style={styles.checkoutButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.clearCartButton}
                    onPress={() => {
                      Alert.alert(
                        "Clear Cart",
                        "Are you sure you want to clear all items?",
                        [
                          { text: "Cancel" },
                          { text: "Yes, Clear", onPress: () => setCartItems([]) }
                        ]
                      );
                    }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={{marginRight: 5}}>
                        <FontAwesome name="trash" size={16} color="#fff" style={styles.buttonIcon} />
                      </Text>
                      <Text style={styles.buttonText}>Clear</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{marginRight: 5}}>
                          <FontAwesome name="check" size={16} color="#fff" style={styles.buttonIcon} />
                        </Text>
                        <Text style={styles.buttonText}>Checkout</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      )}
      
      {visiblePanel === 'receipt' && renderReceipt()}
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 10,
  },
  tabButtons: {
    flexDirection: 'row',
  },
  tabButton: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 4,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Scanner Screen
  scannerContainer: {
    flex: 1,
  },
  scannerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },  scannerInfoText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchClearButton: {
    padding: 5,
  },
  searchResults: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedSearchItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  productOptionsContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1, 
    borderColor: '#ddd',
  },
  selectedProductInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', 
  },
  selectedProductPrice: {
    fontSize: 14, 
    color: '#555', 
  },
  selectedProductStock: {
    fontSize: 14,
    color: '#555',
  },
  optionsContainer: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  priceInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  quantityInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
    minWidth: 80,
  },
  discountInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  totalPreview: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  totalPreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  totalPreviewSubText: {
    fontSize: 12,
    color: '#42a5f5',
    marginTop: 4,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 15,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickSelectContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  quickSelectButton: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  quickSelectButtonText: {
    fontSize: 14,
    color: '#2196F3',
  },
  cartSummaryButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  cartSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSummaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  cartCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cartCountLabel: {
    fontSize: 10,
    color: '#fff',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Cart Screen
  cartContainer: {
    flex: 1,
    padding: 10,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 18,
    color: '#777',
    marginTop: 15,
  },
  addItemsButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginTop: 20,
  },
  addItemsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#555',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#777',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 12,
    color: '#E91E63',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  freeItemText: {
    fontSize: 12,
    color: 'green',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
    color: '#333',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333', 
    minWidth: 70, 
    textAlign: 'right',
  },
  removeButton: {
    padding: 8,
    marginLeft: 5,
  },
  cartSummaryContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderRadius: 4,
    marginTop: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#555',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  checkoutButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  clearCartButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginRight: 5,
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  
  // Receipt Screen
  receiptContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  receiptCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptCompanyAddress: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginBottom: 2,
  },
  receiptCompanyContact: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
    marginVertical: 10,
  },
  receiptOrderInfo: {
    width: '100%',
  },
  receiptOrderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#555',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 5,
  },
  receiptItemsHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptItemsList: {
    maxHeight: 250, // Limit height for scrollability if many items
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiptItemNameContainer: {
    // flex: 2 is applied inline
  },
  receiptItemNamePrimary: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  receiptFreeTagDisplay: {
    fontSize: 10,
    color: 'green',
    fontWeight: 'bold',
    marginTop: 2,
  },
  receiptOriginalPriceDisplay: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
  receiptDiscountDisplay: {
    fontSize: 10,
    color: '#E91E63',
    marginTop: 2,
  },
  receiptItemText: {
    fontSize: 12,
    color: '#333', 
  },
  /*receiptItemDiscount: { // This style was previously used inline, now covered by receiptDiscountDisplay
    fontSize: 10,
    color: '#E91E63',
    marginLeft: 5, 
  },*/
  receiptSummary: {
    marginTop: 15,
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  receiptSummaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  receiptSummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptSummaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  receiptSummaryLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptSummaryValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  receiptFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  receiptFooterText: {
    fontSize: 12,
    color: '#555',
  },
  receiptWebsite: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 3,
  },
  orderSuccessMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#e8f5e9', 
    borderRadius: 4,
    marginTop: 15,
  },
  orderSuccessText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2e7d32', 
    fontWeight: 'bold',
  },
  receiptButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  printButton: {
    backgroundColor: '#607D8B', 
    paddingVertical: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  newSaleButton: {
    backgroundColor: '#009688', 
    paddingVertical: 12,
    borderRadius: 4,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
});
