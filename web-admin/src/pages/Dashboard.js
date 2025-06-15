import axios from 'axios';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import { useContext, useEffect, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { FaBoxes, FaChartLine, FaShoppingCart, FaUsers } from 'react-icons/fa';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStock: 0,
    categories: 0,
    totalValue: 0,
  });
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch all stock items
        const stockResponse = await axios.get('/api/stock');
        const stockItems = stockResponse.data;
        
        const totalValue = stockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = stockItems.filter(item => item.quantity < 10);
        const categories = [...new Set(stockItems.map(item => item.category))];
        
        setStockData(stockItems);

        setStats({
          totalStock: stockItems.length,
          lowStock: lowStockItems.length,
          categories: categories.length,
          totalValue: totalValue.toFixed(2),
        });
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };    fetchDashboardData();
  }, [userInfo]);

  // Prepare chart data for stock
  const chartData = {
    labels: stockData.slice(0, 5).map(item => item.name),
    datasets: [
      {
        label: 'Stock Quantity',
        data: stockData.slice(0, 5).map(item => item.quantity),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <p className="text-muted">
          Welcome, {userInfo?.username} | Role: {userInfo?.role}
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stats-card" style={{borderLeftColor: '#4caf50'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted">Total Stock Items</h6>
                      <h3>{stats.totalStock}</h3>
                    </div>
                    <div className="stats-icon text-success">
                      <FaBoxes />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="stats-card" style={{borderLeftColor: '#f44336'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted">Low Stock Items</h6>
                      <h3>{stats.lowStock}</h3>
                    </div>
                    <div className="stats-icon text-danger">
                      <FaShoppingCart />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="stats-card" style={{borderLeftColor: '#ff9800'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted">Categories</h6>
                      <h3>{stats.categories}</h3>
                    </div>
                    <div className="stats-icon text-warning">
                      <FaUsers />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
              <Col md={3}>
              <Card className="stats-card" style={{borderLeftColor: '#2196f3'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted">Total Value (Stock)</h6>
                      <h3>${stats.totalValue}</h3>
                    </div>
                    <div className="stats-icon text-primary">
                      <FaChartLine />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>          </Row>

          {/* Stock Chart */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Stock Overview</h5>
                </Card.Header>
                <Card.Body>
                  {stockData.length > 0 ? (
                    <Bar 
                      data={chartData} 
                      options={{ 
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Top 5 Stock Items by Quantity'
                          }
                        }
                      }} 
                    />
                  ) : (
                    <p className="text-center">No stock data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* The original "Recent Stock Items" section might be re-added here if needed for all users */}
          {/* For example, to show top 5 stock items: */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Top Stock Items (by Quantity)</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.slice(0, 5).map((item) => (
                          <tr key={item._id}>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                        {stockData.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center">No stock items found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
