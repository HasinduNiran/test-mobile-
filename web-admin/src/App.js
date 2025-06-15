import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthContext } from './context/AuthContext';
import AddStock from './pages/AddStock';
import CustomerManagementPage from './pages/CustomerManagement'; // Import CustomerManagementPage
import Dashboard from './pages/Dashboard';
import EditStock from './pages/EditStock';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import OrdersPage from './pages/OrdersPage'; // Import the new OrdersPage
import Profile from './pages/Profile';
import Register from './pages/Register';
import StockManagement from './pages/StockManagement';
import UserManagement from './pages/UserManagement'; // Import UserManagement

function App() {
  const { userInfo } = useContext(AuthContext);
  
  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!userInfo) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };
  
  // Admin-only route component
  const AdminRoute = ({ children }) => {
    if (!userInfo || userInfo.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Customer Management Route - Accessible by admin and representative */}
        <Route path="customers" element={<CustomerManagementPage />} />

        {/* Admin-only routes */}
        <Route path="stock" element={
          <AdminRoute>
            <StockManagement />
          </AdminRoute>
        } />
        <Route path="stock/add" element={
          <AdminRoute>
            <AddStock />
          </AdminRoute>
        } />
        <Route path="stock/edit/:id" element={
          <AdminRoute>
            <EditStock />
          </AdminRoute>
        } />        <Route path="orders" element={ // Add route for OrdersPage
          <AdminRoute> {/* Or ProtectedRoute if reps can also see it */}
            <OrdersPage />
          </AdminRoute>
        } />
        <Route path="users" element={ // Add route for UserManagement
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
