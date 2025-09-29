import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const AddWholesaleBuyerPage = () => {
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', address: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wholesale-buyers', formData);
      navigate('/wholesale-buyers');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add buyer.');
    }
  };

  return (
    <div>
      <h1>Add New Wholesale Buyer</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Contact Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Business Name:</label>
          <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} />
        </div>
        <div>
          <label>Phone:</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div>
          <label>Address:</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="button-primary">Save Buyer</button>
      </form>
    </div>
  );
};

export default AddWholesaleBuyerPage;