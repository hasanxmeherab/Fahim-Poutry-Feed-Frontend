import React, { useState } from 'react';
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';

const AddCustomerPage = () => {
  // State to hold the form input values
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook to redirect the user

  // Function to update state when user types in an input field
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission (page reload)
    setError(null); // Clear previous errors

    try {
      // Send a POST request to the backend API to create a new customer
      await api.post('/customers', formData);
      // If successful, navigate back to the customer list page
      navigate('/customers');
    } catch (err) {
      // If there's an error, display it
      setError(err.response?.data?.error || 'Failed to add customer.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Add New Customer</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Customer
        </button>
      </form>
    </div>
  );
};

export default AddCustomerPage;