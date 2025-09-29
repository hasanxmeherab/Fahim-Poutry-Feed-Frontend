import React, { useState } from 'react';
import api from '../api/api';

const SalesReportPage = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            setError('Please select both a start and end date.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Sales Report</h1>
            </div>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div>
                    <label>Start Date:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label>End Date:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button onClick={handleGenerateReport} className="button-primary" disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
            
            {reportData && (
                <div style={{ marginTop: '30px' }}>
                    <h2>Report from {startDate} to {endDate}</h2>
                    <div className="stat-card" style={{ maxWidth: '300px', marginBottom: '20px' }}>
                        <h3>Total Revenue</h3>
                        <p>TK {reportData.totalRevenue.toFixed(2)}</p>
                    </div>

                    <h3>Sales Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Amount (TK)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.sales.map((sale) => (
                                <tr key={sale._id}>
                                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                                    <td>{sale.customer?.name || 'N/A'}</td>
                                    <td>{sale.amount.toFixed(2)}</td>
                                    <td>{/* Future: Link to receipt */}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalesReportPage;