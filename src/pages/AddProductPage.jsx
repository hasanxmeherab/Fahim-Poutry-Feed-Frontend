import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const AddProductPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await api.post('/products', formData);
      navigate('/inventory'); // Redirect to inventory list on success
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Add New Product</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Product Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>SKU (Stock Keeping Unit):</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Price ($):</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Quantity in Stock:</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Product
        </button>
      </form>
    </div>
  );
};

export default AddProductPage;