import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from './api/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Core Components
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Page Components
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import SalesReportPage from './pages/SalesReportPage';
import EditProductPage from './pages/EditProductPage';
import EditCustomerPage from './pages/EditCustomerPage';
import CustomerListPage from './pages/CustomerListPage';
import AddCustomerPage from './pages/AddCustomerPage';
import ProductListPage from './pages/ProductListPage';
import AddProductPage from './pages/AddProductPage';
import MakeSalePage from './pages/MakeSalePage';
import ReceiptPage from './pages/ReceiptPage';
import HistoryPage from './pages/HistoryPage';
import BatchReportPage from './pages/BatchReportPage';
import WholesalePage from './pages/WholesalePage';
import AddWholesaleBuyerPage from './pages/AddWholesaleBuyerPage';
import EditWholesaleBuyerPage from './pages/EditWholesaleBuyerPage';
import WholesaleBuyerDetailsPage from './pages/WholesaleBuyerDetailsPage';
import AddWholesaleProductPage from './pages/AddWholesaleProductPage';


// A simple home page component for our root path (Dashboard)
// The corrected HomePage component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-cards">
        <div className="stat-card">
          <h3>Sales Today</h3>
          <p>TK {stats.salesToday.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Customers with Debt</h3>
          <p>{stats.negativeBalanceCustomers}</p>
        </div>
        <div className="stat-card">
          <h3>Products Low in Stock</h3>
          <p>{stats.lowStockProducts}</p>
        </div>
      </div>

      <h2>Recent Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {stats.recentTransactions.map((t) => (
            <tr key={t._id}>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
              <td>{t.type}</td>
              <td>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// This component contains the main layout and logic
const AppContent = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('userToken');

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

    return (
        <div>
          <div id="app-header" style={{ padding: '15px', backgroundColor: '#f4f7f9', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
            <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>Fahim Poultry Feed</h2>
        </div>
            {token && ( // Only show the navigation bar if a user is logged in
                <nav style={{ 
                    padding: '10px 20px', 
                    background: '#333', 
                    color: 'white', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <Link to="/" style={{ color: 'white', marginRight: '15px' }}>Dashboard</Link>
                        <Link to="/customers" style={{ color: 'white', marginRight: '15px' }}>Customers</Link>
                        <Link to="/inventory" style={{ color: 'white', marginRight: '15px' }}>Inventory</Link>                 
                        <Link to="/make-sale" style={{ color: 'white', marginRight: '15px', fontWeight: 'bold' }}>Make a Sale</Link>
                        <Link to="/wholesale" style={{ color: 'white', marginRight: '15px' }}>Wholesale</Link>                        
                        <Link to="/reports/sales" style={{ color: 'white', marginRight: '15px' }}>Sales Report</Link>
                        <Link to="/history" style={{ color: 'white', marginRight: '15px' }}>History</Link>
                        

                        

                    </div>
                    <button 
                        onClick={handleLogout} 
                        style={{ 
                            background: '#555', 
                            color: 'white', 
                            border: '1px solid #777',
                            padding: '5px 10px',
                            cursor: 'pointer' 
                        }}>
                        Logout
                    </button>
                </nav>
            )}
            <main style={{ padding: '20px' }}>
                <Routes>
                    {/* Public Route: Everyone can see the login page */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Protected Routes: Only logged-in users can access these */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/customers" element={<CustomerListPage />} />
                        <Route path="/add-customer" element={<AddCustomerPage />} />
                        <Route path="/inventory" element={<ProductListPage />} />
                        <Route path="/add-product" element={<AddProductPage />} />
                        <Route path="/make-sale" element={<MakeSalePage />} />
                        <Route path="/receipt" element={<ReceiptPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/edit-customer/:id" element={<EditCustomerPage />} />
                        <Route path="/edit-product/:id" element={<EditProductPage />} />
                        <Route path="/reports/sales" element={<SalesReportPage />} />
                        <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                        <Route path="/reports/batch/:id" element={<BatchReportPage />} />
                        <Route path="/wholesale" element={<WholesalePage />} />                        
                        <Route path="/add-wholesale-buyer" element={<AddWholesaleBuyerPage />} />
                        <Route path="/edit-wholesale-buyer/:id" element={<EditWholesaleBuyerPage />} />
                        <Route path="/wholesale-buyers/:id" element={<WholesaleBuyerDetailsPage />} />
                        <Route path="/add-wholesale-product" element={<AddWholesaleProductPage />} />
                            
                    </Route>
                </Routes>
            </main>

            <footer className="app-footer">
  <span>&copy; 2025 Fahim Poultry Feed | All rights reserved</span>
  <span>Developed by Meherab Hasan Fahim</span>
</footer>    

        </div>
    );
}

// The main App component is now just a simple wrapper
function App() {
    return <AppContent />;
}

export default App;