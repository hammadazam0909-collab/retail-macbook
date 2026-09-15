import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    Timestamp,
    deleteDoc,
    doc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { LAPTOP_MODELS, SPECS_OPTIONS, QUERY_STATUS } from '../utils/constants';
import { formatDateTime, formatCurrency } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ClientDashboard.css';

const ClientDashboard = () => {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('place-query');
    const [loading, setLoading] = useState(false);

    // Place Query State
    const [queryForm, setQueryForm] = useState({
        laptopModel: '',
        specs: '',
        quantity: 1,
        budget: '',
        notes: ''
    });

    // Track Query State
    const [queries, setQueries] = useState([]);
    const [loadingQueries, setLoadingQueries] = useState(false);

    // Invoices State
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Available specs based on selected model
    const availableSpecs = queryForm.laptopModel ? SPECS_OPTIONS[queryForm.laptopModel] : [];

    // Real-Time Subscriptions via onSnapshot for Client Queries & Invoices
    useEffect(() => {
        if (!currentUser?.uid) return;

        setLoadingQueries(true);
        const qQueries = query(
            collection(db, 'queries'),
            where('clientId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        const unsubscribeQueries = onSnapshot(qQueries, (snapshot) => {
            const queriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const activeQueries = queriesData.filter(q => q.status !== QUERY_STATUS.COMPLETED);
            setQueries(activeQueries);
            setLoadingQueries(false);
        }, (error) => {
            console.error('Error listening to queries:', error);
            setLoadingQueries(false);
        });

        setLoadingInvoices(true);
        const qInvoices = query(
            collection(db, 'invoices'),
            where('clientId', '==', currentUser.uid),
            orderBy('saleDate', 'desc')
        );
        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInvoices(invoicesData);
            setLoadingInvoices(false);
        }, (error) => {
            console.error('Error listening to invoices:', error);
            setLoadingInvoices(false);
        });

        return () => {
            unsubscribeQueries();
            unsubscribeInvoices();
        };
    }, [currentUser?.uid]);

    const acknowledgeNotAvailable = async (queryId) => {
        try {
            await deleteDoc(doc(db, 'queries', queryId));
            alert('Query removed');
        } catch (error) {
            console.error('Error removing query:', error);
            alert('Failed to remove query');
        }
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();

        if (!queryForm.laptopModel || !queryForm.specs) {
            alert('Please select laptop model and specs');
            return;
        }

        try {
            setLoading(true);

            await addDoc(collection(db, 'queries'), {
                clientId: currentUser.uid,
                clientEmail: currentUser.email,
                laptopModel: queryForm.laptopModel,
                specs: queryForm.specs,
                quantity: queryForm.quantity,
                budget: queryForm.budget,
                notes: queryForm.notes,
                status: QUERY_STATUS.PENDING,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            alert('Query submitted successfully!');

            // Reset form
            setQueryForm({
                laptopModel: '',
                specs: '',
                quantity: 1,
                budget: '',
                notes: ''
            });

        } catch (error) {
            console.error('Error submitting query:', error);
            alert('Failed to submit query');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case QUERY_STATUS.COMPLETED:
                return 'status-completed';
            case QUERY_STATUS.AVAILABLE:
                return 'status-progress';
            case QUERY_STATUS.NOT_AVAILABLE:
                return 'status-cancelled';
            case QUERY_STATUS.CANCELLED:
                return 'status-cancelled';
            default:
                return 'status-pending';
        }
    };

    const generateInvoicePDF = (invoice) => {
        const doc = new jsPDF();

        // Brand Colors
        const primaryColor = [66, 66, 66]; // Dark Grey
        const accentColor = [99, 102, 241]; // Indigo-500 similar

        // Header - Company Info
        doc.setFontSize(26);
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text('AR MacBook', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Premium MacBook Reseller', 14, 26);
        doc.text('Lahore, Pakistan', 14, 31);

        // Invoice Title & Details
        doc.setFontSize(24);
        doc.setTextColor(200, 200, 200);
        doc.text('INVOICE', 196, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.text(`Invoice #: ${invoice.id.substring(0, 8).toUpperCase()}`, 196, 30, { align: 'right' });
        doc.text(`Date: ${formatDateTime(invoice.saleDate)}`, 196, 35, { align: 'right' });

        // Separator Line
        doc.setDrawColor(230, 230, 230);
        doc.line(14, 40, 196, 40);

        // Bill To Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 14, 50);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(currentUser.email || 'Client', 14, 56);

        // Items Table
        const tableColumn = ["#", "Model", "Specs", "Serial No.", "Price (PKR)"];
        const tableRows = [];

        const items = invoice.items || [{
            laptopModel: invoice.laptopModel,
            specs: invoice.specs,
            serialNumber: 'N/A',
            price: invoice.price
        }];

        items.forEach((item, index) => {
            const itemData = [
                index + 1,
                item.laptopModel + (item.returned ? ' (Returned)' : ''),
                item.specs,
                item.serialNumber || 'N/A',
                item.returned ? 'Returned' : formatCurrency(item.price).replace('PKR ', '')
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            startY: 65,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: accentColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: primaryColor,
                fontSize: 10
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                4: { halign: 'right', fontStyle: 'bold' }
            },
            styles: {
                cellPadding: 4
            }
        });

        // Totals Section
        const finalY = doc.lastAutoTable.finalY + 10;
        const labelX = 130; // Fixed position for labels
        const valueX = 196; // Fixed position for values (right-aligned)

        const totalPrice = invoice.totalPrice || invoice.price || 0;
        const amountPaid = invoice.amountPaid || 0;
        const pending = totalPrice - amountPaid;

        // Draw Totals Box Background (optional details)

        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);

        // Total
        doc.text('Total Amount:', labelX, finalY);
        doc.text(formatCurrency(totalPrice), valueX, finalY, { align: 'right' });

        // Paid
        doc.text('Amount Paid:', labelX, finalY + 7);
        doc.text(formatCurrency(amountPaid), valueX, finalY + 7, { align: 'right' });

        // Divider
        doc.setDrawColor(200, 200, 200);
        doc.line(labelX - 5, finalY + 11, valueX, finalY + 11);

        // Pending
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        if (pending > 0) {
            doc.setTextColor(239, 68, 68); // Red for pending
        } else {
            doc.setTextColor(16, 185, 129); // Green for paid
        }

        doc.text('Balance Due:', labelX, finalY + 18);
        doc.text(formatCurrency(pending), valueX, finalY + 18, { align: 'right' });

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Thank you for choosing AR MacBook!', 105, pageHeight - 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('For questions, please contact us.', 105, pageHeight - 15, { align: 'center' });

        // Save PDF with meaningful name
        const cleanDate = new Date(invoice.saleDate.seconds * 1000).toISOString().split('T')[0];
        doc.save(`AR_MacBook_Invoice_${cleanDate}_${invoice.id.substring(0, 6)}.pdf`);
    };

    return (
        <div className="client-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Client Dashboard</h1>
                    <div className="user-info">
                        <span className="user-email">{currentUser?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'place-query' ? 'active' : ''}`}
                        onClick={() => setActiveTab('place-query')}
                    >
                        Place Query
                    </button>
                    <button
                        className={`tab ${activeTab === 'track-query' ? 'active' : ''}`}
                        onClick={() => setActiveTab('track-query')}
                    >
                        Track Query
                    </button>
                    <button
                        className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        Invoices
                    </button>
                </div>

                <div className="tab-content">
                    {/* Place Query Tab */}
                    {activeTab === 'place-query' && (
                        <div className="place-query">
                            <h2>Submit a New Query</h2>
                            <form onSubmit={handleQuerySubmit} className="query-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="laptopModel">Laptop Model *</label>
                                        <select
                                            id="laptopModel"
                                            value={queryForm.laptopModel}
                                            onChange={(e) => setQueryForm({
                                                ...queryForm,
                                                laptopModel: e.target.value,
                                                specs: '' // Reset specs when model changes
                                            })}
                                            required
                                        >
                                            <option value="">Select Model</option>
                                            {LAPTOP_MODELS.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="specs">Specifications *</label>
                                        <select
                                            id="specs"
                                            value={queryForm.specs}
                                            onChange={(e) => setQueryForm({ ...queryForm, specs: e.target.value })}
                                            disabled={!queryForm.laptopModel}
                                            required
                                        >
                                            <option value="">Select Specs</option>
                                            {availableSpecs.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="quantity">Quantity</label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            min="1"
                                            value={queryForm.quantity}
                                            onChange={(e) => setQueryForm({ ...queryForm, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="budget">Budget (PKR)</label>
                                        <input
                                            type="number"
                                            id="budget"
                                            placeholder="Optional"
                                            value={queryForm.budget}
                                            onChange={(e) => setQueryForm({ ...queryForm, budget: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="notes">Additional Notes</label>
                                    <textarea
                                        id="notes"
                                        rows="4"
                                        placeholder="Any specific requirements or questions..."
                                        value={queryForm.notes}
                                        onChange={(e) => setQueryForm({ ...queryForm, notes: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Query'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Track Query Tab */}
                    {activeTab === 'track-query' && (
                        <div className="track-query">
                            <div className="section-header">
                                <h2>My Queries</h2>
                                <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                    ● Live Sync
                                </span>
                            </div>

                            {loadingQueries ? (
                                <div className="loading">Loading queries...</div>
                            ) : queries.length === 0 ? (
                                <div className="empty-state">
                                    <p>No queries found. Submit your first query!</p>
                                </div>
                            ) : (
                                <div className="queries-list">
                                    {queries.map(query => (
                                        <div key={query.id} className="query-card">
                                            <div className="query-header">
                                                <h3>{query.laptopModel}</h3>
                                                <span className={`status-badge ${getStatusClass(query.status)}`}>
                                                    {query.status}
                                                </span>
                                            </div>
                                            <div className="query-details">
                                                <div className="detail-item">
                                                    <span className="label">Specs:</span>
                                                    <span className="value">{query.specs}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Quantity:</span>
                                                    <span className="value">{query.quantity}</span>
                                                </div>
                                                {query.budget && (
                                                    <div className="detail-item">
                                                        <span className="label">Budget:</span>
                                                        <span className="value">{formatCurrency(query.budget)}</span>
                                                    </div>
                                                )}
                                                {query.notes && (
                                                    <div className="detail-item">
                                                        <span className="label">Notes:</span>
                                                        <span className="value">{query.notes}</span>
                                                    </div>
                                                )}
                                                <div className="detail-item">
                                                    <span className="label">Submitted:</span>
                                                    <span className="value">{formatDateTime(query.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Show Acknowledge button for Not Available queries */}
                                            {query.status === QUERY_STATUS.NOT_AVAILABLE && (
                                                <div className="query-actions" style={{ marginTop: '1rem' }}>
                                                    <button
                                                        onClick={() => acknowledgeNotAvailable(query.id)}
                                                        className="btn-secondary"
                                                        style={{ width: '100%' }}
                                                    >
                                                        Acknowledge & Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invoices Tab */}
                    {activeTab === 'invoices' && (
                        <div className="invoices">
                            <div className="section-header">
                                <h2>My Invoices</h2>
                                <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                    ● Live Sync
                                </span>
                            </div>

                            {loadingInvoices ? (
                                <div className="loading">Loading invoices...</div>
                            ) : invoices.length === 0 ? (
                                <div className="empty-state">
                                    <p>No invoices found.</p>
                                </div>
                            ) : (
                                <div className="invoices-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total Price</th>
                                                <th>Paid</th>
                                                <th>Pending</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map(invoice => {
                                                const totalPrice = invoice.totalPrice || invoice.price || 0;
                                                const amountPaid = invoice.amountPaid || 0;
                                                const pending = Math.max(0, totalPrice - amountPaid);

                                                return (
                                                    <tr key={invoice.id}>
                                                        <td>{formatDateTime(invoice.saleDate)}</td>
                                                        <td>
                                                            <div className="items-cell">
                                                                <strong>{invoice.items ? invoice.items.filter(item => !item.returned).length : (invoice.totalItems || 1)} Laptops</strong>
                                                                <span className="items-tooltip">
                                                                    {invoice.items ? (
                                                                        invoice.items.map((item, idx) => (
                                                                            <div key={idx} style={item.returned ? { color: '#ef4444', textDecoration: 'line-through' } : {}}>
                                                                                {item.laptopModel} ({item.specs}){item.returned && ' - Returned'}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div>{invoice.laptopModel} ({invoice.specs})</div>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>{formatCurrency(totalPrice)}</td>
                                                        <td>{formatCurrency(amountPaid)}</td>
                                                        <td className={pending > 0 ? 'text-danger' : 'text-success'}>
                                                            {formatCurrency(pending)}
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${pending > 0 ? 'status-pending' : 'status-completed'}`}>
                                                                {pending > 0 ? 'Pending' : 'Paid'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                onClick={() => generateInvoicePDF(invoice)}
                                                                className="btn-secondary btn-sm"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                            >
                                                                Download PDF
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
