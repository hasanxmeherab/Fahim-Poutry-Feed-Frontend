import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';

const MakeSalePage = () => {
  // --- All your existing useState hooks remain the same ---
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleItems, setSaleItems] = useState([]); 
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [isRandomCustomer, setIsRandomCustomer] = useState(false);
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [randomCustomerName, setRandomCustomerName] = useState('');
  useEffect(() => {
    if (isRandomCustomer) {
      setIsCashPayment(true);
    }
  }, [isRandomCustomer]);
  
 const loadCustomers = async (inputValue) => {
    const response = await api.get(`/customers?search=${inputValue}`);
    return response.data.map(customer => ({
        value: customer._id,
        label: `${customer.name} - (Balance: ${customer.balance.toFixed(2)})`,
        ...customer // Attach the full customer object
    }));
  };

  const loadProducts = async (inputValue) => {
    const response = await api.get(`/products?search=${inputValue}`);
    return response.data.map(product => ({
        value: product._id,
        label: `${product.name} - (In Stock: ${product.quantity})`,
        ...product // Attach the full product object
    }));
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) {
        setError('Please select a product and enter a valid quantity.');
        return;
    }

    // The selectedProductId state now holds the full product object from react-select
    const productToAdd = selectedProductId; 

    setSaleItems([...saleItems, { ...productToAdd, quantity: Number(quantity) }]);
    
    // Reset the state to clear the selection for the next item
    setSelectedProductId(null); 
    setQuantity(1);
    setError(null);
};

  const handleRemoveItem = (itemIndexToRemove) => {
      setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
    };
  const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  
  // Replace the entire existing handleSubmitSale function with this one

  const handleSubmitSale = async () => {
    if (!isRandomCustomer && !selectedCustomerId) {
      setError('Please select a customer or mark as a random customer sale.');
      return;
    }
    if (saleItems.length === 0) {
      setError('Please add at least one item.');
      return;
    }

    const saleData = {
      isRandomCustomer: isRandomCustomer,
      isCashPayment: isCashPayment,
      items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
      randomCustomerName: randomCustomerName,
    };


    if (!isRandomCustomer) {
      saleData.customerId = selectedCustomerId.value;
    }

    try {
      const response = await api.post('/sales', saleData);
      const customerName = isRandomCustomer ? (randomCustomerName || 'Random Customer') : selectedCustomerId.name;      const balanceBefore = isRandomCustomer ? 0 : selectedCustomerId.balance;
      const balanceAfter = (isRandomCustomer || isCashPayment) ? balanceBefore : balanceBefore - response.data.totalAmount;


      const receiptData = {
        type: 'sale',
        customerName: customerName,
        items: saleItems,
        totalAmount: response.data.totalAmount,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        paymentMethod: isCashPayment ? 'Cash' : 'Credit',
        date: response.data.createdAt,
      };

      sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
      window.open('/receipt', '_blank');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete sale.');
    }
  };

  // --- The rest of your return() statement remains the same ---
  if (isLoading) return <p>Loading sale page...</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Make a New Sale</h1>

      {/* Customer Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>1. Select Customer</h3>
        <div style={{ marginBottom: '10px' }}>
            <label>
                <input
                    type="checkbox"
                    checked={isRandomCustomer}
                    onChange={(e) => setIsRandomCustomer(e.target.checked)}
                    style={{ marginRight: '10px' }}
                />
                Sell to Random Customer (Cash Only)
            </label>
        </div>

        {isRandomCustomer && (
          <div style={{ marginBottom: '15px' }}>
            <label>Random Customer Name (Optional):</label>
            <input
              type="text"
              value={randomCustomerName}
              onChange={(e) => setRandomCustomerName(e.target.value)}
              placeholder="Enter name for receipt..."
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
            />
          </div>
        )}

        <AsyncSelect
          cacheOptions
          loadOptions={loadCustomers}
          defaultOptions
          value={selectedCustomerId}
          onChange={(option) => setSelectedCustomerId(option)}
          placeholder="Type to search for a registered customer..."
          isDisabled={isRandomCustomer} // <-- Add this prop
        />
      </div>

      {/* Add Products Section */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
  <h3>2. Select Products</h3>
  <AsyncSelect
      cacheOptions
      loadOptions={loadProducts}
      defaultOptions
      onChange={(option) => setSelectedProductId(option)}
      placeholder="Type to search for a product..."
      key={saleItems.length}
  />

  {/* V-- This new div wraps the input and button --V */}
  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px' }}>
    <input 
        type="number" 
        value={quantity} 
        onChange={(e) => setQuantity(e.target.value)} 
        min="1" 
        style={{ padding: '8px', width: '80px' }}
    />
    <button onClick={handleAddItem} className="button-primary" style={{ marginLeft: '10px' }}>
        Add Item
    </button>
  </div>
</div>
      
      {/* Sale Items (Cart) Display */}
      <div>
        <h3>3. Sale Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f2f2f2' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', color: 'black' }}>Product</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', color: 'black' }}>Quantity</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', color: 'black' }}>Price</th>
            <th style={{ padding: '8px', border: '1-px solid #ddd', textAlign: 'left', color: 'black' }}>Subtotal</th>
          </tr></thead>
          <tbody>
            {saleItems.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>TK{item.price.toFixed(2)}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>TK{(item.price * item.quantity).toFixed(2)}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button onClick={() => handleRemoveItem(index)} className="button-danger" style={{padding: '5px 10px', lineHeight: '1'}}>
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ textAlign: 'right', marginTop: '20px' }}>Total: TK {totalAmount.toFixed(2)}</h2>
      </div>

      {error && <p style={{ color: 'red', marginTop: '20px' }}>Error: {error}</p>}
      
      <div style={{ marginTop: '20px', fontSize: '1.1em' }}>
        <label>
          <input
            type="checkbox"
            checked={isCashPayment}
            onChange={(e) => setIsCashPayment(e.target.checked)}
            disabled={isRandomCustomer} // <-- Add this prop
            style={{ marginRight: '10px' }}
          />
          Paid in Cash 💵
        </label>
      </div>

      {/* Finalize Sale Button */}
      <button 
        onClick={handleSubmitSale} 
        style={{ padding: '15px 25px', background: 'darkgreen', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginTop: '20px' }}>
        Complete Sale
      </button>
    </div>
  );
};

export default MakeSalePage;