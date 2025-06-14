import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="text-center" style={{ paddingTop: '100px' }}>
      <Row className="justify-content-center">
        <Col md={6}>
          <FaExclamationTriangle style={{ fontSize: '5rem', color: '#f8bb86' }} />
          <h1 className="mt-4">404 - Page Not Found</h1>
          <p className="lead">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" className="mt-3">
              Return to Dashboard
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
