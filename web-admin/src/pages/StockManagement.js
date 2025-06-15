import axios from 'axios';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import { FaEdit, FaFilter, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';

const StockManagement = () => {
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Fetch stock items
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stock');
      setStockItems(response.data);
      setFilteredItems(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching stock items:', err);
      setError('Failed to load stock items. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetching
  useEffect(() => {
    fetchStockItems();
  }, []);
  
  // Handle search and filter
  useEffect(() => {
    let result = stockItems;
      // Apply search term
    if (searchTerm) {
      result = result.filter(
        item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      result = result.filter(item => item.category === filterCategory);
    }
    
    setFilteredItems(result);
  }, [searchTerm, filterCategory, stockItems]);
  
  // Handle delete confirmation
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };
  
  // Handle actual deletion
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await axios.delete(`/api/stock/${itemToDelete._id}`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      toast.success('Stock item deleted successfully');
      fetchStockItems(); // Refresh the list
    } catch (err) {
      console.error('Error deleting stock item:', err);
      toast.error('Failed to delete stock item');
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Stock Management</h2>
        <Link to="/stock/add">
          <Button variant="primary">
            <FaPlus className="me-2" />
            Add New Item
          </Button>
        </Link>
      </div>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-md-0">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaFilter />
                  </span>
                  <Form.Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="me-3 stock-img-preview"
                              />
                            )}
                            <div>
                              <div>{item.name}</div>
                              <small className="text-muted">{item.description}</small>
                            </div>
                          </div>
                        </td>
                        <td>{item.barcode || '-'}</td>
                        <td>{item.category}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>
                          <span className={item.quantity < 10 ? 'text-danger' : ''}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/stock/edit/${item._id}`}>
                              <Button variant="outline-primary" size="sm">
                                <FaEdit />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => confirmDelete(item)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        {searchTerm || filterCategory ? 
                          'No items match your search criteria' : 
                          'No stock items found. Add some items to get started!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {itemToDelete?.name}? 
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StockManagement;
