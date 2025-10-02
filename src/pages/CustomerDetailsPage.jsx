import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams, Link } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Modal from 'react-modal';
import ReactPaginate from 'react-paginate';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState('');

    // Form state
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [formError, setFormError] = useState('');
    const [buyModalIsOpen, setBuyModalIsOpen] = useState(false);
    const [buyData, setBuyData] = useState({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
    const [isCashPayment, setIsCashPayment] = useState(false);

    // Batch Totals state
    const [totalSold, setTotalSold] = useState(0);
    const [totalBought, setTotalBought] = useState(0);
    const [totalChickens, setTotalChickens] = useState(0);
    const [totalDiscounts, setTotalDiscounts] = useState(0);

    // Product Summary state
    const [productSummary, setProductSummary] = useState([]);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

    // Discount state
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountData, setDiscountData] = useState({ description: '', amount: '' });

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    
    useEffect(() => {
        setIsLoading(true);
        const fetchInitialData = async () => {
            try {
                const [customerRes, batchesRes] = await Promise.all([
                    api.get(`/customers/${id}`),
                    api.get(`/batches/customer/${id}`)
                ]);
                setCustomer(customerRes.data);
                setBatches(batchesRes.data);
                const activeBatch = batchesRes.data.find(b => b.status === 'Active');
                if (activeBatch) {
                    setSelectedBatchId(activeBatch._id);
                } else if (batchesRes.data.length > 0) {
                    setSelectedBatchId(batchesRes.data[0]._id);
                }
            } catch (err) {
                setError('Failed to fetch customer data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [id]);

    useEffect(() => {
        if (!selectedBatchId) return;

        const fetchTransactions = async () => {
            let queryString = `/transactions/batch/${selectedBatchId}?page=${page}`;
            if (filterDate) {
                queryString += `&date=${filterDate}`;
            }

            try {
                const response = await api.get(queryString);
                setTransactions(response.data.transactions);
                setTotalPages(response.data.totalPages);
                setTotalSold(response.data.totalSoldInBatch);
                setTotalBought(response.data.totalBoughtInBatch);
                setTotalChickens(response.data.totalChickensBought);
                setProductSummary(response.data.productSummary || []);
                setTotalDiscounts(response.data.totalDiscounts || 0);
            } catch (err) {
                console.error("Failed to fetch transactions for batch", err);
                setTransactions([]);
            }
        };
        
        fetchTransactions();
    }, [selectedBatchId, page, filterDate]);

    const handleDiscountSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const response = await api.post(`/batches/${selectedBatchId}/discount`, discountData);
            setBatches(batches.map(b => b._id === selectedBatchId ? response.data : b));
            const customerRes = await api.get(`/customers/${id}`);
            setCustomer(customerRes.data);
            setTotalDiscounts(prev => prev + parseFloat(discountData.amount));
            closeDiscountModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to add discount.');
        }
    };
    
    const handleRemoveDiscount = async (discountId) => {
        if (!window.confirm('Are you sure you want to remove this discount? This will update the customer balance.')) return;
        
        try {
            const response = await api.delete(`/batches/${selectedBatchId}/discount/${discountId}`);
            const removedDiscountAmount = batches.find(b => b._id === selectedBatchId)
                                            ?.discounts.find(d => d._id === discountId)?.amount || 0;
            
            setBatches(batches.map(b => b._id === selectedBatchId ? response.data : b));
            const customerRes = await api.get(`/customers/${id}`);
            setCustomer(customerRes.data);
            setTotalDiscounts(prev => prev - removedDiscountAmount);
        } catch (err) {
            alert('Failed to remove discount.');
            console.error(err);
        }
    };

    const openDiscountModal = () => {
        setDiscountData({ description: '', amount: '' });
        setFormError('');
        setIsDiscountModalOpen(true);
    };

    const closeDiscountModal = () => {
        setIsDiscountModalOpen(false);
    };

    const handleDiscountChange = (e) => {
        setDiscountData({ ...discountData, [e.target.name]: e.target.value });
    };

    const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const buyTotal = (parseFloat(buyData.weight) || 0) * (parseFloat(buyData.pricePerKg) || 0);

    const loadProducts = useCallback(async (inputValue) => {
        const response = await api.get(`/products?search=${inputValue}`);
        return response.data.map(product => ({
            value: product._id,
            label: `${product.name} - (In Stock: ${product.quantity})`,
            ...product
        }));
    }, []);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0) {
            setFormError('Please select a product and enter a valid quantity.');
            return;
        }
        setSaleItems([...saleItems, { ...selectedProduct, quantity: Number(quantity) }]);
        setSelectedProduct(null);
        setQuantity(1);
        setFormError('');
    };

    const handleRemoveItem = (itemIndexToRemove) => {
        setSaleItems(saleItems.filter((_, index) => index !== itemIndexToRemove));
    };

    const handleIssueGoods = async () => {
        if (saleItems.length === 0) {
            setFormError('Please add at least one item to issue.');
            return;
        }
        const saleData = {
            customerId: id,
            items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
            isCashPayment: isCashPayment,
        };
        try {
            const response = await api.post('/sales', saleData);
            const newSale = response.data;
            const receiptData = { type: 'sale', customerName: customer.name, items: saleItems, totalAmount: newSale.totalAmount, balanceBefore: customer.balance, balanceAfter: isCashPayment ? customer.balance : customer.balance - newSale.totalAmount, paymentMethod: isCashPayment ? 'Cash' : 'Credit', date: newSale.createdAt };
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');
            alert('Items issued successfully!');
            window.location.reload();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to issue Items.');
        }
    };

    const handleStartNewBatch = async () => {
        if (!window.confirm('Are you sure? This will end the current batch and start a new one, carrying over the current balance.')) return;
        try {
            await api.post('/batches/start', { customerId: id });
            alert('New batch started successfully!');
            window.location.reload();
        } catch (err) {
            alert('Failed to start new batch.');
        }
    };
    
    const openBuyModal = () => {
        setFormError('');
        setBuyModalIsOpen(true);
    };

    const closeBuyModal = () => {
        setBuyModalIsOpen(false);
        setBuyData({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
    };

    const handleBuyChange = (e) => {
        setBuyData({ ...buyData, [e.target.name]: e.target.value });
    };

    const handleBuySubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { customerId: id, ...buyData };
            // 1. Capture the response from the API
            const response = await api.post(`/customers/buyback`, payload);
            const newTransaction = response.data; // This contains the full transaction

            // 2. Create receipt data object
            const receiptData = {
                type: 'buy_back',
                customerName: customer.name,
                date: newTransaction.createdAt,
                buyBackQuantity: newTransaction.buyBackQuantity,
                buyBackWeight: newTransaction.buyBackWeight,
                buyBackPricePerKg: newTransaction.buyBackPricePerKg,
                totalAmount: newTransaction.amount,
                balanceBefore: newTransaction.balanceBefore,
                referenceName: newTransaction.referenceName,
                balanceAfter: newTransaction.balanceAfter,
            };

            // 3. Open receipt, show alert, and reload
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');
            alert('Buy transaction successful!');
            window.location.reload();
            
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to process transaction.');
        }
    };

    const handleViewReceipt = (transaction) => {
        let receiptData = {};
        if (transaction.type === 'SALE') {
            receiptData = { type: 'sale', customerName: customer.name, items: transaction.items, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else if (['DEPOSIT', 'WITHDRAWAL', 'DISCOUNT', 'DISCOUNT_REMOVAL'].includes(transaction.type)) {
            receiptData = { type: 'deposit', customerName: customer.name, depositAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else if (transaction.type === 'BUY_BACK') {
            receiptData = { type: 'buy_back', customerName: customer.name, date: transaction.createdAt, buyBackQuantity: transaction.buyBackQuantity, buyBackWeight: transaction.buyBackWeight, buyBackPricePerKg: transaction.buyBackPricePerKg, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, referenceName: transaction.referenceName, balanceAfter: transaction.balanceAfter };
        } else { return; }
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');
    };

    if (isLoading) return <p>Loading customer details...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!customer) return <p>No customer found.</p>;

    const selectedBatch = batches.find(b => b._id === selectedBatchId);

    return (
        <div>
            <div className="page-header"> <h1>{customer.name}</h1> </div>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h3>Customer Information</h3>
                <p><strong>Phone:</strong> {customer.phone}</p>
                {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
                <p><strong>Current Balance:</strong> TK {customer.balance.toFixed(2)}</p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3>Batch Information</h3>
                    <div>
                        {selectedBatch?.status === 'Active' && <button onClick={openBuyModal} className="button-primary" style={{marginRight: '10px'}}>Buy from Customer</button>}
                        <button onClick={handleStartNewBatch} className="button-success"> {selectedBatch?.status === 'Active' ? 'End Current & Start New Batch' : 'Start New Batch'} </button>
                    </div>
                </div>
                {selectedBatch ? (
                    <div>
                        <p><strong>Batch: #{selectedBatch.batchNumber}</strong> ({selectedBatch.status})</p>
                        <p><strong>Started On:</strong> {new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                        {selectedBatch.endDate && <p><strong>Ended On:</strong> {new Date(selectedBatch.endDate).toLocaleDateString()}</p>}
                        
                        <div style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                            <p style={{ color: 'red', margin: '5px 0' }}>
                                <strong>Total Items Issued:</strong> TK {totalSold.toFixed(2)}
                                <button onClick={() => setIsSummaryModalOpen(true)} className="button-info" style={{marginLeft: '15px'}}>
                                    View Item Details
                                </button>
                            </p>
                            {totalDiscounts > 0 && (
                                <p style={{ color: 'green', margin: '5px 0' }}>
                                    <strong>Total Discounts:</strong> - TK {totalDiscounts.toFixed(2)}
                                </p>
                            )}
                            <p style={{ color: 'red', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '5px', margin: '5px 0' }}>
                                <strong>After Discount:</strong> TK {(totalSold - totalDiscounts).toFixed(2)}
                            </p>
                        </div>
                        
                        <p style={{ color: 'green', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <strong>Total Chickens Bought Back:</strong> {totalChickens} chickens (TK {totalBought.toFixed(2)})
                        </p>
                        
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0 }}>Discounts / Adjustments</h4>
                                {selectedBatch.status === 'Active' && (
                                    <button onClick={openDiscountModal} className="button-success">Add Discount</button>
                                )}
                            </div>
                            {selectedBatch.discounts && selectedBatch.discounts.length > 0 ? (
                                <table style={{marginTop: '10px'}}>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Amount (TK)</th>
                                            <th style={{width: '80px'}}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBatch.discounts.map(discount => (
                                            <tr key={discount._id}>
                                                <td>{discount.description}</td>
                                                <td>{parseFloat(discount.amount).toFixed(2)}</td>
                                                <td style={{textAlign: 'center'}}>
                                                    {selectedBatch.status === 'Active' && 
                                                        <button onClick={() => handleRemoveDiscount(discount._id)} className="button-danger" style={{padding: '5px 10px'}}>X</button>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No discounts applied to this batch.</p>
                            )}
                        </div>
                    </div>
                ) : ( 
                    <p>No batch selected or available.</p> 
                )}
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h3>Issue Items to Customer</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label>Search for a Product:</label>
                    <AsyncSelect cacheOptions loadOptions={loadProducts} defaultOptions value={selectedProduct} onChange={(option) => setSelectedProduct(option)} placeholder="Type to search..."/>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <label>Quantity:</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" style={{ width: '80px' }}/>
                    <button onClick={handleAddItem} className="button-primary">Add Item</button>
                </div>
                {saleItems.length > 0 && (
                    <>
                        <table>
                            <thead><tr><th>Product</th><th>Quantity</th><th>Remove</th></tr></thead>                            
                            <tbody>
                                {saleItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            <button onClick={() => handleRemoveItem(index)} className="button-danger" style={{padding: '5px 10px'}}>X</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3 style={{ textAlign: 'right', marginTop: '10px' }}>Total: TK {totalAmount.toFixed(2)}</h3>
                    </>
                )}
                {formError && <p style={{ color: 'red' }}>{formError}</p>}
                <div style={{ marginTop: '20px', fontSize: '1.1em' }}>
                    <label>
                        <input type="checkbox" checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} style={{ marginRight: '10px' }}/>
                        Paid in Cash 💵
                    </label>
                </div>
                <button onClick={handleIssueGoods} className="button-success" style={{ marginTop: '20px', width: '100%', padding: '12px' }}>Confirm and Issue Items</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', margin: '15px 0', alignItems: 'center' }}>
                <div>
                    <label>Filter by Date:</label>
                    <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }} />
                </div>
                <button onClick={() => setFilterDate('')} style={{marginTop: '0px'}}>Clear Date</button>
            </div>

            <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Transaction History</h2>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <label style={{marginRight: '10px'}}>View Batch: </label>
                        <select value={selectedBatchId} onChange={(e) => { setPage(1); setSelectedBatchId(e.target.value); }}>
                            {batches.map(batch => ( <option key={batch._id} value={batch._id}>Batch #{batch.batchNumber} ({new Date(batch.startDate).toLocaleDateString()}) - {batch.status}</option>))}
                        </select>
                        {selectedBatchId && (<Link to={`/reports/batch/${selectedBatchId}`} target="_blank" className="button-link button-primary" style={{marginLeft: '10px', textDecoration: 'none'}}>View Report</Link>)}
                    </div>
                </div>
                <table>
                    <thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Amount (TK)</th><th>Balance (TK)</th><th>Actions</th></tr></thead>
                    <tbody>
                        {transactions.length > 0 ? ( transactions.map((t) => (
                            <tr key={t._id}>
                                <td>{new Date(t.createdAt).toLocaleString()}</td>
                                <td>{t.type}</td>
                                <td>{t.type === 'BUY_BACK' && t.referenceName ? `${t.notes} (Ref: ${t.referenceName})` : t.notes}</td>
                                <td style={{ color: ['DISCOUNT', 'BUY_BACK', 'DEPOSIT'].includes(t.type) ? 'green' : 'red' }}>
                                    {t.amount != null ? t.amount.toFixed(2) : 'N/A'}
                                </td>
                                <td>{t.balanceAfter != null ? t.balanceAfter.toFixed(2) : 'N/A'}</td>
                                <td>
                                    {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK'].includes(t.type) && (
                                        <button onClick={() => handleViewReceipt(t)} className="button-primary">View Receipt</button>
                                    )}
                                </td>
                            </tr>
                        ))) : ( <tr><td colSpan="6" style={{ textAlign: 'center' }}>No transactions found for this batch.</td></tr>)}
                    </tbody>
                </table>
                {totalPages > 1 && (<ReactPaginate previousLabel={'< Previous'} nextLabel={'Next >'} breakLabel={'...'} pageCount={totalPages} marginPagesDisplayed={2} pageRangeDisplayed={3} onPageChange={(data) => setPage(data.selected + 1)} containerClassName={'pagination'} activeClassName={'active'} forcePage={page - 1}/>)}
            </div>

            <Modal isOpen={buyModalIsOpen} onRequestClose={closeBuyModal} contentLabel="Buy Modal" style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '450px' } }}><h2>Buy from Customer</h2><form onSubmit={handleBuySubmit}><p>Record the chickens you are buying back...</p><div><label>Number of Chickens (Quantity):</label><input type="number" name="quantity" value={buyData.quantity} onChange={handleBuyChange} min="0" required /></div><div><label>Total Weight (kg):</label><input type="number" name="weight" value={buyData.weight} onChange={handleBuyChange} min="0" step="0.01" required /></div><div><label>Price Per Kg (TK):</label><input type="number" name="pricePerKg" value={buyData.pricePerKg} onChange={handleBuyChange} min="0" step="0.01" required /></div><div><label>Reference Name:</label><input type="text" name="referenceName" value={buyData.referenceName} onChange={handleBuyChange} /></div><h3 style={{marginTop: '20px'}}>Total Amount: TK {buyTotal.toFixed(2)}</h3>{formError && <p style={{color: 'red'}}>{formError}</p>}<div style={{marginTop: '20px'}}><button type="submit" className="button-primary">Confirm Buy Transaction</button><button type="button" onClick={closeBuyModal} style={{marginLeft: '10px'}}>Cancel</button></div></form></Modal>
            <Modal isOpen={isSummaryModalOpen} onRequestClose={() => setIsSummaryModalOpen(false)} contentLabel="Product Summary Modal" style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '500px' } }}><h2>Total Items Sold in this Batch</h2>{productSummary.length > 0 ? (<table><thead><tr><th>Product Name</th><th>Total Quantity Sold</th></tr></thead><tbody>{productSummary.map((item, index) => (<tr key={index}><td>{item.name}</td><td style={{ textAlign: 'center' }}>{item.quantity}</td></tr>))}</tbody></table>) : (<p>No products have been sold in this batch yet.</p>)}<button onClick={() => setIsSummaryModalOpen(false)} style={{ marginTop: '20px' }} className="button-primary">Close</button></Modal>
            <Modal isOpen={isDiscountModalOpen} onRequestClose={closeDiscountModal} contentLabel="Add Discount Modal" style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '450px' } }}><h2>Add Discount / Adjustment</h2><form onSubmit={handleDiscountSubmit}><p>This will add a credit to the customer's balance...</p><div><label>Description:</label><input type="text" name="description" value={discountData.description} onChange={handleDiscountChange} required /></div><div><label>Amount (TK):</label><input type="number" name="amount" value={discountData.amount} onChange={handleDiscountChange} min="0.01" step="0.01" required /></div>{formError && <p style={{color: 'red'}}>{formError}</p>}<div style={{marginTop: '20px'}}><button type="submit" className="button-primary">Save Discount</button><button type="button" onClick={closeDiscountModal} style={{marginLeft: '10px'}}>Cancel</button></div></form></Modal>
        </div>
    );
};

export default CustomerDetailsPage;