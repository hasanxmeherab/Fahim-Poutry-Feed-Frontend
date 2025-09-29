import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';

const EditWholesaleBuyerPage = () => {
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', address: '' });
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchBuyer = async () => {
      const { data } = await api.get(`/wholesale-buyers/${id}`);
      setFormData(data);
    };
    fetchBuyer();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Attempting to update with data:", formData); // Log what you're sending

  // ... inside handleSubmit ...
      try {
    await api.patch(`/wholesale-buyers/${id}`, formData, { /* headers */ });

    navigate('/wholesale'); // <-- This is the correct path to your main wholesale page

  } catch (err) {

    // This will log the ENTIRE error object to the console
    console.error("UPDATE FAILED:", err); 
   
    // This will log the specific error message from your backend, if it exists
    console.error("Server error message:", err.response?.data); 

    alert('Failed to update buyer. Check the console (F12) for more details.');
  }
};

  return (
        <div>
        <h1>Edit Wholesale Buyer</h1>
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
            <button type="submit" className="button-primary" style={{marginTop: '15px'}}>Update Buyer</button>
        </form>
        </div>
    );
    };

export default EditWholesaleBuyerPage;