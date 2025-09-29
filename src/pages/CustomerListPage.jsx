import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';

const CustomerListPage = () => {
  // State for page data and search
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for the modal
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [modalType, setModalType] = useState(''); // 'deposit' or 'withdrawal'
  const [amount, setAmount] = useState('');
  
  // Effect for fetching/searching customers with a debounce
  useEffect(() => {
    setIsLoading(true); 

    const timerId = setTimeout(() => {
      api.get(`/customers?search=${searchTerm}`)
        .then(response => {
          setCustomers(response.data);
          setError(null);
        })
        .catch(err => {
          setError('Failed to fetch customers.');
          setCustomers([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Modal control functions
  const openModal = (customer, type) => {
    setCurrentCustomer(customer);
    setModalType(type);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setAmount('');
    setError(null); // Clear modal-specific errors
    setCurrentCustomer(null);
  };

  // Handles form submission for both deposit and withdrawal
  const handleModalSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        setError("Please enter a valid amount.");
        return;
    }

    const endpoint = modalType === 'deposit' ? 'deposit' : 'withdraw';
    try {
        const response = await api.patch(`/customers/${currentCustomer._id}/${endpoint}`, { amount: numAmount });
        const updatedCustomer = response.data;
        
        setCustomers(customers.map(c => c._id === currentCustomer._id ? updatedCustomer : c));
        
        alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
        closeModal();
    } catch (err) {
        // Use setError to display the error in the modal
        setError(err.response?.data?.error || `Failed to process ${modalType}.`);
    }
  };
  
  // Handle delete customer
const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        try {
            await api.delete(`/customers/${customerId}`);
            // Update the UI instantly by removing the customer from the state
            setCustomers(customers.filter(c => c._id !== customerId));
            alert('Customer deleted successfully!');
        } catch (err) {
            alert('Failed to delete customer.');
        }
    }
};

  // The main return statement with improved loading UI
  if (error && customers.length === 0) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Customer List</h1>
        <Link to="/add-customer" className="button-link button-success">
          + Add New Customer
        </Link>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>

      <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Transaction Modal"
          style={{ 
              content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '400px' }
          }}
      >
          <h2>{modalType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'} for {currentCustomer?.name}</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleModalSubmit(); }}>
              <div>
                  <label>Amount:</label>
                  <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                  />
              </div>
              {/* This error state is used for modal validation */}
              {error && <p style={{color: 'red'}}>{error}</p>}
              <div style={{marginTop: '20px'}}>
                  <button type="submit" className="button-primary">Confirm</button>
                  <button type="button" onClick={closeModal} style={{marginLeft: '10px'}}>Cancel</button>
              </div>
          </form>
      </Modal>

      {isLoading && customers.length === 0 && <p>Loading customers...</p>}

      <table style={{ transition: 'opacity 0.3s', opacity: isLoading ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Balance (TK)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <tr key={customer._id}>
                <td>
                  <Link to={`/customers/${customer._id}`} style={{ textDecoration: 'underline', color: '#2c3e50', fontWeight: 'bold' }}>
                    {customer.name}
                  </Link>
                </td>
                <td>{customer.phone}</td>
                <td style={{ color: customer.balance < 0 ? 'red' : 'inherit' }}>
                  {customer.balance.toFixed(2)}
                </td>
                <td>
    <button onClick={() => openModal(customer, 'deposit')} className="button-primary">Deposit</button>
    <button onClick={() => openModal(customer, 'withdrawal')} className="button-warning">Withdraw</button>
    
    <Link 
    to={`/edit-customer/${customer._id}`} 
    className="button-link button-info">
    Edit
</Link>
    <button onClick={() => handleDelete(customer._id)} className="button-danger">Delete</button>
</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                {!isLoading && "No customers found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerListPage;