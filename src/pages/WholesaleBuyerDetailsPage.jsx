import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';

const WholesaleBuyerDetailsPage = () => {
    const { id } = useParams();
    const [buyer, setBuyer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [wholesaleProducts, setWholesaleProducts] = useState([]);
    const [saleItems, setSaleItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', quantity: '1', weight: '', pricePerKg: '' });
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [formError, setFormError] = useState(''); // <-- ADDED: This was missing

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const [buyerRes, transRes, productsRes] = await Promise.all([
                api.get(`/wholesale-buyers/${id}`),
                api.get(`/transactions/wholesale-buyer/${id}?page=${page}`),
                api.get('/wholesale-products')
            ]);
            setBuyer(buyerRes.data);
            setTransactions(transRes.data.transactions);
            setTotalPages(transRes.data.totalPages);
            setWholesaleProducts(productsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id, page]);

    const newItemTotalPrice = (parseFloat(newItem.weight) || 0) * (parseFloat(newItem.pricePerKg) || 0);
    const saleTotal = saleItems.reduce((acc, item) => acc + item.totalPrice, 0);

    const handleNewItemChange = (e) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const handleAddItemToSale = () => {
        if (!newItem.name || !newItem.quantity || !newItem.weight || !newItem.pricePerKg) {
            setFormError('All fields are required for each item.');
            return;
        }
        const itemToAdd = { ...newItem, totalPrice: newItemTotalPrice };
        setSaleItems([...saleItems, itemToAdd]);
        setNewItem({ name: '', quantity: '1', weight: '', pricePerKg: '' });
        setFormError('');
    };

    const handleRemoveItemFromSale = (itemIndexToRemove) => {
        setSaleItems(saleItems.filter((_, index) => index !== itemIndexToRemove));
    };

    const handleViewReceipt = (transaction) => {
        let receiptData = {};
        const buyerName = buyer ? buyer.name : 'N/A';
        if (transaction.type === 'WHOLESALE_SALE') {
            receiptData = { type: 'wholesale_sale', customerName: buyerName, items: transaction.customItems, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else if (['DEPOSIT', 'WITHDRAWAL'].includes(transaction.type)) {
            receiptData = { type: 'deposit', customerName: buyerName, depositAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else { return; }
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');
    };

    const handleSubmitSale = async () => {
    if (saleItems.length === 0) {
        setFormError('You must add at least one item to the sale.');
        return;
    }
    const payload = {
        wholesaleBuyerId: id,
        items: saleItems.map(item => ({
            name: item.name,
            quantity: Number(item.quantity) || 0,
            weight: Number(item.weight) || 0,
            price: item.totalPrice,
        })),
        isCashPayment: isCashPayment,
    };
    try {
        // MODIFIED: Capture the response from the API
        const response = await api.post('/sales/wholesale', payload);
        const newTransaction = response.data; // This is the new transaction object

        toast.success('Wholesale sale created successfully!');
        
        // --- NEW: Logic to open the receipt ---
        const receiptData = {
            type: 'wholesale_sale',
            customerName: buyer.name,
            items: newTransaction.customItems,
            totalAmount: newTransaction.amount,
            balanceBefore: newTransaction.balanceBefore,
            balanceAfter: newTransaction.balanceAfter,
            date: newTransaction.createdAt,
        };
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');

        setSaleItems([]);
        fetchDetails(); // Refresh the page data

    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to complete sale.');
    }
};

    if (isLoading) return <p>Loading details...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!buyer) return <p>Buyer not found.</p>;

    return (
        <div>
            <div className="page-header"><h1>{buyer.name}</h1></div>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h3>Buyer Information</h3>
                <p><strong>Business Name:</strong> {buyer.businessName || 'N/A'}</p>
                <p><strong>Phone:</strong> {buyer.phone}</p>
                <p><strong>Current Balance:</strong> TK {buyer.balance.toFixed(2)}</p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h3>Make a Wholesale Sale 🛒</h3>
                
                {/* CLEANED UP: Input fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '10px' }}>
                    <select name="name" value={newItem.name} onChange={handleNewItemChange}>
                        <option value="" disabled>-- Select a Product --</option>
                        {wholesaleProducts.map(product => (
                            <option key={product._id} value={product.name}>{product.name}</option>
                        ))}
                    </select>
                    <input type="number" name="quantity" placeholder="Quantity" value={newItem.quantity} onChange={handleNewItemChange} />
                    <input type="number" name="weight" placeholder="Weight (kg)" value={newItem.weight} onChange={handleNewItemChange} />
                    <input type="number" name="pricePerKg" placeholder="Price/kg (TK)" value={newItem.pricePerKg} onChange={handleNewItemChange} />
                </div>

                {/* CLEANED UP: Total and Add Item button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginRight: '20px' }}>
                        Total: TK {newItemTotalPrice.toFixed(2)}
                    </div>
                    <button onClick={handleAddItemToSale} className="button-primary">Add Item</button>
                </div>

                {saleItems.length > 0 && (
                    <div style={{marginTop: '20px'}}>
                        <h4>Items to Sell</h4>
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Qty</th><th>Weight</th><th>Price/kg</th><th>Total Price</th><th>Remove</th></tr>
                            </thead>
                            <tbody>
                                {saleItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.weight} kg</td>
                                        <td>TK {item.pricePerKg}</td>
                                        <td>TK {item.totalPrice.toFixed(2)}</td>
                                        <td><button onClick={() => handleRemoveItemFromSale(index)} className="button-danger" style={{padding: '5px 10px'}}>X</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3 style={{textAlign: 'right', marginTop: '15px'}}>Final Total: TK {saleTotal.toFixed(2)}</h3>
                    </div>
                )}
                
                <div style={{ marginTop: '15px', fontSize: '1.1em' }}>
                    <label>
                        <input type="checkbox" checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} style={{ marginRight: '10px' }}/>
                        Paid in Cash 💵
                    </label>
                </div>
                
                {formError && <p style={{ color: 'red', marginTop: '10px' }}>{formError}</p>}
                <button onClick={handleSubmitSale} className="button-success" style={{width: '100%', marginTop: '20px', padding: '12px'}}>
                    Complete Sale
                </button>
            </div>

            <div>
                <h2>Transaction History</h2>
                <table>
    _                <thead>
                        <tr><th>Date</th><th>Type</th><th>Details</th><th>Amount (TK)</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {transactions.map((t) => (
                            <tr key={t._id}>
                                <td>{new Date(t.createdAt).toLocaleString()}</td>
                                <td>{t.type}</td>
                                <td>{t.notes}</td>
                                <td style={{ color: ['WITHDRAWAL', 'WHOLESALE_SALE'].includes(t.type) ? 'red' : 'green' }}>
                                  {t.amount.toFixed(2)}
                                </td>
                                <td>
                                    {['WHOLESALE_SALE', 'DEPOSIT', 'WITHDRAWAL'].includes(t.type) && (
                                        <button onClick={() => handleViewReceipt(t)} className="button-primary">
                                            View Receipt
                                        </button>
                                    )}
                              </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <ReactPaginate
                        previousLabel={'< Previous'}
                        nextLabel={'Next >'}
                        pageCount={totalPages}
                        onPageChange={(data) => setPage(data.selected + 1)}
                        containerClassName={'pagination'}
                        activeClassName={'active'}
                        forcePage={page - 1}
                    />
                )}
            </div>
        </div>
    );
};

export default WholesaleBuyerDetailsPage;