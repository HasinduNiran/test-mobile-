import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import { FaEdit, FaPlus, FaTrash, FaUsers } from 'react-icons/fa';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

const UserManagement = () => {
  const { userInfo } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'representative'
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'representative'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'representative'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update user
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        
        // Only include password if it's provided
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        await axios.put(`/api/auth/users/${editingUser._id}`, updateData);
        setShowAlert({ show: true, message: 'User updated successfully!', type: 'success' });
      } else {
        // Create new user
        await axios.post('/api/auth/users', formData);
        setShowAlert({ show: true, message: 'User created successfully!', type: 'success' });
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setShowAlert({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to save user. Please try again.', 
        type: 'danger' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await axios.delete(`/api/auth/users/${userId}`);
        setShowAlert({ show: true, message: 'User deleted successfully!', type: 'success' });
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setShowAlert({ 
          show: true, 
          message: err.response?.data?.message || 'Failed to delete user. Please try again.', 
          type: 'danger' 
        });
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Container><ErrorMessage>{error}</ErrorMessage></Container>;
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><FaUsers className="me-2" />User Management</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />Add New User
        </Button>
      </div>

      {showAlert.show && (
        <Alert 
          variant={showAlert.type} 
          onClose={() => setShowAlert({ show: false, message: '', type: '' })}
          dismissible
        >
          {showAlert.message}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Users</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(user)}
                        >
                          <FaEdit />
                        </Button>
                        {user._id !== userInfo.id && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user._id, user.username)}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">No users found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit User Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {editingUser && '(leave blank to keep current)'}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="representative">Representative</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;
