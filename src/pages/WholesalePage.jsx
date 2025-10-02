// File: Fahim-Poutry-Feed-Frontend/src/pages/WholesalePage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';

const WholesalePage = () => {
  // ... (all existing state and functions remain the same)
  const [buyers, setBuyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentBuyer, setCurrentBuyer] = useState(null);
  const [modalType, setModalType] = useState('');
  const [amount, setAmount] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
      setIsLoading(true);
      try {
          const [buyersRes, productsRes] = await Promise.all([
              api.get(`/wholesale-buyers?search=${searchTerm}`),
              api.get('/wholesale-products')
          ]);
          setBuyers(buyersRes.data);
          setProducts(productsRes.data);
          setError(null);
      } catch (err) {
          setError('Failed to fetch data.');
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchData();
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      await api.delete(`/wholesale-buyers/${id}`);
      fetchData();
    }
  };
  
  // --- NEW FUNCTION: To delete a wholesale product ---
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
        try {
            await api.delete(`/wholesale-products/${productId}`);
            setProducts(products.filter(p => p._id !== productId));
            alert('Product deleted successfully!');
        } catch (err) {
            console.error("Delete failed:", err.response?.data || err.message);
            alert('Failed to delete product. Check the console for more details.');
        }
    }
  };

  // ... (modal functions remain the same)
  const openModal = (buyer, type) => {
    setCurrentBuyer(buyer);
    setModalType(type);
    setModalIsOpen(true);
    setModalError('');
    setAmount('');
  };
  const closeModal = () => setModalIsOpen(false);
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        setModalError("Please enter a valid amount.");
        return;
    }
    const endpoint = `/wholesale-buyers/${currentBuyer._id}/${modalType}`;
    try {
      await api.patch(endpoint, { amount: numAmount });
      alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
      closeModal();
      fetchData(); // Refresh list
    } catch (err) { 
        setModalError(err.response?.data?.message || 'Transaction failed.');
    }
  };


  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      {/* ... (buyers section remains the same) ... */}
      <div className="page-header">
        <h1>Wholesale Buyers</h1>
        <Link to="/add-wholesale-buyer" className="button-link button-success">+ Add New Buyer</Link>
      </div>
      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          placeholder="Search by name, business, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>
      {isLoading && buyers.length === 0 && <p>Loading buyers...</p>}
      <table style={{ transition: 'opacity 0.3s', opacity: isLoading ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>Name</th>
            <th>Business Name</th>
            <th>Phone</th>
            <th>Balance (TK)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((buyer) => (
            <tr key={buyer._id}>
              <td style={{ textAlign: 'left' }}>
                  <Link to={`/wholesale-buyers/${buyer._id}`} style={{ fontWeight: 'bold', color: '#2c3e50ff' }}>
                      {buyer.name}
                  </Link>
              </td>
              <td>{buyer.businessName}</td>
              <td>{buyer.phone}</td>
              <td style={{ color: buyer.balance < 0 ? 'red' : 'inherit' }}>
                  {buyer.balance.toFixed(2)}
              </td>
              <td>
                  <button onClick={() => openModal(buyer, 'deposit')} className="button-primary">Deposit</button>
                  <button onClick={() => openModal(buyer, 'withdrawal')} className="button-warning">Withdraw</button>                  
                  <Link to={`/edit-wholesale-buyer/${buyer._id}`} className="button-link button-primary">Edit</Link>
                  <button onClick={() => handleDelete(buyer._id)} className="button-danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* --- MODIFIED PRODUCTS SECTION --- */}
      <div className="page-header" style={{ marginTop: '40px' }}>
        <h1>Wholesale Products</h1>
        <Link to="/add-wholesale-product" className="button-link button-success">+ Add New Product</Link>
      </div>
      <table>
        <thead>
            <tr>
                <th>Product Name</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
                <td>{product.name}</td>
                <td>
                    <Link to={`/edit-wholesale-product/${product._id}`} className="button-link button-info">
                        Edit
                    </Link>
                    <button onClick={() => handleDeleteProduct(product._id)} className="button-danger">
                        Delete
                    </button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ... (modal component remains the same) ... */}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Transaction Modal" style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)', width: '400px' } }}>
          <h2>{modalType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'} for {currentBuyer?.name}</h2>
          <form onSubmit={handleModalSubmit}>
              <div>
                <label>Amount:</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" required/>
              </div>
              {modalError && <p style={{color: 'red'}}>{modalError}</p>}
              <div style={{marginTop: '20px'}}>
                  <button type="submit" className="button-primary">Confirm</button>
                  <button type="button" onClick={closeModal} style={{marginLeft: '10px'}}>Cancel</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default WholesalePage;