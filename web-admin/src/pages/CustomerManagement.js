import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

const CustomerManagementPage = () => {
  const { userInfo } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    route: '',
    telephone: '',
    creditLimit: 0,
    currentCredits: 0, // Only for admin to edit
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('/api/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleShowAddModal = () => {
    setIsEditing(false);
    setCurrentCustomer(null);
    setFormData({
      name: '',
      route: '',
      telephone: '',
      creditLimit: 0,
      currentCredits: 0, // Reset for add mode
    });
    setFormError('');
    setShowModal(true);
  };

  const handleShowEditModal = (customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      route: customer.route || '',
      telephone: customer.telephone,
      creditLimit: customer.creditLimit || 0,
      currentCredits: customer.currentCredits || 0, // For admin display/edit
    });
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
    setFormLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const payload = { ...formData };
    // Ensure creditLimit is a number
    payload.creditLimit = parseFloat(payload.creditLimit) || 0;
    if (userInfo.role !== 'admin') {
      delete payload.currentCredits; // Representatives cannot set currentCredits directly
    }

    try {
      if (isEditing && currentCustomer) {
        await axios.put(`/api/customers/${currentCustomer._id}`, payload);
      } else {
        await axios.post('/api/customers', payload);
      }
      fetchCustomers(); // Refresh list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving customer:', err);
      setFormError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setLoading(true); // Use main loading for delete action
        await axios.delete(`/api/customers/${customerId}`);
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        setError(err.response?.data?.message || 'Failed to delete customer.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !customers.length) {
    return <Loader />;
  }

  return (
    <Container fluid>
      <Row className="align-items-center mb-4">
        <Col>
          <h2>Customer Management</h2>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleShowAddModal}>
            <FaPlus className="me-2" /> Add Customer
          </Button>
        </Col>
      </Row>

      {error && <ErrorMessage variant="danger">{error}</ErrorMessage>}
      
      {loading && customers.length > 0 && <Spinner animation="border" className="mb-3" />}

      <Card>
        <Card.Body>
          {customers.length === 0 && !loading ? (
            <p className="text-center text-muted">No customers found. Add one to get started!</p>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Telephone</th>
                  <th>Route</th>
                  <th>Credit Limit (Rs)</th>
                  <th>Current Credits (Rs)</th>
                  {userInfo.role === 'admin' && <th>Added By</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.telephone}</td>
                    <td>{customer.route || '-'}</td>
                    <td>{customer.creditLimit.toFixed(2)}</td>
                    <td>{customer.currentCredits.toFixed(2)}</td>
                    {userInfo.role === 'admin' && <td>{customer.addedBy?.username || 'N/A'}</td>}
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEditModal(customer)}>
                        <FaEdit />
                      </Button>
                      {userInfo.role === 'admin' && (
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCustomer(customer._id)}>
                          <FaTrash />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Customer' : 'Add New Customer'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3" controlId="customerName">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={formLoading}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="customerTelephone">
              <Form.Label>Telephone <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                required
                disabled={formLoading}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="customerRoute">
              <Form.Label>Route</Form.Label>
              <Form.Control
                type="text"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                disabled={formLoading}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="customerCreditLimit">
              <Form.Label>Credit Limit (Rs)</Form.Label>
              <Form.Control
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                disabled={formLoading}
              />
            </Form.Group>
            {userInfo.role === 'admin' && isEditing && (
              <Form.Group className="mb-3" controlId="customerCurrentCredits">
                <Form.Label>Current Credits (Rs) - Admin Only</Form.Label>
                <Form.Control
                  type="number"
                  name="currentCredits"
                  value={formData.currentCredits}
                  onChange={handleInputChange}
                  step="0.01"
                  disabled={formLoading}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Saving...</> : (isEditing ? 'Save Changes' : 'Add Customer')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CustomerManagementPage;
