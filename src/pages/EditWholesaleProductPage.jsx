// File: Fahim-Poutry-Feed-Frontend/src/pages/EditWholesaleProductPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';

const EditWholesaleProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // --- THIS IS THE CORRECTED FETCH LOGIC ---
        const response = await api.get(`/wholesale-products/${id}`);
        setName(response.data.name);
      } catch (err) {
        setError('Failed to fetch product data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/wholesale-products/${id}`, { name });
      alert('Product updated successfully!');
      navigate('/wholesale');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product.');
    }
  };

  if (isLoading) return <p>Loading product...</p>;
  if (error && !name) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Edit Wholesale Product</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Product Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="button-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditWholesaleProductPage;