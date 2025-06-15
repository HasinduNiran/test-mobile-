import axios from 'axios';
import {
  ArcElement // Needed for Pie/Doughnut charts
  ,





  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Changed import
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2'; // Import Pie for charts
import { FaCalendarAlt, FaChartPie, FaFilePdf, FaFilter, FaShoppingCart, FaTags } from 'react-icons/fa';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OrdersPage = () => {
  const { userInfo } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState('');  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productsSold, setProductsSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false); // Added for modal loading
  const [statusUpdateError, setStatusUpdateError] = useState(''); // Added for modal error

  // PDF Download Functionality
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const tableColumn = ["Order ID", "Customer", userInfo?.role === 'admin' ? "Representative" : null, "Items", "Total", "Status", "Time"].filter(Boolean);
    const tableRows = [];

    orders.forEach(order => {
      const orderData = [
        order._id.slice(-6),
        order.customerName,
        userInfo?.role === 'admin' ? (order.soldBy?.username || 'N/A') : null,
        order.items.length,
        `Rs ${(order.total || 0).toFixed(2)}`,
        order.status,
        new Date(order.createdAt).toLocaleTimeString()
      ].filter(col => col !== null);
      tableRows.push(orderData);
    });

    // Use the imported autoTable function directly
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      didDrawPage: function (data) {
        // Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text("Orders Report", data.settings.margin.left, 15);
      }
    });
    doc.save(`orders_report_${selectedDate}_${selectedRepresentative || 'all_reps'}.pdf`);
  };

  // Status update functionality
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setSelectedNewStatus('');
    setStatusUpdateError(''); // Clear previous errors
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setSelectedNewStatus('');
    setStatusUpdateError('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !selectedNewStatus) return;

    setStatusUpdateLoading(true);
    setStatusUpdateError('');
    try {
      await axios.patch(`http://16.171.225.212/api2/api/orders/${selectedOrder._id}/status`, { status: selectedNewStatus });
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === selectedOrder._id ? { ...order, status: selectedNewStatus } : order
        )
      );

      closeStatusModal();
    } catch (err) {
      console.error('Error updating order status:', err);
      setStatusUpdateError(err.response?.data?.message || 'Failed to update order status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Confirmed': return 'info';
      case 'Out of Warehouse': return 'primary';
      case 'In Transit': return 'secondary';
      case 'Delivered': return 'success';
      case 'Paid': return 'success';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };
  // Get next available statuses based on current status
  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Out of Warehouse', 'Cancelled'],
      'Out of Warehouse': ['In Transit', 'Cancelled'],
      'In Transit': ['Delivered', 'Cancelled'],
      'Delivered': ['Paid'],
      'Paid': ['Completed'],
      'Completed': [],
      'Cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  // Get all available statuses for admin (can change to any status except current)
  const getAllStatusesForAdmin = (currentStatus) => {
    const allStatuses = ['Pending', 'Confirmed', 'Out of Warehouse', 'In Transit', 'Delivered', 'Paid', 'Completed', 'Cancelled'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  // Get available statuses based on user role
  const getAvailableStatuses = (currentStatus, isAdmin) => {
    if (isAdmin) {
      return getAllStatusesForAdmin(currentStatus);
    } else {
      return getNextStatuses(currentStatus);
    }
  };

  // Helper function to aggregate products from orders
  const aggregateProducts = (orderList) => {
    const productMap = new Map();
    orderList.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.totalQuantitySold += item.quantity;
          existing.totalValueSold += item.subtotal;
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            totalQuantitySold: item.quantity,
            totalValueSold: item.subtotal,
          });
        }
      });
    });
    return Array.from(productMap.values()).sort((a, b) => b.totalValueSold - a.totalValueSold);
  };
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch users (for representative filter) if admin
        if (userInfo?.role === 'admin') {
          try {
            const usersResponse = await axios.get('/api/auth/users');
            setRepresentatives(usersResponse.data.filter(user => user.role === 'representative'));
          } catch (err) {
            console.error('Error fetching users:', err);
            // Non-critical, continue loading orders
          }
        }

        // Fetch orders with date and representative filters
        let ordersUrl = '/api/orders';
        const params = new URLSearchParams();
        
        if (selectedDate) {
          params.append('date', selectedDate);
        }
        
        if (userInfo?.role === 'admin' && selectedRepresentative) {
          params.append('representativeId', selectedRepresentative);
        }
        
        if (params.toString()) {
          ordersUrl += `?${params.toString()}`;
        }
        
        const ordersResponse = await axios.get(ordersUrl);
        const fetchedOrders = ordersResponse.data;
        setOrders(fetchedOrders);

        const aggregated = aggregateProducts(fetchedOrders);
        setProductsSold(aggregated);
        
      } catch (err) {
        console.error('Error fetching orders data:', err);
        setError('Failed to load orders data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, [userInfo, selectedRepresentative, selectedDate]);

  // Determine title for Products Sold card
  let productsSoldTitle = "All Products Sold";
  if (selectedRepresentative && representatives.length > 0) {
    const rep = representatives.find(r => r._id === selectedRepresentative);
    if (rep) {
      productsSoldTitle = `Products Sold by ${rep.username}`;
    }
  } else if (userInfo?.role === 'representative') {
    productsSoldTitle = `Products Sold by You (${userInfo.username})`;
  }
  
  // --- Chart Data Preparation ---

  // Sales by Representative (Pie Chart)
  const salesByRepData = {
    labels: orders.reduce((acc, order) => {
      const repName = order.soldBy?.username || 'Unknown';
      if (!acc.includes(repName)) {
        acc.push(repName);
      }
      return acc;
    }, []),
    datasets: [{
      label: 'Sales Amount',
      data: orders.reduce((acc, order) => {
        const repName = order.soldBy?.username || 'Unknown';
        const index = acc.labels.indexOf(repName);
        if (index !== -1) {
          acc.data[index] = (acc.data[index] || 0) + order.total;
        }
        return acc;
      }, { labels: [], data: [] }).data, // Initialize with empty labels and data for reduction
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  };
   // Helper to ensure labels and data align for salesByRepData
  const getSalesByRepChartData = () => {
    const salesMap = new Map();
    orders.forEach(order => {
        const repName = order.soldBy?.username || 'Unknown';
        salesMap.set(repName, (salesMap.get(repName) || 0) + order.total);
    });
    const labels = Array.from(salesMap.keys());
    const data = Array.from(salesMap.values());
    return {
        labels,
        datasets: [{
            label: 'Sales Amount',
            data,
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
                'rgba(255, 99, 71, 0.7)', 'rgba(54, 235, 235, 0.7)', 'rgba(255, 206, 150, 0.7)' 
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 71, 1)', 'rgba(54, 235, 235, 1)', 'rgba(255, 206, 150, 1)'
            ],
            borderWidth: 1
        }]
    };
  };
  const finalSalesByRepData = getSalesByRepChartData();


  // Top Selling Products (Bar Chart)
  const topSellingProductsData = {
    labels: productsSold.slice(0, 5).map(p => p.productName), // Top 5 products
    datasets: [{
      label: 'Total Quantity Sold',
      data: productsSold.slice(0, 5).map(p => p.totalQuantitySold),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
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
        <h2>Orders Management</h2>
        <div className="d-flex align-items-center gap-3">
          {/* PDF Download Button */}
          <Button variant="danger" onClick={handleDownloadPdf} disabled={orders.length === 0}>
            <FaFilePdf className="me-2" /> Download PDF
          </Button>

          {/* Date Filter */}
          <div className="d-flex align-items-center">
            <FaCalendarAlt className="me-2" />
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '150px' }}
            />
          </div>
          
          {/* Representative Filter for Admin */}
          {userInfo?.role === 'admin' && (
            <div className="d-flex align-items-center">
              <FaFilter className="me-2" />
              <select
                className="form-select form-select-sm"
                style={{ width: '200px' }}
                value={selectedRepresentative}
                onChange={(e) => setSelectedRepresentative(e.target.value)}
                aria-label="Filter by representative"
              >
                <option value="">All Representatives</option>
                {representatives.map(rep => (
                  <option key={rep._id} value={rep._id}>{rep.username}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Orders by Date Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Orders for {new Date(selectedDate).toLocaleDateString()}</h5>
                {/* Optional: Add a specific download button for this table if needed */}
              </div>
            </Card.Header>
            <Card.Body>
              {orders.length > 0 ? (
                <>
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-primary">{orders.length}</h4>
                        <small className="text-muted">Total Orders</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">                        <h4 className="text-success">
                          ${orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                        </h4>
                        <small className="text-muted">Total Sales</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-info">
                          {orders.reduce((sum, order) => sum + order.items.length, 0)}
                        </h4>
                        <small className="text-muted">Total Items Sold</small>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          {userInfo?.role === 'admin' && <th>Representative</th>}
                          <th>Items</th>
                          <th>Total (Rs)</th> {/* Changed from $ to Rs */}
                          <th>Status</th>
                          <th>Actions</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td>{order._id.slice(-6)}</td>
                            <td>{order.customerName}</td>
                            {userInfo?.role === 'admin' && <td>{order.soldBy?.username || 'N/A'}</td>}
                            <td>{order.items.length}</td>
                            <td>Rs {(order.total || 0).toFixed(2)}</td> {/* Changed from $ to Rs */}
                            <td>
                              <span className={`badge bg-${getStatusBadgeColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>                            <td>
                              {/* Status Update Button - show if user can update this order */}
                              {(userInfo?.role === 'admin' || order.soldBy?._id === userInfo.id) && 
                               getAvailableStatuses(order.status, userInfo?.role === 'admin').length > 0 && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => openStatusModal(order)}
                                >
                                  {userInfo?.role === 'admin' ? 'Change Status' : 'Update Status'}
                                </Button>
                              )}
                              {/* Show "-" if no actions available */}
                              {(!((userInfo?.role === 'admin' || order.soldBy?._id === userInfo.id) && 
                                 getAvailableStatuses(order.status, userInfo?.role === 'admin').length > 0)) && (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (                <div className="text-center p-4">
                  <FaShoppingCart size={48} className="text-muted mb-3" />
                  <p className="text-muted">No orders found for {new Date(selectedDate).toLocaleDateString()}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        {userInfo?.role === 'admin' && (
          <Col md={6} className="mb-3">
            <Card>
              <Card.Header><FaChartPie className="me-2" />Sales by Representative</Card.Header>
              <Card.Body style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {finalSalesByRepData.labels.length > 0 ? 
                  <Pie data={finalSalesByRepData} options={{ responsive: true, maintainAspectRatio: false }} /> : <p>No sales data for chart.</p>}
              </Card.Body>
            </Card>
          </Col>
        )}
        <Col md={userInfo?.role === 'admin' ? 6 : 12} className="mb-3">
          <Card>
            <Card.Header><FaTags className="me-2" />Top 5 Selling Products (by Quantity)</Card.Header>
            <Card.Body style={{ minHeight: '300px' }}>
              {topSellingProductsData.labels.length > 0 ?
                <Bar data={topSellingProductsData} options={{ responsive: true, maintainAspectRatio: false }} /> : <p>No product sales data for chart.</p>}
            </Card.Body>
          </Card>
        </Col>      </Row>

      {/* Products Sold Table */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">{productsSoldTitle}</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Total Quantity Sold</th>
                      <th>Total Value Sold (Rs)</th> {/* Changed from $ to Rs */}
                    </tr>
                  </thead>
                  <tbody>
                    {productsSold.length > 0 ? productsSold.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.productName}</td>
                        <td>{item.totalQuantitySold}</td>
                        <td>Rs {(item.totalValueSold || 0).toFixed(2)}</td> {/* Changed from $ to Rs */}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          {selectedRepresentative ? "No products sold by this representative." : (userInfo?.role === 'representative' ? "You have not sold any products yet." : "No products sold yet.")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>        </Col>
      </Row>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={closeStatusModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p><strong>Order ID:</strong> {selectedOrder._id.slice(-8).toUpperCase()}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Current Status:</strong> <span className={`badge bg-${getStatusBadgeColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
              <p><strong>Total:</strong> Rs {(selectedOrder?.total || 0).toFixed(2)}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Select New Status:</Form.Label>
                <Form.Select 
                  value={selectedNewStatus} 
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  required
                  disabled={statusUpdateLoading} // Disable while loading
                >
                  <option value="">-- Select Status --</option>
                  {getAvailableStatuses(selectedOrder.status, userInfo?.role === 'admin').map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedNewStatus && (
                <div className="mt-3 p-3 bg-light rounded">
                  <p className="mb-1"><strong>Status Change Preview:</strong></p>
                  <p className="mb-0">
                    <span className={`badge bg-${getStatusBadgeColor(selectedOrder.status)} me-2`}>
                      {selectedOrder.status}
                    </span>
                    <strong className="mx-1">→</strong>
                    <span className={`badge bg-${getStatusBadgeColor(selectedNewStatus)} ms-1`}>
                      {selectedNewStatus}
                    </span>
                  </p>
                </div>
              )}
              {statusUpdateError && (
                <Alert variant="danger" className="mt-3">
                  {statusUpdateError}
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeStatusModal} disabled={statusUpdateLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={!selectedNewStatus || statusUpdateLoading}
          >
            {statusUpdateLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Updating...</> : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrdersPage;
