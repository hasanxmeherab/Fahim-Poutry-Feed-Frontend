import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const AddWholesaleProductPage = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Product name is required.');
      return;
    }
    try {
      await api.post('/wholesale-products', { name });
      navigate('/wholesale'); // Go back to the main wholesale page
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product.');
    }
  };

  return (
    <div>
      <h1>Add New Wholesale Product</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Product Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="button-primary" style={{ marginTop: '15px' }}>
          Save Product
        </button>
      </form>
    </div>
  );
};

export default AddWholesaleProductPage;