import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';

// Set the app element for the modal to avoid accessibility issues
Modal.setAppElement('#root'); // Or whichever element is the root of your app

const ProductListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [modalType, setModalType] = useState(''); // 'add' or 'remove'
  const [quantity, setQuantity] = useState('');

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [formError, setFormError] = useState(null);

  // This useEffect handles the debounced search functionality.
  useEffect(() => {
    setIsLoading(true);
    setApiError(null); // Clear previous API errors on new search

    const timerId = setTimeout(() => {
      api.get(`/products?search=${searchTerm}`)
        .then(response => {
          setProducts(response.data);
        })
        .catch(err => {
          setApiError('Failed to fetch products. Please try again later.');
          setProducts([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500); // 500ms debounce time

    // Cleanup function to clear the timeout when searchTerm changes or component unmounts
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const openModal = (product, type) => {
    setCurrentProduct(product);
    setModalType(type);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setQuantity('');
    setFormError(null); // Clear form-level errors
    setCurrentProduct(null);
  };

  const handleModalSubmit = async () => {
    const numQuantity = parseInt(quantity, 10);
    const isRemove = modalType === 'remove';
    
    // Client-side validation
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setFormError("Please enter a valid quantity greater than 0.");
      return;
    }
    
    // Additional validation for removing stock
    if (isRemove && numQuantity > currentProduct.quantity) {
      setFormError(`Cannot remove more than the available stock (${currentProduct.quantity}).`);
      return;
    }

    const endpoint = isRemove ? 'removestock' : 'addstock';
    const body = isRemove ? { removeQuantity: numQuantity } : { addQuantity: numQuantity };

    try {
      const response = await api.patch(`/products/${currentProduct._id}/${endpoint}`, body);
      setProducts(products.map(p => p._id === currentProduct._id ? response.data : p));
      alert(`Stock ${isRemove ? 'removed' : 'added'} successfully!`);
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.error || `Failed to process stock change.`);
    }
  };


const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
        try {
            await api.delete(`/products/${productId}`);
            setProducts(products.filter(p => p._id !== productId));
            alert('Product deleted successfully!');
        } catch (err) {
            alert('Failed to delete product.');
        }
    }
}; 

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <Link to="/add-product" className="button-link button-success">+ Add New Product</Link>
      </div>

      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Stock Modal"
        style={{
          content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '400px' }
        }}
      >
        <h2>{modalType === 'add' ? 'Add Stock' : 'Remove Stock'} for {currentProduct?.name}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleModalSubmit(); }}>
          <div>
            <label>Quantity:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="button-primary">Confirm</button>
            <button type="button" onClick={closeModal} style={{ marginLeft: '10px' }}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Display API error if it exists and there are no products to show */}
      {apiError && products.length === 0 && <p style={{ color: 'red' }}>{apiError}</p>}

      {/* Display loading message only on the initial load */}
      {isLoading && products.length === 0 && <p>Loading inventory...</p>}

      <table style={{ transition: 'opacity 0.3s', opacity: isLoading ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Price (TK)</th>
            <th>Quantity in Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.price.toFixed(2)}</td>
                <td>{product.quantity}</td>
                <td>
                  <button onClick={() => openModal(product, 'add')} className="button-primary">
                    Add Stock</button>
                  <button onClick={() => openModal(product, 'remove')} className="button-danger">
                    Remove Stock</button>
                  <Link to={`/edit-product/${product._id}`} className="button-link button-info">
                  Edit</Link>
    <button onClick={() => handleDelete(product._id)} className="button-danger">
      Delete
      </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                {!isLoading && !apiError && "No products found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductListPage;