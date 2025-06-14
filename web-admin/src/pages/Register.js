import { useContext, useEffect, useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register, isLoading, userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (userInfo) {
      navigate('/dashboard');
    }
  }, [userInfo, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      await register(username, email, password);
      // Navigate to login is handled in AuthContext
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="login-container">
      <Container>
        <Card className="login-form mx-auto">
          <Card.Body>
            <div className="login-header">
              <h2>Admin Registration</h2>
              <p className="text-muted">Create a new admin account</p>
            </div>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {isLoading ? (
              <Loader size={50} />
            ) : (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="form-group">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="form-group">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="form-group">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="form-group">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Group>
                
                <Button variant="primary" type="submit" className="w-100 mb-3">
                  Register
                </Button>
                
                <div className="text-center">
                  <p>
                    Already have an account? <Link to="/login">Login</Link>
                  </p>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Register;
