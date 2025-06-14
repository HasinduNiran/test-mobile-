import { useContext } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const { userInfo } = useContext(AuthContext);
  
  if (!userInfo) {
    return null; // This will be caught by ProtectedRoute and redirected
  }
  
  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        <Col md={3} lg={2} className="sidebar">
          <Sidebar />
        </Col>
        
        <Col md={9} lg={10} className="ms-auto">
          <Header />
          <main className="main-content">
            <Outlet />
          </main>
        </Col>
      </Row>
    </Container>
  );
};

export default Layout;
