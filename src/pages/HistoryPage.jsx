import React, { useState, useEffect } from 'react';
import api from '../api/api';
import ReactPaginate from 'react-paginate';

const HistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/transactions?page=${page}`);
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError('Failed to fetch transaction history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [page]);

  const handleViewReceipt = (transaction) => {
    let receiptData = {};
    if (transaction.type === 'SALE') {
        receiptData = {
            type: 'sale', customerName: transaction.customer?.name, items: transaction.items,
            totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter, date: transaction.createdAt,
        };
    } else if (transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAWAL') {
        receiptData = {
            type: 'deposit', customerName: transaction.customer?.name, depositAmount: transaction.amount,
            balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter,
            date: transaction.createdAt,
        };
    } else if (transaction.type === 'BUY_BACK') {
        receiptData = {
            type: 'buy_back',
            customerName: transaction.customer?.name,
            date: transaction.createdAt,
            buyBackQuantity: transaction.buyBackQuantity,
            buyBackWeight: transaction.buyBackWeight,
            buyBackPricePerKg: transaction.buyBackPricePerKg,
            totalAmount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            referenceName: transaction.referenceName,
            balanceAfter: transaction.balanceAfter,
        };
    } else { 
        return; 
    }
    sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
    window.open('/receipt', '_blank');
  };

  const renderDetail = (t) => t.notes;

  if (isLoading && transactions.length === 0) return <p>Loading history...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Transaction History</h1>
      <table style={{ transition: 'opacity 0.3s', opacity: isLoading ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id}>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
              <td>{t.type}</td>
              <td>{renderDetail(t)}</td>
              <td>
                {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK'].includes(t.type) && (
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
            breakLabel={'...'}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={(data) => setPage(data.selected + 1)}
            containerClassName={'pagination'}
            activeClassName={'active'}
        />
      )}
    </div>
  );
};

export default HistoryPage;