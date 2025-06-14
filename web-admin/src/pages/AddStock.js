import axios from 'axios';
import { useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';

const AddStock = () => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!name || !category) {
      setError('Name and category are required');
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      setError('Price must be a number greater than zero');
      return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
      setError('Quantity must be a non-negative number');
      return;
    }
    
    try {
      setLoading(true);
        await axios.post('/api/stock', {
        name,
        barcode,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        category,
        imageUrl
      });
      
      toast.success('Stock item added successfully!');
      navigate('/stock');
    } catch (err) {
      console.error('Error adding stock item:', err);
      setError(err.response?.data?.message || 'Failed to add stock item');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Add New Stock Item</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/stock')}>
          <FaArrowLeft className="me-2" />
          Back to Stock List
        </Button>
      </div>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Card>
        <Card.Body>
          {loading ? (
            <Loader />
          ) : (
            <Form onSubmit={handleSubmit}>              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Name*</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter item name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Barcode</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category*</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter category (e.g., Electronics, Books)"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter item description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price*</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity*</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="mt-2">
                    <p>Image Preview:</p>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{ maxHeight: '200px', maxWidth: '100%' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )}
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => navigate('/stock')}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  <FaSave className="me-2" />
                  Save Item
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddStock;
