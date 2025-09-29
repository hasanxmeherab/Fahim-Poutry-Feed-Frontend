import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';

const EditCustomerPage = () => {
  const { id } = useParams(); // Gets the customer ID from the URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the specific customer's data when the page loads
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/customers/${id}`);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch customer data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [id]); // Re-run if the ID in the URL changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/customers/${id}`, formData);
      alert('Customer updated successfully!');
      navigate('/customers'); // Go back to the customer list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update customer.');
    }
  };

  if (isLoading) return <p>Loading customer details...</p>;
  if (error && !formData.name) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Edit Customer</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone:</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="button-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditCustomerPage;