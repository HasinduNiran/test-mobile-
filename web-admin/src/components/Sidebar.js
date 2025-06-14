import { useContext } from 'react';
import { Nav } from 'react-bootstrap';
import { FaBoxes, FaTachometerAlt, FaUserCircle } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { userInfo } = useContext(AuthContext);
  
  return (
    <div className="py-4">
      <div className="text-center mb-4">
        <h5 className="text-white">Agency Stock Manager</h5>
      </div>
      
      <Nav className="flex-column">
        <Nav.Item>
          <NavLink to="/dashboard" className="sidebar-link">
            <FaTachometerAlt />
            Dashboard
          </NavLink>
        </Nav.Item>
        
        {userInfo?.role === 'admin' && (
          <Nav.Item>
            <NavLink to="/stock" className="sidebar-link">
              <FaBoxes />
              Stock Management
            </NavLink>
          </Nav.Item>
        )}
        
        <Nav.Item>
          <NavLink to="/profile" className="sidebar-link">
            <FaUserCircle />
            Profile
          </NavLink>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;
