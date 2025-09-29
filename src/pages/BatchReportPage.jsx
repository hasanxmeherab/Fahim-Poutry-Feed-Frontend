import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';

const BatchReportPage = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get(`/reports/batch/${id}`);
                setReport(response.data);
            } catch (err) {
                console.error("Failed to fetch batch report.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    // This is the new, robust print function
    const handlePrint = (sectionId, title) => {
        const printContent = document.getElementById(sectionId);
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        
        printWindow.document.write('<html><head><title>' + title + '</title>');
        
        // Link to your main CSS file to keep the table styling
        printWindow.document.write('<link rel="stylesheet" href="/src/index.css" type="text/css" />');
        
        printWindow.document.write('<style> body { padding: 20px; } table { margin-top: 0; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus(); // Necessary for some browsers
        
        // Use a timeout to ensure content is loaded before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    
const handlePrintFullReport = () => {
    // 1. Get the original sections
    const salesSection = document.getElementById('sales-section');
    const buyBackSection = document.getElementById('buyback-section');

    // 2. Create clones of the sections to modify
    const salesClone = salesSection.cloneNode(true);
    const buyBackClone = buyBackSection.cloneNode(true);

    // 3. Find and remove the print buttons from the CLONES
    salesClone.querySelector('button').remove();
    buyBackClone.querySelector('button').remove();

    // 4. Get the cleaned HTML from the clones
    const salesContent = salesClone.innerHTML;
    const buyBackContent = buyBackClone.innerHTML;

    // 5. Create the print window with the cleaned content
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>Full Batch Report</title>');
    printWindow.document.write('<link rel="stylesheet" href="/src/index.css" type="text/css" />');
    printWindow.document.write('<style> body { padding: 20px; } .report-section-header > h2 { margin-top: 0; } </style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Full Batch Report</h1>');
    printWindow.document.write(salesContent); // Use the cleaned HTML
    printWindow.document.write(buyBackContent); // Use the cleaned HTML
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

    if (isLoading) return <p>Generating report...</p>;
    if (!report) return <p style={{ color: 'red' }}>Could not load report data.</p>;

    return (
        <div id="report-container">
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h1>Batch Report</h1>
            <button onClick={handlePrintFullReport} className="button-primary">Print Full Report</button>
        </div>

            <div className="stat-cards">
                <div className="stat-card"><h3>Total Items Issued</h3><p>TK {report.totalSold.toFixed(2)}</p></div>
                <div className="stat-card"><h3>Total Chickens Bought</h3><p>{report.totalChickens}</p></div>
                <div className="stat-card"><h3>Total Buy Back Value</h3><p>TK {report.totalBought.toFixed(2)}</p></div>
            </div>

            {/* --- GOODS ISSUED DETAILS --- */}
            <div id="sales-section" style={{marginTop: '40px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Goods Issued (Sales) Details</h2>
                    <button onClick={() => handlePrint('sales-section', 'Sales Report')} className="button-primary">Print Sales</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total (TK)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.sales.flatMap(sale =>
                            (sale.items || []).map((item, index) => (
                                <tr key={`${sale._id}-${index}`}>
                                    <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                                    <td>{item.name || 'N/A'}</td>
                                    <td>{item.product?.sku || 'N/A'}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price ? item.price.toFixed(2) : '0.00'}</td>
                                    <td>{(item.quantity * (item.price || 0)).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- BUY BACK DETAILS --- */}
            <div id="buyback-section" style={{marginTop: '40px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Buy Back Details</h2>
                    <button onClick={() => handlePrint('buyback-section', 'Buy Back Report')} className="button-primary">Print Buy Backs</button>
                </div>
                <table>
                    <thead>

                        <tr>
                            <th>Date</th>
                            <th>Chickens (Qty)</th>
                            <th>Weight (kg)</th>
                            <th>Price/kg (TK)</th>
                            <th>Total Amount (TK)</th>
                            <th>Reference</th> {/* <-- ADD THIS */}
                        </tr>

                    </thead>
                    <tbody>
                        {report.buyBacks.map(buy => (
                            <tr key={buy._id}>
                                <td>{new Date(buy.createdAt).toLocaleDateString()}</td>
                                <td>{buy.buyBackQuantity}</td>
                                <td>{buy.buyBackWeight.toFixed(2)}</td>
                                <td>{buy.buyBackPricePerKg.toFixed(2)}</td>
                                <td>{buy.amount.toFixed(2)}</td>
                                <td>{buy.referenceName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BatchReportPage;