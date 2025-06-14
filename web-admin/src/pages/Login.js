import { useContext, useEffect, useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, isLoading, userInfo } = useContext(AuthContext);
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
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      await login(email, password);
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
              <h2>Admin Login</h2>
              <p className="text-muted">Sign in to access the admin panel</p>
            </div>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {isLoading ? (
              <Loader size={50} />
            ) : (
              <Form onSubmit={handleSubmit}>
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
                
                <Button variant="primary" type="submit" className="w-100 mb-3">
                  Login
                </Button>
                
                <div className="text-center">
                  <p>
                    Don't have an account? <Link to="/register">Register</Link>
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

export default Login;
