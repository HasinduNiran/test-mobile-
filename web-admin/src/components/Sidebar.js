import { useContext } from 'react';
import { Nav } from 'react-bootstrap';
import { FaBoxes, FaShoppingCart, FaTachometerAlt, FaUserCircle, FaUserFriends, FaUsers } from 'react-icons/fa'; // Added FaUserFriends
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
        
        <Nav.Item>
          <NavLink to="/orders" className="sidebar-link">
            <FaShoppingCart />
            Orders
          </NavLink>
        </Nav.Item>

        {/* Customer Management Link - Visible to Admin and Representative */}
        {(userInfo?.role === 'admin' || userInfo?.role === 'representative') && (
          <Nav.Item>
            <NavLink to="/customers" className="sidebar-link">
              <FaUserFriends />
              Customers
            </NavLink>
          </Nav.Item>
        )}
        
        {userInfo?.role === 'admin' && (
          <>
            <Nav.Item>
              <NavLink to="/stock" className="sidebar-link">
                <FaBoxes />
                Stock Management
              </NavLink>
            </Nav.Item>
            
            <Nav.Item>
              <NavLink to="/users" className="sidebar-link">
                <FaUsers />
                User Management
              </NavLink>
            </Nav.Item>
          </>
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
