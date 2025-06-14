import { useContext } from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { userInfo, logout } = useContext(AuthContext);
  
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container fluid className="px-4">
        <Navbar.Brand>Agency Admin</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <NavDropdown 
              title={
                <div className="d-inline-flex align-items-center">
                  <div className="avatar">
                    {userInfo?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span>{userInfo?.username}</span>
                </div>
              } 
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item as={Link} to="/profile">
                <FaUser className="me-2" />
                Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">
                <FaCog className="me-2" />
                Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={logout}>
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
