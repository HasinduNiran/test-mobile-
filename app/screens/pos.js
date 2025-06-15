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
  const [lastScannedCode, setLastScannedCode] = useState('');  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isFreeItem, setIsFreeItem] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [customQuantity, setCustomQuantity] = useState('1');
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
    setDiscountPercent(0);
    setIsFreeItem(false);
    setCustomPrice(item.price.toString());
    setCustomQuantity('1');
  };
    // Add item to cart
  const addToCart = () => {
    if (!selectedProduct) return;
    
    const item = selectedProduct;
    const finalPrice = isFreeItem ? 0 : (parseFloat(customPrice) || item.price);
    const quantity = parseInt(customQuantity) || 1;
    
    // Validate inputs
    if (quantity <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity greater than 0.");
      return;
    }
    
    if (!isFreeItem && (finalPrice < 0 || isNaN(finalPrice))) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    // Create item with custom price, discount and quantity info
    const cartItem = {
      ...item,
      price: finalPrice,
      originalPrice: item.price,
      quantity: quantity,
      discountPercent: isFreeItem ? 100 : discountPercent,
      isFreeItem: isFreeItem
    };
      setCartItems(prevItems => {
      // Check if item is already in cart with same price
      const existingItem = prevItems.find(i => 
        i._id === item._id && 
        i.price === finalPrice && 
        i.discountPercent === cartItem.discountPercent
      );
      
      if (existingItem) {
        // Increment quantity
        return prevItems.map(i => 
          i._id === item._id && i.price === finalPrice && i.discountPercent === cartItem.discountPercent
            ? { ...i, quantity: i.quantity + quantity } 
            : i
        );
      } else {
        // Add new item
        return [...prevItems, cartItem];
      }
    });
      // Clear search and selection after adding
    setSearchText('');
    setSearchResults([]);
    setSelectedProduct(null);
    setCustomPrice('');
    setCustomQuantity('1');
    setDiscountPercent(0);
    setIsFreeItem(false);
    
    // Save as last scanned if it came from barcode scan
    if (searchText === item.barcode) {
      setLastScannedCode(item.barcode);
    }
  };
  
  // Update cart item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
    } else {
      // Update quantity
      setCartItems(prevItems => 
        prevItems.map(item =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
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
    setDiscountPercent(0);
    setIsFreeItem(false);
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
          onPress={() => updateQuantity(item._id, item.quantity - 1)}
        >
          <Text>
            <FontAwesome name="minus" size={12} color="#fff" />
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
          <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item._id, item.quantity + 1)}
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
        onPress={() => removeFromCart(item._id)}
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
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.5 }]}>Qty</ThemedText>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.8 }]}>Price</ThemedText>
          <ThemedText style={[styles.receiptItemsHeaderText, { flex: 0.8 }]}>Total</ThemedText>
        </View>
        
        <FlatList
          data={receiptData.items}
          keyExtractor={(item) => item._id}
          style={styles.receiptItemsList}
          renderItem={({ item }) => (
            <View style={styles.receiptItem}>
              <View style={[{flex: 2}, styles.receiptItemNameContainer]}>
                <ThemedText style={styles.receiptItemText} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                {item.discountPercent > 0 && (
                  <ThemedText style={styles.receiptItemDiscount}>
                    ({item.discountPercent}% off)
                  </ThemedText>
                )}
              </View>
              <ThemedText style={[styles.receiptItemText, { flex: 0.5 }]}>
                {item.quantity}
              </ThemedText>
              <ThemedText style={[styles.receiptItemText, { flex: 0.8 }]}>
                Rs {(item.price * (1 - item.discountPercent/100)).toFixed(2)}
              </ThemedText>
              <ThemedText style={[styles.receiptItemText, { flex: 0.8 }]}>
                Rs {(item.quantity * item.price * (1 - item.discountPercent/100)).toFixed(2)}
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
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item._id}
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
                    editable={!isFreeItem}
                  />
                </View>
                  {/* Quantity Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Quantity:</ThemedText>
                  <TextInput
                    style={styles.quantityInput}
                    value={customQuantity}
                    onChangeText={setCustomQuantity}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                  />
                  {isFreeItem && (
                    <ThemedText style={styles.freeQtyHint}>Free quantity</ThemedText>
                  )}
                </View>
                
                <View style={styles.discountContainer}>
                  <ThemedText style={styles.optionLabel}>Discount %:</ThemedText>
                  <View style={styles.discountButtonsRow}>
                    {[0, 5, 10, 15, 20].map(percent => (
                      <TouchableOpacity 
                        key={`discount-${percent}`}
                        style={[
                          styles.discountButton, 
                          discountPercent === percent && styles.activeDiscountButton
                        ]}
                        onPress={() => {
                          setDiscountPercent(percent);
                          setIsFreeItem(false);
                        }}
                      >
                        <Text style={styles.discountButtonText}>{percent}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                  <TouchableOpacity
                  style={[
                    styles.freeItemButton,
                    isFreeItem && styles.activeFreeItemButton
                  ]}
                  onPress={() => {
                    setIsFreeItem(!isFreeItem);
                    if (!isFreeItem) { // If turning on free item
                      setDiscountPercent(0); // Reset discount
                      setCustomPrice('0'); // Set price to 0 for free item
                      // Keep quantity editable for free items
                    } else {
                      setCustomPrice(selectedProduct.price.toString()); // Reset to original price
                    }
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{marginRight: 5}}>
                      <FontAwesome 
                        name={isFreeItem ? "check-square-o" : "square-o"} 
                        size={20} 
                        color={isFreeItem ? "#4CAF50" : "#333"} 
                      />
                    </Text>
                    <Text style={styles.freeItemButtonText}>Free Item {isFreeItem ? '(0 Rs)' : ''}</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Total Preview */}
                <View style={styles.totalPreview}>
                  <ThemedText style={styles.totalPreviewText}>
                    Total: Rs {(
                      isFreeItem ? 0 : 
                      (parseFloat(customPrice) || 0) * 
                      (parseInt(customQuantity) || 1) * 
                      (1 - discountPercent/100)
                    ).toFixed(2)}
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
                keyExtractor={(item) => item._id}
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
  },
  selectedProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  optionsContainer: {
    marginTop: 10,
  },
  discountContainer: {
    marginBottom: 15,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  discountButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 45,
    alignItems: 'center',
  },
  activeDiscountButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  discountButtonText: {
    fontSize: 14,
  },
  freeItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFreeItemButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  freeItemButtonText: {
    marginLeft: 10,
    fontSize: 14,
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 12,
    elevation: 2,
  },
  addToCartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountText: {
    marginLeft: 8,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    color: '#2196F3',
  },
  freeItemText: {
    marginLeft: 8,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    color: '#4CAF50',
  },
  receiptItemNameContainer: {
    flexDirection: 'column',
  },
  receiptItemDiscount: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
  },
  orderSuccessMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  orderSuccessText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#388E3C',
    flex: 1,
  },
  searchItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchItemInfo: {
    flex: 1,
  },
  searchItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },  searchItemCategory: {
    fontSize: 14,
    color: '#333',
    marginTop: 3,
  },
  searchItemBarcode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },  searchItemBarcodeText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 5,
  },
  searchItemPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  searchItemPrice: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },  searchItemStock: {
    fontSize: 12,
    color: '#333',
    marginTop: 3,
  },
  quickSelectContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },  quickSelectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  quickSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 5,
  },
  quickSelectButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
  },
  cartSummaryButton: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 15,
  },
  cartCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 3,
  },
  cartCountLabel: {
    fontSize: 14,
    color: '#fff',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewCartText: {
    color: '#fff',
    fontSize: 14,
  },
  
  // Cart Screen
  cartContainer: {
    flex: 1,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },  emptyCartText: {
    fontSize: 18,
    marginVertical: 20,
    color: '#333',
  },
  addItemsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addItemsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
  },  cartItemPrice: {
    fontSize: 14,
    color: '#333',
    marginTop: 3,
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  quantityButton: {
    backgroundColor: '#2196F3',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 15,
  },
  removeButton: {
    padding: 5,
  },
  cartSummaryContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  checkoutButtonsContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  clearCartButton: {
    backgroundColor: '#ff5252',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1,
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Receipt Screen
  receiptContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  receiptCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  receiptCompanyAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 3,
  },
  receiptCompanyContact: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 15,
  },
  receiptOrderInfo: {
    width: '100%',
  },
  receiptOrderInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
  },
  receiptValue: {
    fontSize: 14,
  },
  receiptItemsHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  receiptItemsHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  receiptItemsList: {
    flex: 1,
  },
  receiptItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  receiptItemText: {
    fontSize: 14,
  },
  receiptSummary: {
    paddingVertical: 10,
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  receiptSummaryLabel: {
    fontSize: 14,
  },
  receiptSummaryValue: {
    fontSize: 14,
  },
  receiptSummaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  receiptSummaryLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptSummaryValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptFooter: {
    alignItems: 'center',
    marginVertical: 15,
  },
  receiptFooterText: {
    fontSize: 16,
    marginBottom: 5,
  },
  receiptWebsite: {
    fontSize: 14,
    color: '#666',
  },
  receiptButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  printButton: {
    backgroundColor: '#607D8B',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1,
  },  newSaleButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  freeQtyHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 2,
  },
  totalPreview: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalPreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },  selectedProductStock: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  originalPriceText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textDecorationLine: 'line-through',
  },
});
