import React, { useState } from 'react';
import api from '../api/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await api.post('/users/login', formData);
        // On successful login, store the token
        localStorage.setItem('userToken', response.data.token);
        // Reload the page to apply the login state
        window.location.href = '/';
    } catch (err) {
        setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Username</label>
          <input type="text" name="username" required onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input type="password" name="password" required onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Login</button>
      </form>
    </div>
  );
};

export default LoginPage;