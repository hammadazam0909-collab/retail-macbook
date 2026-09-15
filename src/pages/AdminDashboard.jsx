import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    doc,
    query,
    orderBy,
    Timestamp,
    where,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';

import { db, auth } from '../firebase/config';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import {
    LAPTOP_MODELS,
    SPECS_OPTIONS,
    QUERY_STATUS,
    INCOME_PER_LAPTOP,
    SHARE_DISTRIBUTION,
    SHARE_DISTRIBUTION_COMMISSION,
    SHARE_DISTRIBUTION_CHEAP_RATE,
    DEAL_TYPES,
    COMMISSION_AMOUNT,
    SALE_CHANNEL,
    CLIENT_ACCOUNTS
} from '../utils/constants';
import {
    formatDateTime,
    formatCurrency,
    getMonth,
    groupByMonth,
    sumInvoiceProfit,
    calculateCombinedShares,
    getInvoiceCustomerLabel
} from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SerialScannerModal from '../components/SerialScannerModal';
import InvoiceItemsForm from '../components/InvoiceItemsForm';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState('queries'); // 'queries' | 'invoices' | 'walkin' | 'shares' | 'users'
    const [salesChannelFilter, setSalesChannelFilter] = useState('ALL'); // 'ALL' | SALE_CHANNEL.DEALER | SALE_CHANNEL.WALKIN

    // Queries State
    const [queries, setQueries] = useState([]);
    const [loadingQueries, setLoadingQueries] = useState(false);

    // Invoices State
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [clients, setClients] = useState([]);

    // Dealer Invoice Form State
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        clientId: '',
        amountPaid: '',
        extraProfit: '',
    });

    // Dealer Invoice Items State
    const [invoiceItems, setInvoiceItems] = useState([
        { serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.COMMISSION, costPrice: '' }
    ]);

    // Walk-in Billing Form State
    const [isCreatingWalkin, setIsCreatingWalkin] = useState(false);
    const [walkinForm, setWalkinForm] = useState({
        customerName: '',
        customerPhone: '',
        amountPaid: '',
        extraProfit: ''
    });
    const [walkinItems, setWalkinItems] = useState([
        { serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.CHEAP_RATE, costPrice: '' }
    ]);

    // Payment Update State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUpdateForm, setPaymentUpdateForm] = useState({
        invoiceId: '',
        currentPaid: '',
        totalPrice: '',
        newAmountPaid: ''
    });

    // Return Processing State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnSearchSerial, setReturnSearchSerial] = useState('');
    const [foundInvoiceForReturn, setFoundInvoiceForReturn] = useState(null);
    const [foundItemForReturn, setFoundItemForReturn] = useState(null);
    const [isProcessingReturn, setIsProcessingReturn] = useState(false);
    const [isEditingExtraProfit, setIsEditingExtraProfit] = useState(false);
    const [editExtraProfitValue, setEditExtraProfitValue] = useState('');
    const [editingItemSerial, setEditingItemSerial] = useState(null);
    const [editItemPriceValue, setEditItemPriceValue] = useState('');

    // Serial Number Camera Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerTarget, setScannerTarget] = useState(null);
    const [scannerInitialValue, setScannerInitialValue] = useState('');

    const openScannerForInvoiceItem = (index, currentValue) => {
        setScannerTarget({ type: 'invoiceItem', index });
        setScannerInitialValue(currentValue || '');
        setIsScannerOpen(true);
    };

    const openScannerForWalkinItem = (index, currentValue) => {
        setScannerTarget({ type: 'walkinItem', index });
        setScannerInitialValue(currentValue || '');
        setIsScannerOpen(true);
    };

    const openScannerForReturn = (currentValue) => {
        setScannerTarget({ type: 'returnSearch' });
        setScannerInitialValue(currentValue || '');
        setIsScannerOpen(true);
    };

    const handleScanConfirm = (scannedData) => {
        if (!scannerTarget) return;
        const serial = typeof scannedData === 'string' ? scannedData : scannedData.serialNumber;

        if (scannerTarget.type === 'invoiceItem') {
            const index = scannerTarget.index;
            updateInvoiceItem(index, 'serialNumber', serial);
            if (typeof scannedData === 'object') {
                if (scannedData.laptopModel) {
                    updateInvoiceItem(index, 'laptopModel', scannedData.laptopModel);
                }
                if (scannedData.specs) {
                    updateInvoiceItem(index, 'specs', scannedData.specs);
                }
            }
        } else if (scannerTarget.type === 'walkinItem') {
            const index = scannerTarget.index;
            updateWalkinItem(index, 'serialNumber', serial);
            if (typeof scannedData === 'object') {
                if (scannedData.laptopModel) {
                    updateWalkinItem(index, 'laptopModel', scannedData.laptopModel);
                }
                if (scannedData.specs) {
                    updateWalkinItem(index, 'specs', scannedData.specs);
                }
            }
        } else if (scannerTarget.type === 'returnSearch') {
            setReturnSearchSerial(serial);
        }
    };

    // Users Management State
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showInvoiceViewModal, setShowInvoiceViewModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        password: '',
        name: '',
        role: 'client'
    });

    // Sales & Shares State
    const [selectedMonth, setSelectedMonth] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);

    // Live Real-Time Subscriptions via onSnapshot
    useEffect(() => {
        setLoadingQueries(true);
        const qQueries = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));
        const unsubscribeQueries = onSnapshot(qQueries, (snapshot) => {
            const queriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const activeQueries = queriesData.filter(q => q.status !== QUERY_STATUS.COMPLETED);
            setQueries(activeQueries);
            setLoadingQueries(false);
        }, (error) => {
            console.error('Error listening to queries:', error);
            setLoadingQueries(false);
        });

        setLoadingInvoices(true);
        const qInvoices = query(collection(db, 'invoices'), orderBy('saleDate', 'desc'));
        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvoices(invoicesData);
            setLoadingInvoices(false);
        }, (error) => {
            console.error('Error listening to invoices:', error);
            setLoadingInvoices(false);
        });

        loadClients();
        loadUsers();

        return () => {
            unsubscribeQueries();
            unsubscribeInvoices();
        };
    }, []);

    // Update available months when invoices change
    useEffect(() => {
        if (invoices.length > 0) {
            const grouped = groupByMonth(invoices);
            const months = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
            setAvailableMonths(months);
            if (!selectedMonth && months.length > 0) {
                setSelectedMonth(months[0]);
            }
        }
    }, [invoices]);


    const loadClients = async () => {
        try {
            const q = query(
                collection(db, 'users'),
                where('role', '==', 'client')
            );
            const querySnapshot = await getDocs(q);
            const clientsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClients(clientsData);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            // Send password reset email to the user
            await sendPasswordResetEmail(auth, selectedUser.email);

            alert(`Password reset email sent to ${selectedUser.email}. The user will receive an email to reset their password.`);
            setShowPasswordResetModal(false);
            setSelectedUser(null);
            setNewPassword('');
        } catch (error) {
            console.error('Error sending password reset email:', error);
            alert(`Failed to send reset email: ${error.message}`);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        let secondaryApp = null;
        try {
            // Get the current app configuration
            const currentApp = getApp();
            const config = currentApp.options;

            // Initialize a secondary app instance
            // Use a unique name for the secondary app to avoid conflicts
            secondaryApp = initializeApp(config, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            // Create user using the secondary auth instance
            // This ensures the current admin remains logged in
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                newUserForm.email,
                newUserForm.password
            );

            // Add user to Firestore using the main app's db instance
            // We use setDoc to specify the document ID as the user's UID
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: newUserForm.email,
                name: newUserForm.name,
                role: newUserForm.role,
                createdAt: Timestamp.now()
            });

            // Clean up the secondary app
            // Note: In a real app we might want to keep this instance if we create users frequently
            // but for now deleting it is safer
            await deleteApp(secondaryApp);

            alert('User created successfully!');
            setShowCreateUserModal(false);
            setNewUserForm({ email: '', password: '', name: '', role: 'client' });
            loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert(`Failed to create user: ${error.message}`);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})? This action cannot be undone.`)) {
            return;
        }

        try {
            // Delete user from Firestore
            await deleteDoc(doc(db, 'users', user.id));

            alert(`User ${user.email} deleted successfully from database.`);
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    };

    const loadQueries = async () => {
        try {
            setLoadingQueries(true);
            const q = query(
                collection(db, 'queries'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const queriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter to show only active queries (not completed)
            const activeQueries = queriesData.filter(q => q.status !== QUERY_STATUS.COMPLETED);

            setQueries(activeQueries);
        } catch (error) {
            console.error('Error loading queries:', error);
            alert('Failed to load queries');
        } finally {
            setLoadingQueries(false);
        }
    };

    const loadInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const q = query(
                collection(db, 'invoices'),
                orderBy('saleDate', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const invoicesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setInvoices(invoicesData);
        } catch (error) {
            console.error('Error loading invoices:', error);
            alert('Failed to load invoices');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const updateQueryStatus = async (queryId, newStatus) => {
        try {
            await updateDoc(doc(db, 'queries', queryId), {
                status: newStatus,
                updatedAt: Timestamp.now()
            });

            loadQueries();
            alert('Query status updated successfully');
        } catch (error) {
            console.error('Error updating query:', error);
            alert('Failed to update query status');
        }
    };

    // Dealer Item Management Helper Functions
    const addInvoiceItem = () => {
        setInvoiceItems([...invoiceItems, { serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.COMMISSION, costPrice: '' }]);
    };

    const removeInvoiceItem = (index) => {
        const newItems = [...invoiceItems];
        newItems.splice(index, 1);
        setInvoiceItems(newItems);
    };

    const updateInvoiceItem = (index, field, value) => {
        const newItems = [...invoiceItems];
        newItems[index][field] = value;

        if (field === 'laptopModel') {
            newItems[index].specs = '';
        }

        setInvoiceItems(newItems);
    };

    // Walk-in Item Management Helper Functions
    const addWalkinItem = () => {
        setWalkinItems([...walkinItems, { serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.CHEAP_RATE, costPrice: '' }]);
    };

    const removeWalkinItem = (index) => {
        const newItems = [...walkinItems];
        newItems.splice(index, 1);
        setWalkinItems(newItems);
    };

    const updateWalkinItem = (index, field, value) => {
        const newItems = [...walkinItems];
        newItems[index][field] = value;

        if (field === 'laptopModel') {
            newItems[index].specs = '';
        }

        setWalkinItems(newItems);
    };

    // Calculation Helpers
    const calculateTotalForItems = (itemsList) => {
        return itemsList.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    };

    const handleInvoiceSubmit = async (e) => {
        e.preventDefault();

        if (isCreatingInvoice) return;

        if (!invoiceForm.clientId) {
            alert('Please select a client');
            return;
        }

        // Validate items
        const invalidItems = invoiceItems.some(item => {
            if (!item.laptopModel || !item.specs || !item.price) return true;
            if (item.dealType === DEAL_TYPES.CHEAP_RATE && (!item.costPrice || parseFloat(item.costPrice) <= 0)) return true;
            return false;
        });

        if (invalidItems) {
            alert('Please fill in all required fields for all laptops (including Cost Price for Cheap Rate items)');
            return;
        }

        // Check unique serial numbers in current form
        const serials = invoiceItems.map(item => item.serialNumber).filter(Boolean);
        const uniqueSerials = new Set(serials);
        if (serials.length !== uniqueSerials.size) {
            alert('Duplicate serial numbers in the list are not allowed');
            return;
        }

        setIsCreatingInvoice(true);
        try {
            const selectedClient = clients.find(c => c.id === invoiceForm.clientId);
            const totalPrice = calculateTotalForItems(invoiceItems);
            const hasCommissionItem = invoiceItems.some(i => i.dealType === DEAL_TYPES.COMMISSION);
            const extraProfit = hasCommissionItem ? (parseFloat(invoiceForm.extraProfit) || 0) : 0;
            const amountPaid = parseFloat(invoiceForm.amountPaid) || 0;
            const pendingAmount = Math.max(0, totalPrice - amountPaid);

            // Format items for storage
            const formattedItems = invoiceItems.map(item => {
                const price = parseFloat(item.price) || 0;
                const costPrice = parseFloat(item.costPrice) || 0;
                const itemProfit = item.dealType === DEAL_TYPES.CHEAP_RATE
                    ? price - costPrice
                    : COMMISSION_AMOUNT;

                return {
                    serialNumber: item.serialNumber || '',
                    laptopModel: item.laptopModel,
                    specs: item.specs,
                    price,
                    dealType: item.dealType || DEAL_TYPES.COMMISSION,
                    costPrice: item.dealType === DEAL_TYPES.CHEAP_RATE ? costPrice : null,
                    itemProfit
                };
            });

            await addDoc(collection(db, 'invoices'), {
                saleChannel: SALE_CHANNEL.DEALER,
                clientId: invoiceForm.clientId,
                clientEmail: selectedClient ? selectedClient.email : '',
                items: formattedItems,
                totalPrice: totalPrice,
                extraProfit: extraProfit,
                amountPaid: amountPaid,
                pendingAmount: pendingAmount,
                totalItems: formattedItems.length,
                month: getMonth(new Date()),
                saleDate: Timestamp.now(),
                createdAt: Timestamp.now()
            });

            alert('Dealer invoice created successfully!');
            setShowInvoiceModal(false);

            // Reset form
            setInvoiceForm({
                clientId: '',
                amountPaid: '',
                extraProfit: '',
            });
            setInvoiceItems([{ serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.COMMISSION, costPrice: '' }]);
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice: ' + error.message);
        } finally {
            setIsCreatingInvoice(false);
        }
    };

    const handleWalkinSubmit = async (e) => {
        e.preventDefault();

        if (isCreatingWalkin) return;

        if (!walkinForm.customerName.trim()) {
            alert('Please enter Customer Name');
            return;
        }

        const invalidItems = walkinItems.some(item => {
            if (!item.laptopModel || !item.specs || !item.price) return true;
            if (item.dealType === DEAL_TYPES.CHEAP_RATE && (!item.costPrice || parseFloat(item.costPrice) <= 0)) return true;
            return false;
        });

        if (invalidItems) {
            alert('Please fill in all required fields for all items (including Cost Price for Cheap Rate items)');
            return;
        }

        const serials = walkinItems.map(item => item.serialNumber).filter(Boolean);
        const uniqueSerials = new Set(serials);
        if (serials.length !== uniqueSerials.size) {
            alert('Duplicate serial numbers in the list are not allowed');
            return;
        }

        setIsCreatingWalkin(true);
        try {
            const totalPrice = calculateTotalForItems(walkinItems);
            const hasCommissionItem = walkinItems.some(i => i.dealType === DEAL_TYPES.COMMISSION);
            const extraProfit = hasCommissionItem ? (parseFloat(walkinForm.extraProfit) || 0) : 0;

            const rawAmountPaid = walkinForm.amountPaid !== '' ? parseFloat(walkinForm.amountPaid) : totalPrice;
            const amountPaid = isNaN(rawAmountPaid) ? totalPrice : rawAmountPaid;
            const pendingAmount = Math.max(0, totalPrice - amountPaid);

            const formattedItems = walkinItems.map(item => {
                const price = parseFloat(item.price) || 0;
                const costPrice = parseFloat(item.costPrice) || 0;
                const itemProfit = item.dealType === DEAL_TYPES.CHEAP_RATE
                    ? price - costPrice
                    : COMMISSION_AMOUNT;

                return {
                    serialNumber: item.serialNumber || '',
                    laptopModel: item.laptopModel,
                    specs: item.specs,
                    price,
                    dealType: item.dealType || DEAL_TYPES.CHEAP_RATE,
                    costPrice: item.dealType === DEAL_TYPES.CHEAP_RATE ? costPrice : null,
                    itemProfit
                };
            });

            await addDoc(collection(db, 'invoices'), {
                saleChannel: SALE_CHANNEL.WALKIN,
                clientId: null,
                clientEmail: null,
                walkinCustomer: {
                    name: walkinForm.customerName.trim(),
                    phone: walkinForm.customerPhone ? walkinForm.customerPhone.trim() : ''
                },
                items: formattedItems,
                totalPrice: totalPrice,
                extraProfit: extraProfit,
                amountPaid: amountPaid,
                pendingAmount: pendingAmount,
                totalItems: formattedItems.length,
                month: getMonth(new Date()),
                saleDate: Timestamp.now(),
                createdAt: Timestamp.now()
            });

            alert('Walk-in invoice created successfully!');
            setWalkinForm({ customerName: '', customerPhone: '', amountPaid: '', extraProfit: '' });
            setWalkinItems([{ serialNumber: '', laptopModel: '', specs: '', price: '', dealType: DEAL_TYPES.CHEAP_RATE, costPrice: '' }]);
            setActiveSection('invoices');
        } catch (error) {
            console.error('Error creating walk-in invoice:', error);
            alert('Failed to create walk-in invoice: ' + error.message);
        } finally {
            setIsCreatingWalkin(false);
        }
    };

    const openPaymentModal = (invoice) => {
        setPaymentUpdateForm({
            invoiceId: invoice.id,
            currentPaid: invoice.amountPaid,
            totalPrice: invoice.totalPrice || invoice.price,
            newAmountPaid: invoice.amountPaid
        });
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        try {
            const newPaid = parseFloat(paymentUpdateForm.newAmountPaid);
            const total = parseFloat(paymentUpdateForm.totalPrice);

            if (isNaN(newPaid) || newPaid < 0) {
                alert('Please enter a valid amount');
                return;
            }

            const newPending = Math.max(0, total - newPaid);

            await updateDoc(doc(db, 'invoices', paymentUpdateForm.invoiceId), {
                amountPaid: newPaid,
                pendingAmount: newPending,
                updatedAt: Timestamp.now()
            });

            alert('Payment updated successfully');
            setShowPaymentModal(false);
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment');
        }
    };

    const handleReturnMachine = async (invoiceId, serialNumber) => {
        if (!window.confirm(`Are you sure you want to return the machine with Serial Number: ${serialNumber}?`)) {
            return;
        }

        try {
            setIsProcessingReturn(true);
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error('Invoice not found');

            const itemToReturn = invoice.items?.find(item => item.serialNumber === serialNumber);
            if (!itemToReturn) throw new Error('Item not found in invoice');

            if (itemToReturn.returned) {
                alert('This machine has already been returned.');
                return;
            }

            const updatedItems = invoice.items.map(item => {
                if (item.serialNumber === serialNumber) {
                    return { ...item, returned: true };
                }
                return item;
            });

            const priceToDeduct = itemToReturn.price || 0;
            const newTotalPrice = Math.max(0, (invoice.totalPrice || invoice.price || 0) - priceToDeduct);
            const newPendingAmount = Math.max(0, newTotalPrice - (invoice.amountPaid || 0));
            const newTotalItems = updatedItems.filter(item => !item.returned).length;

            const allReturned = updatedItems.every(item => item.returned);
            const newExtraProfit = allReturned ? 0 : (invoice.extraProfit || 0);

            await updateDoc(invoiceRef, {
                items: updatedItems,
                totalPrice: newTotalPrice,
                pendingAmount: newPendingAmount,
                totalItems: newTotalItems,
                extraProfit: newExtraProfit,
                updatedAt: Timestamp.now()
            });

            alert(`Machine ${serialNumber} returned successfully. PKR ${priceToDeduct.toLocaleString()} deducted` +
                (allReturned && invoice.extraProfit ? `, and extra profit cleared since all items were returned.` : '.'));

            setShowReturnModal(false);
            setReturnSearchSerial('');
            setFoundInvoiceForReturn(null);
            setFoundItemForReturn(null);

            const updatedInvoice = {
                ...invoice,
                items: updatedItems,
                totalPrice: newTotalPrice,
                pendingAmount: newPendingAmount,
                totalItems: newTotalItems,
                extraProfit: newExtraProfit
            };
            setSelectedInvoice(updatedInvoice);
            setEditExtraProfitValue((newExtraProfit || 0).toString());
            setIsEditingExtraProfit(false);
            setShowInvoiceViewModal(true);
        } catch (error) {
            console.error('Error returning machine:', error);
            alert(`Failed to return machine: ${error.message}`);
        } finally {
            setIsProcessingReturn(false);
        }
    };

    const handleSaveExtraProfit = async () => {
        if (!selectedInvoice) return;
        const newExtraProfit = parseFloat(editExtraProfitValue);
        if (isNaN(newExtraProfit) || newExtraProfit < 0) {
            alert('Please enter a valid extra profit amount');
            return;
        }

        try {
            setIsProcessingReturn(true);
            const invoiceRef = doc(db, 'invoices', selectedInvoice.id);

            await updateDoc(invoiceRef, {
                extraProfit: newExtraProfit,
                updatedAt: Timestamp.now()
            });

            const updatedInvoice = {
                ...selectedInvoice,
                extraProfit: newExtraProfit
            };
            setSelectedInvoice(updatedInvoice);
            setIsEditingExtraProfit(false);

            alert('Extra profit updated successfully');
        } catch (error) {
            console.error('Error updating extra profit:', error);
            alert(`Failed to update extra profit: ${error.message}`);
        } finally {
            setIsProcessingReturn(false);
        }
    };

    const handleSaveItemPrice = async (invoiceId, serialNumber, newPriceStr) => {
        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice) || newPrice < 0) {
            alert('Please enter a valid price');
            return;
        }

        try {
            setIsProcessingReturn(true);
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error('Invoice not found');

            const updatedItems = invoice.items.map(item => {
                if (item.serialNumber === serialNumber) {
                    const priceDiff = newPrice - (item.price || 0);
                    const newItemProfit = item.dealType === DEAL_TYPES.CHEAP_RATE
                        ? (item.itemProfit || 0) + priceDiff
                        : (item.itemProfit || COMMISSION_AMOUNT);
                    return { ...item, price: newPrice, itemProfit: newItemProfit };
                }
                return item;
            });

            const newTotalPrice = updatedItems.reduce((acc, item) => acc + (item.returned ? 0 : item.price), 0);
            const newPendingAmount = Math.max(0, newTotalPrice - (invoice.amountPaid || 0));

            await updateDoc(invoiceRef, {
                items: updatedItems,
                totalPrice: newTotalPrice,
                pendingAmount: newPendingAmount,
                updatedAt: Timestamp.now()
            });

            alert('Machine price updated successfully.');

            const updatedInvoice = {
                ...selectedInvoice,
                items: updatedItems,
                totalPrice: newTotalPrice,
                pendingAmount: newPendingAmount
            };
            setSelectedInvoice(updatedInvoice);
            setEditingItemSerial(null);
        } catch (error) {
            console.error('Error updating item price:', error);
            alert(`Failed to update item price: ${error.message}`);
        } finally {
            setIsProcessingReturn(false);
        }
    };

    const handleSearchSerialForReturn = (e) => {
        e.preventDefault();
        if (!returnSearchSerial.trim()) {
            alert('Please enter a serial number');
            return;
        }

        let foundInv = null;
        let foundItm = null;

        for (const inv of invoices) {
            if (inv.items) {
                const itm = inv.items.find(item => item.serialNumber.toLowerCase() === returnSearchSerial.trim().toLowerCase());
                if (itm) {
                    foundInv = inv;
                    foundItm = itm;
                    break;
                }
            }
        }

        if (foundInv && foundItm) {
            setFoundInvoiceForReturn(foundInv);
            setFoundItemForReturn(foundItm);
        } else {
            setFoundInvoiceForReturn(null);
            setFoundItemForReturn(null);
            alert(`No machine found with Serial Number: "${returnSearchSerial}"`);
        }
    };

    const generateMonthlyPDF = () => {
        if (!selectedMonth) {
            alert('Please select a month');
            return;
        }

        const monthInvoices = invoices.filter(inv => getMonth(inv.saleDate) === selectedMonth);

        const totalSalesAmount = monthInvoices.reduce((acc, inv) => acc + (inv.totalPrice || 0), 0);
        const totalPaid = monthInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
        const totalItemsCount = monthInvoices.reduce((acc, inv) => acc + (inv.items ? inv.items.filter(item => !item.returned).length : (inv.totalItems || 1)), 0);

        const combinedShares = calculateCombinedShares(monthInvoices);

        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('MacBook Sales & Profit Report', 14, 22);
        doc.setFontSize(12);
        doc.text(`Month: ${selectedMonth}`, 14, 30);

        // Summary
        doc.setFontSize(14);
        doc.text('Summary', 14, 45);
        doc.setFontSize(10);
        doc.text(`Total Laptops Sold: ${totalItemsCount}`, 14, 52);
        doc.text(`Extra Profit: ${formatCurrency(combinedShares.extraProfit)}`, 14, 58);
        doc.text(`Commission Deal Units: ${combinedShares.commissionCount} (Profit: ${formatCurrency(combinedShares.commissionProfit)})`, 14, 64);
        doc.text(`Cheap Rate Units: ${combinedShares.cheapCount} (Profit: ${formatCurrency(combinedShares.cheapProfit)})`, 14, 70);
        doc.text(`Total Monthly Profit: ${formatCurrency(combinedShares.totalProfit)}`, 14, 76);
        doc.text(`Total Revenue: ${formatCurrency(totalSalesAmount)} | Total Paid: ${formatCurrency(totalPaid)}`, 14, 82);
        doc.text(`Total Outstanding Pending: ${formatCurrency(totalSalesAmount - totalPaid)}`, 14, 88);

        // Invoices Table
        autoTable(doc, {
            startY: 95,
            head: [['Date', 'Customer', 'Channel', 'Items', 'Total Price', 'Profit', 'Paid', 'Pending']],
            body: monthInvoices.map(inv => [
                formatDateTime(inv.saleDate),
                getInvoiceCustomerLabel(inv),
                inv.saleChannel === SALE_CHANNEL.WALKIN ? 'Walk-in' : 'Dealer',
                inv.totalItems || inv.items?.length || 1,
                formatCurrency(inv.totalPrice || inv.price),
                formatCurrency(sumInvoiceProfit([inv])),
                formatCurrency(inv.amountPaid),
                formatCurrency(inv.pendingAmount)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Share Distribution
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Share Distribution Breakdown', 14, finalY);

        const detailedShareRows = combinedShares.totalShares.map(item => [
            item.name,
            formatCurrency(item.commissionBaseAmount),
            formatCurrency(item.extraProfitAmount),
            formatCurrency(item.cheapAmount),
            formatCurrency(item.totalAmount)
        ]);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Recipient / Pool', 'Comm Base (50/30/20)', 'Extra Profit (33.3%)', 'Cheap Rate (30/30/30/10)', 'Total Payout']],
            body: detailedShareRows,
            theme: 'striped',
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Sold Machines List
        const monthItems = [];
        monthInvoices.forEach(inv => {
            if (inv.items && inv.items.length > 0) {
                inv.items.forEach(item => {
                    if (!item.returned) {
                        monthItems.push({
                            serialNumber: item.serialNumber || 'N/A',
                            laptopModel: item.laptopModel || 'N/A',
                            specs: item.specs || 'N/A',
                            dealType: item.dealType === DEAL_TYPES.CHEAP_RATE ? 'Cheap Rate' : 'Commission',
                            dateSold: inv.saleDate
                        });
                    }
                });
            } else {
                monthItems.push({
                    serialNumber: 'N/A',
                    laptopModel: inv.laptopModel || 'N/A',
                    specs: inv.specs || 'N/A',
                    dealType: 'Commission',
                    dateSold: inv.saleDate
                });
            }
        });

        const machinesY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Sold Machines List', 14, machinesY);

        autoTable(doc, {
            startY: machinesY + 5,
            head: [['#', 'Machine/Model', 'Serial Number', 'Specs', 'Deal Type', 'Date Sold']],
            body: monthItems.map((item, index) => [
                index + 1,
                item.laptopModel,
                item.serialNumber,
                item.specs,
                item.dealType,
                formatDateTime(item.dateSold)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Save PDF
        doc.save(`MacBook_Sales_${selectedMonth.replace(' ', '_')}.pdf`);
    };

    const generateInvoicePDF = (invoice) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('INVOICE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Invoice Date: ${formatDateTime(invoice.saleDate)}`, 14, 35);
        doc.text(`Invoice ID: ${invoice.id.substring(0, 8).toUpperCase()}`, 14, 42);

        // Client Information
        doc.setFontSize(12);
        doc.text('Bill To:', 14, 55);
        doc.setFontSize(10);
        doc.text(invoice.clientEmail, 14, 62);

        // Items Table
        const itemsData = invoice.items?.map((item, idx) => [
            idx + 1,
            item.serialNumber,
            item.laptopModel,
            item.specs,
            formatCurrency(item.price)
        ]) || [];

        autoTable(doc, {
            startY: 75,
            head: [['#', 'Serial Number', 'Model', 'Specs', 'Price']],
            body: itemsData,
            theme: 'striped',
            headStyles: { fillColor: [66, 66, 66] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 35 },
                2: { cellWidth: 40 },
                3: { cellWidth: 60 },
                4: { cellWidth: 35, halign: 'right' }
            }
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        const summaryX = 130;

        doc.setFontSize(10);
        doc.text('Subtotal:', summaryX, finalY);
        doc.text(formatCurrency(invoice.totalPrice || invoice.price), 190, finalY, { align: 'right' });

        if (invoice.extraProfit > 0) {
            doc.text('Extra Profit:', summaryX, finalY + 7);
            doc.text(formatCurrency(invoice.extraProfit), 190, finalY + 7, { align: 'right' });
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Total Amount:', summaryX, finalY + 14);
        doc.text(formatCurrency(invoice.totalPrice || invoice.price), 190, finalY + 14, { align: 'right' });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Amount Paid:', summaryX, finalY + 21);
        doc.text(formatCurrency(invoice.amountPaid), 190, finalY + 21, { align: 'right' });

        const pendingColor = invoice.pendingAmount > 0 ? [239, 68, 68] : [16, 185, 129];
        doc.setTextColor(...pendingColor);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Pending Amount:', summaryX, finalY + 28);
        doc.text(formatCurrency(invoice.pendingAmount), 190, finalY + 28, { align: 'right' });

        // Reset color
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');

        // Footer
        doc.setFontSize(8);
        doc.text('Thank you for your business!', 105, 280, { align: 'center' });

        // Save PDF
        const fileName = `Invoice_${invoice.clientEmail.split('@')[0]}_${formatDateTime(invoice.saleDate).replace(/[/\s:]/g, '_')}.pdf`;
        doc.save(fileName);
    };

    const viewInvoiceDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setEditExtraProfitValue((invoice.extraProfit || 0).toString());
        setIsEditingExtraProfit(false);
        setEditingItemSerial(null);
        setEditItemPriceValue('');
        setShowInvoiceViewModal(true);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleCleanDatabase = async () => {
        if (!window.confirm('WARNING: This will delete ALL invoices and queries. This action cannot be undone. User accounts will be preserved.\n\nAre you sure you want to clean the database?')) {
            return;
        }

        const confirm2 = window.prompt('Type "DELETE" to confirm:');
        if (confirm2 !== 'DELETE') return;

        try {
            // Delete Invoices
            const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
            const invoiceDeletions = invoicesSnapshot.docs.map(doc => deleteDoc(doc.ref));

            // Delete Queries
            const queriesSnapshot = await getDocs(collection(db, 'queries'));
            const queryDeletions = queriesSnapshot.docs.map(doc => deleteDoc(doc.ref));

            await Promise.all([...invoiceDeletions, ...queryDeletions]);

            alert('Database cleaned successfully.');
            loadQueries();
            loadInvoices();
        } catch (error) {
            console.error('Error cleaning database:', error);
            alert('Failed to clean database.');
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

    // Recalculate monthly stats for display
    const monthInvoices = selectedMonth ? invoices.filter(inv => getMonth(inv.saleDate) === selectedMonth) : [];
    const totalMonthItems = monthInvoices.reduce((acc, inv) => acc + (inv.items ? inv.items.filter(item => !item.returned).length : (inv.totalItems || 1)), 0);

    const monthCombinedShares = calculateCombinedShares(monthInvoices);

    const filteredInvoices = invoices.filter(inv => {
        if (salesChannelFilter === SALE_CHANNEL.DEALER) return inv.saleChannel !== SALE_CHANNEL.WALKIN;
        if (salesChannelFilter === SALE_CHANNEL.WALKIN) return inv.saleChannel === SALE_CHANNEL.WALKIN;
        return true;
    });

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Admin Dashboard</h1>
                    <div className="user-info">
                        <span className="user-email">{currentUser?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="sidebar">
                    <button
                        className={`sidebar-btn ${activeSection === 'queries' ? 'active' : ''}`}
                        onClick={() => setActiveSection('queries')}
                    >
                        Client Queries
                    </button>
                    <button
                        className={`sidebar-btn ${activeSection === 'invoices' ? 'active' : ''}`}
                        onClick={() => setActiveSection('invoices')}
                    >
                        Sales Record
                    </button>
                    <button
                        className={`sidebar-btn ${activeSection === 'walkin' ? 'active' : ''}`}
                        onClick={() => setActiveSection('walkin')}
                    >
                        Walk-in Billing
                    </button>
                    <button
                        className={`sidebar-btn ${activeSection === 'shares' ? 'active' : ''}`}
                        onClick={() => setActiveSection('shares')}
                    >
                        Share Distribution
                    </button>
                    <button
                        className={`sidebar-btn ${activeSection === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveSection('users')}
                    >
                        Users
                    </button>
                </div>

                <div className="main-content">
                    {/* Client Queries Section */}
                    {activeSection === 'queries' && (
                        <div className="queries-section">
                            <div className="section-header">
                                <h2>Client Queries</h2>
                            </div>

                            {loadingQueries ? (
                                <div className="loading">Loading queries...</div>
                            ) : queries.length === 0 ? (
                                <div className="empty-state">
                                    <p>No queries found.</p>
                                </div>
                            ) : (
                                <div className="queries-grid">
                                    {queries.map(query => (
                                        <div key={query.id} className="query-card">
                                            <div className="query-header">
                                                <div>
                                                    <h3>{query.laptopModel}</h3>
                                                    <p className="client-email">{query.clientEmail}</p>
                                                </div>
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
                                                    <div className="detail-item full-width">
                                                        <span className="label">Notes:</span>
                                                        <span className="value">{query.notes}</span>
                                                    </div>
                                                )}
                                                <div className="detail-item">
                                                    <span className="label">Submitted:</span>
                                                    <span className="value">{formatDateTime(query.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="query-actions">
                                                <select
                                                    value={query.status}
                                                    onChange={(e) => updateQueryStatus(query.id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    {Object.values(QUERY_STATUS).map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sales Record Section */}
                    {activeSection === 'invoices' && (
                        <div className="invoices-section">
                            <div className="section-header">
                                <h2>Sales Record</h2>
                                <div className="header-actions">
                                    <div style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSalesChannelFilter('ALL')}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: salesChannelFilter === 'ALL' ? '#6366f1' : 'transparent',
                                                color: '#fff',
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            All Sales ({invoices.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSalesChannelFilter(SALE_CHANNEL.DEALER)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: salesChannelFilter === SALE_CHANNEL.DEALER ? '#6366f1' : 'transparent',
                                                color: '#fff',
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Dealer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSalesChannelFilter(SALE_CHANNEL.WALKIN)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: salesChannelFilter === SALE_CHANNEL.WALKIN ? '#6366f1' : 'transparent',
                                                color: '#fff',
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Walk-in
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setReturnSearchSerial('');
                                            setFoundInvoiceForReturn(null);
                                            setFoundItemForReturn(null);
                                            setShowReturnModal(true);
                                        }}
                                        className="btn-secondary"
                                        style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                                    >
                                        Process Return
                                    </button>
                                    <button onClick={() => setShowInvoiceModal(true)} className="btn-primary">
                                        + Dealer Invoice
                                    </button>
                                </div>
                            </div>

                            {loadingInvoices ? (
                                <div className="loading">Loading invoices...</div>
                            ) : filteredInvoices.length === 0 ? (
                                <div className="empty-state">
                                    <p>No invoices found matching filter.</p>
                                </div>
                            ) : (
                                <div className="invoices-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Customer</th>
                                                <th>Channel</th>
                                                <th>Items</th>
                                                <th>Total Price</th>
                                                <th>Total Profit</th>
                                                <th>Paid</th>
                                                <th>Pending</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInvoices.map(invoice => (
                                                <tr key={invoice.id}>
                                                    <td>{formatDateTime(invoice.saleDate)}</td>
                                                    <td>{getInvoiceCustomerLabel(invoice)}</td>
                                                    <td>
                                                        <span
                                                            className={`status-badge ${invoice.saleChannel === SALE_CHANNEL.WALKIN ? 'status-progress' : 'status-completed'}`}
                                                            style={{ padding: '2px 8px', fontSize: '11px' }}
                                                        >
                                                            {invoice.saleChannel === SALE_CHANNEL.WALKIN ? 'Walk-in' : 'Dealer'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="items-cell">
                                                            <strong>{invoice.items ? invoice.items.filter(item => !item.returned).length : (invoice.totalItems || 1)} Laptops</strong>
                                                            <span className="items-tooltip">
                                                                {invoice.items?.map((item, idx) => (
                                                                    <div key={idx} style={item.returned ? { color: '#ef4444', textDecoration: 'line-through' } : {}}>
                                                                        {item.laptopModel} ({item.serialNumber}){item.returned && ' - Returned'}
                                                                    </div>
                                                                ))}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>{formatCurrency(invoice.totalPrice || invoice.price)}</td>
                                                    <td className="text-success">{formatCurrency(sumInvoiceProfit([invoice]))}</td>
                                                    <td>{formatCurrency(invoice.amountPaid)}</td>
                                                    <td className={invoice.pendingAmount > 0 ? 'text-danger' : 'text-success'}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            {formatCurrency(invoice.pendingAmount)}
                                                            {invoice.pendingAmount > 0 && (
                                                                <button
                                                                    onClick={() => openPaymentModal(invoice)}
                                                                    className="btn-xs btn-primary"
                                                                    style={{ marginLeft: '0.5rem', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                                >
                                                                    Update
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => viewInvoiceDetails(invoice)}
                                                                className="btn-xs btn-secondary"
                                                                style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                                title="View Invoice Details"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => generateInvoicePDF(invoice)}
                                                                className="btn-xs btn-primary"
                                                                style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                                title="Download Invoice PDF"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Walk-in Billing Section */}
                    {activeSection === 'walkin' && (
                        <div className="walkin-section">
                            <div className="section-header">
                                <h2>Walk-in Retail Customer Billing</h2>
                            </div>
                            <div className="card" style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                                <form onSubmit={handleWalkinSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Customer Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Walk-in Customer Name"
                                                value={walkinForm.customerName}
                                                onChange={(e) => setWalkinForm({ ...walkinForm, customerName: e.target.value })}
                                                required
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Phone Number (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="03xx-xxxxxxx"
                                                value={walkinForm.customerPhone}
                                                onChange={(e) => setWalkinForm({ ...walkinForm, customerPhone: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                                            />
                                        </div>
                                    </div>

                                    <InvoiceItemsForm
                                        items={walkinItems}
                                        onItemChange={updateWalkinItem}
                                        onAddItem={addWalkinItem}
                                        onRemoveItem={removeWalkinItem}
                                        onScanSerial={openScannerForWalkinItem}
                                    />

                                    {walkinItems.some(i => i.dealType === DEAL_TYPES.COMMISSION) && (
                                        <div className="form-group" style={{ marginTop: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Extra Profit (PKR)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="0"
                                                value={walkinForm.extraProfit}
                                                onChange={(e) => setWalkinForm({ ...walkinForm, extraProfit: e.target.value })}
                                                min="0"
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px' }}>
                                        <div>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total Sale Amount:</span>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6366f1' }}>{formatCurrency(calculateTotalForItems(walkinItems))}</div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Amount Paid by Customer (PKR):</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder={calculateTotalForItems(walkinItems).toString()}
                                                value={walkinForm.amountPaid}
                                                onChange={(e) => setWalkinForm({ ...walkinForm, amountPaid: e.target.value })}
                                                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                                            />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Pending Balance:</span>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: (calculateTotalForItems(walkinItems) - (walkinForm.amountPaid !== '' ? parseFloat(walkinForm.amountPaid) || 0 : calculateTotalForItems(walkinItems))) > 0 ? '#ef4444' : '#10b981' }}>
                                                {formatCurrency(Math.max(0, calculateTotalForItems(walkinItems) - (walkinForm.amountPaid !== '' ? parseFloat(walkinForm.amountPaid) || 0 : calculateTotalForItems(walkinItems))))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isCreatingWalkin}
                                            style={{ padding: '10px 24px', fontSize: '15px', fontWeight: '600' }}
                                        >
                                            {isCreatingWalkin ? 'Generating Invoice...' : 'Complete Walk-in Sale & Generate Invoice'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Share Distribution Section */}
                    {activeSection === 'shares' && (
                        <div className="shares-section">
                            <h2>Monthly Share Distribution</h2>

                            <div className="month-selector">
                                <label htmlFor="month-select">Select Month:</label>
                                <select
                                    id="month-select"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="">Choose a month</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={generateMonthlyPDF}
                                    className="btn-primary"
                                    disabled={!selectedMonth}
                                >
                                    Export PDF
                                </button>
                            </div>

                            {selectedMonth && (
                                <>
                                    <div className="month-summary">
                                        <h3>Summary for {selectedMonth}</h3>
                                        <div className="summary-grid">
                                            <div className="summary-card">
                                                <span className="summary-label">Total Laptops Sold</span>
                                                <span className="summary-value">{totalMonthItems}</span>
                                            </div>
                                            <div className="summary-card">
                                                <span className="summary-label">Extra Profit</span>
                                                <span className="summary-value" style={{ color: '#fbbf24' }}>{formatCurrency(monthCombinedShares.extraProfit)}</span>
                                            </div>
                                            <div className="summary-card">
                                                <span className="summary-label">Commission Pool ({monthCombinedShares.commissionCount} units)</span>
                                                <span className="summary-value">{formatCurrency(monthCombinedShares.commissionProfit)}</span>
                                            </div>
                                            <div className="summary-card">
                                                <span className="summary-label">Cheap Rate Pool ({monthCombinedShares.cheapCount} units)</span>
                                                <span className="summary-value">{formatCurrency(monthCombinedShares.cheapProfit)}</span>
                                            </div>
                                            <div className="summary-card">
                                                <span className="summary-label">Total Monthly Profit</span>
                                                <span className="summary-value text-success">{formatCurrency(monthCombinedShares.totalProfit)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shares-distribution" style={{ marginTop: '24px' }}>
                                        <h3>Profit Breakdown by Deal Type</h3>

                                         {/* Section 1: Commission Base Deals */}
                                         <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #334155' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                                 <h4 style={{ margin: 0, color: '#818cf8', fontSize: '16px', fontWeight: '600' }}>1. Commission Base Deals (50% Hammad / 30% Sehar / 20% Nouman)</h4>
                                                 <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                                                     Base Pool: <strong style={{ color: '#fff', fontSize: '15px' }}>{formatCurrency(monthCombinedShares.commissionBaseProfit)}</strong> ({monthCombinedShares.commissionCount} units @ PKR 5,500)
                                                 </span>
                                             </div>
                                             <div className="shares-grid">
                                                 {monthCombinedShares.commissionBaseShares.map(share => (
                                                     <div key={share.name} className="share-card" style={{ background: '#0f172a' }}>
                                                         <h4>{share.name}</h4>
                                                         <div className="share-details">
                                                             <span className="share-percentage">{share.percentage}%</span>
                                                             <span className="share-amount">{formatCurrency(share.amount)}</span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                         {/* Section 2: Extra Profit Distribution */}
                                         <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #334155' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                                 <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '16px', fontWeight: '600' }}>2. Extra Profit Distribution (33.33% / 33.33% / 33.33%)</h4>
                                                 <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                                                     Extra Profit Pool: <strong style={{ color: '#fbbf24', fontSize: '15px' }}>{formatCurrency(monthCombinedShares.extraProfit)}</strong>
                                                 </span>
                                             </div>
                                             <div className="shares-grid">
                                                 {monthCombinedShares.extraShares.map(share => (
                                                     <div key={share.name} className="share-card" style={{ background: '#0f172a', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                                         <h4 style={{ color: '#fbbf24' }}>{share.name}</h4>
                                                         <div className="share-details">
                                                             <span className="share-percentage">33.33%</span>
                                                             <span className="share-amount">{formatCurrency(share.amount)}</span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                         {/* Section 3: Cheap Rate Deals */}
                                         <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #334155' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                                 <h4 style={{ margin: 0, color: '#34d399', fontSize: '16px', fontWeight: '600' }}>3. Cheap Rate Outright Purchases (30% Hammad / 30% Sehar / 30% Nouman / 10% Expense)</h4>
                                                 <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                                                     Total Pool: <strong style={{ color: '#fff', fontSize: '15px' }}>{formatCurrency(monthCombinedShares.cheapProfit)}</strong> ({monthCombinedShares.cheapCount} units)
                                                 </span>
                                             </div>
                                             <div className="shares-grid">
                                                 {monthCombinedShares.cheapShares.map(share => (
                                                     <div key={share.name} className="share-card" style={share.name === 'Expense' ? { background: '#0f172a', border: '1px solid #fbbf24' } : { background: '#0f172a' }}>
                                                         <h4 style={share.name === 'Expense' ? { color: '#fbbf24' } : {}}>{share.name === 'Expense' ? 'Expense Pool' : share.name}</h4>
                                                         <div className="share-details">
                                                             <span className="share-percentage">{share.percentage}%</span>
                                                             <span className="share-amount">{formatCurrency(share.amount)}</span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                         {/* Section 4: Final Combined Net Distribution */}
                                         <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', padding: '20px', border: '1px solid #6366f1' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                                 <h4 style={{ margin: 0, color: '#a5b4fc', fontSize: '16px', fontWeight: '600' }}>4. Net Monthly Combined Distribution (Final Payout)</h4>
                                                 <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                                                     Total Profit: <strong style={{ color: '#10b981', fontSize: '16px' }}>{formatCurrency(monthCombinedShares.totalProfit)}</strong>
                                                 </span>
                                             </div>
                                             <div className="shares-grid">
                                                 {monthCombinedShares.totalShares.map(item => (
                                                     <div key={item.name} className="share-card" style={item.name === 'Expense Pool' ? { background: '#0f172a', border: '1px solid #fbbf24' } : { background: '#0f172a' }}>
                                                         <h4 style={item.name === 'Expense Pool' ? { color: '#fbbf24' } : {}}>{item.name}</h4>
                                                         <div style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 10px 0', lineHeight: '1.4' }}>
                                                             Comm Base: {formatCurrency(item.commissionBaseAmount)} ({item.commPct})<br />
                                                             Extra Profit: {formatCurrency(item.extraProfitAmount)} ({item.extraPct})<br />
                                                             Cheap Rate: {formatCurrency(item.cheapAmount)} ({item.cheapPct})
                                                         </div>
                                                         <div className="share-details" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
                                                             <span className="share-percentage" style={{ fontWeight: 'bold' }}>Total</span>
                                                             <span className="share-amount" style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(item.totalAmount)}</span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Users Management Section */}
                    {activeSection === 'users' && (
                        <div className="users-section">
                            <div className="section-header">
                                <h2>User Management</h2>
                                <div className="header-actions">
                                    <button onClick={() => setShowCreateUserModal(true)} className="btn-primary">
                                        Create New User
                                    </button>
                                </div>
                            </div>

                            {loadingUsers ? (
                                <div className="loading">Loading users...</div>
                            ) : users.length === 0 ? (
                                <div className="empty-state">
                                    <p>No users found.</p>
                                </div>
                            ) : (
                                <div className="invoices-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.name || 'N/A'}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className={`status-badge ${user.role === 'admin' ? 'status-progress' : 'status-pending'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>{user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setShowPasswordResetModal(true);
                                                                }}
                                                                className="btn-secondary"
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                            >
                                                                Reset Password
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="btn-secondary"
                                                                style={{
                                                                    padding: '0.5rem 1rem',
                                                                    fontSize: '0.875rem',
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    color: '#ef4444',
                                                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dealer Invoice Creation Modal - Updated with InvoiceItemsForm */}
            {showInvoiceModal && (
                <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
                    <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Dealer Invoice</h2>
                            <button className="btn-close" onClick={() => setShowInvoiceModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleInvoiceSubmit} className="invoice-form">
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label htmlFor="client">Select Dealer / Client *</label>
                                <select
                                    id="client"
                                    value={invoiceForm.clientId}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                                >
                                    <option value="">Select Dealer Account</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.email}</option>
                                    ))}
                                </select>
                            </div>

                            <InvoiceItemsForm
                                items={invoiceItems}
                                onItemChange={updateInvoiceItem}
                                onAddItem={addInvoiceItem}
                                onRemoveItem={removeInvoiceItem}
                                onScanSerial={openScannerForInvoiceItem}
                            />

                            <div className="invoice-summary-section" style={{ marginTop: '20px' }}>
                                <h3>Payment Details</h3>
                                <div className="form-row">
                                    {invoiceItems.some(i => i.dealType === DEAL_TYPES.COMMISSION) && (
                                        <div className="form-group">
                                            <label htmlFor="extraProfit">Extra Profit (PKR)</label>
                                            <input
                                                type="number"
                                                id="extraProfit"
                                                value={invoiceForm.extraProfit}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, extraProfit: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label htmlFor="amountPaid">Amount Paid (PKR)</label>
                                        <input
                                            type="number"
                                            id="amountPaid"
                                            value={invoiceForm.amountPaid}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, amountPaid: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="calculated-values">
                                <div className="calc-item">
                                    <span>Total Invoice Amount:</span>
                                    <strong>{formatCurrency(calculateTotalForItems(invoiceItems))}</strong>
                                </div>
                                <div className="calc-item">
                                    <span>Amount Paid:</span>
                                    <strong>{formatCurrency(invoiceForm.amountPaid || 0)}</strong>
                                </div>
                                <div className="calc-item">
                                    <span>Pending:</span>
                                    <strong className="text-danger">
                                        {formatCurrency(Math.max(0, calculateTotalForItems(invoiceItems) - (invoiceForm.amountPaid || 0)))}
                                    </strong>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-secondary" disabled={isCreatingInvoice}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isCreatingInvoice}>
                                    {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Payment Update Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Update Payment</h2>
                            <button className="btn-close" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="form-group">
                                <label>Total Invoice Amount</label>
                                <input
                                    type="text"
                                    value={formatCurrency(paymentUpdateForm.totalPrice)}
                                    disabled
                                    style={{ background: '#f3f4f6' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Current Amount Paid (PKR)</label>
                                <input
                                    type="number"
                                    value={paymentUpdateForm.newAmountPaid}
                                    onChange={(e) => setPaymentUpdateForm({ ...paymentUpdateForm, newAmountPaid: e.target.value })}
                                    required
                                />
                                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                                    Update this value to the total amount paid so far.
                                </small>
                            </div>

                            <div className="form-group">
                                <label>New Pending Balance</label>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: (paymentUpdateForm.totalPrice - paymentUpdateForm.newAmountPaid) > 0 ? '#ef4444' : '#10b981' }}>
                                    {formatCurrency(paymentUpdateForm.totalPrice - (parseFloat(paymentUpdateForm.newAmountPaid) || 0))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Update Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordResetModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowPasswordResetModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Reset Password</h2>
                            <button className="btn-close" onClick={() => setShowPasswordResetModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label>User</label>
                                <input
                                    type="text"
                                    value={`${selectedUser.name} (${selectedUser.email})`}
                                    disabled
                                    style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                                />
                            </div>


                            <div className="form-group">
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                    A password reset email will be sent to <strong>{selectedUser.email}</strong>.
                                    The user will receive instructions to reset their password.
                                </p>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowPasswordResetModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Send Reset Email
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateUserModal && (
                <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New User</h2>
                            <button className="btn-close" onClick={() => setShowCreateUserModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label htmlFor="userName">Name *</label>
                                <input
                                    type="text"
                                    id="userName"
                                    value={newUserForm.name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="userEmail">Email *</label>
                                <input
                                    type="email"
                                    id="userEmail"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="userPassword">Password *</label>
                                <input
                                    type="text"
                                    id="userPassword"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    required
                                    minLength="6"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="userRole">Role *</label>
                                <select
                                    id="userRole"
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    required
                                >
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateUserModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice View Modal */}
            {showInvoiceViewModal && selectedInvoice && (
                <div className="modal-overlay" onClick={() => setShowInvoiceViewModal(false)}>
                    <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Invoice Details</h2>
                            <button className="btn-close" onClick={() => setShowInvoiceViewModal(false)}>×</button>
                        </div>

                        <div className="invoice-view-content">
                            {/* Invoice Header */}
                            <div className="invoice-header-section">
                                <div className="invoice-info-grid">
                                    <div className="info-item">
                                        <span className="label">Invoice ID:</span>
                                        <span className="value">{selectedInvoice.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Date:</span>
                                        <span className="value">{formatDateTime(selectedInvoice.saleDate)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Client:</span>
                                        <span className="value">{selectedInvoice.clientEmail}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Month:</span>
                                        <span className="value">{selectedInvoice.month}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="invoice-items-section">
                                <h3>Items ({selectedInvoice.items ? selectedInvoice.items.filter(item => !item.returned).length : (selectedInvoice.totalItems || 1)})</h3>
                                <div className="items-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Serial Number</th>
                                                <th>Model</th>
                                                <th>Specs</th>
                                                <th>Price</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedInvoice.items?.map((item, idx) => (
                                                <tr key={idx} style={item.returned ? { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}>
                                                    <td>{idx + 1}</td>
                                                    <td style={item.returned ? { textDecoration: 'line-through' } : {}}>{item.serialNumber}</td>
                                                    <td style={item.returned ? { textDecoration: 'line-through' } : {}}>{item.laptopModel}</td>
                                                    <td style={item.returned ? { textDecoration: 'line-through' } : {}}>{item.specs}</td>
                                                    {editingItemSerial === item.serialNumber ? (
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={editItemPriceValue}
                                                                onChange={(e) => setEditItemPriceValue(e.target.value)}
                                                                style={{
                                                                    width: '100px',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.9rem',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--border)',
                                                                    background: 'var(--bg-secondary)',
                                                                    color: 'var(--text-primary)'
                                                                }}
                                                            />
                                                        </td>
                                                    ) : (
                                                        <td style={item.returned ? { textDecoration: 'line-through' } : {}}>{formatCurrency(item.price)}</td>
                                                    )}
                                                    <td>
                                                        {item.returned ? (
                                                            <span className="status-badge status-cancelled" style={{ padding: '2px 6px', fontSize: '0.75rem', display: 'inline-block' }}>Returned</span>
                                                        ) : editingItemSerial === item.serialNumber ? (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    onClick={() => handleSaveItemPrice(selectedInvoice.id, item.serialNumber, editItemPriceValue)}
                                                                    className="btn-xs btn-primary"
                                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                                    disabled={isProcessingReturn}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingItemSerial(null);
                                                                        setEditItemPriceValue('');
                                                                    }}
                                                                    className="btn-xs btn-secondary"
                                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingItemSerial(item.serialNumber);
                                                                        setEditItemPriceValue(item.price.toString());
                                                                    }}
                                                                    className="btn-xs"
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        fontSize: '0.75rem',
                                                                        borderRadius: '4px',
                                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                                        color: 'var(--primary-light)',
                                                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Edit Price
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReturnMachine(selectedInvoice.id, item.serialNumber)}
                                                                    className="btn-xs"
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        fontSize: '0.75rem',
                                                                        borderRadius: '4px',
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    disabled={isProcessingReturn}
                                                                >
                                                                    Return Item
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="invoice-summary-section">
                                <h3>Payment Summary</h3>
                                <div className="summary-details">
                                    <div className="summary-row">
                                        <span className="summary-label">Subtotal:</span>
                                        <span className="summary-value">{formatCurrency(selectedInvoice.totalPrice || selectedInvoice.price)}</span>
                                    </div>
                                    {isEditingExtraProfit ? (
                                        <div className="summary-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="summary-label">Extra Profit:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    value={editExtraProfitValue}
                                                    onChange={(e) => setEditExtraProfitValue(e.target.value)}
                                                    style={{
                                                        width: '100px',
                                                        padding: '4px 8px',
                                                        fontSize: '0.9rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--bg-tertiary)',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                                <button
                                                    onClick={handleSaveExtraProfit}
                                                    className="btn-xs btn-primary"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                    disabled={isProcessingReturn}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingExtraProfit(false);
                                                        setEditExtraProfitValue((selectedInvoice.extraProfit || 0).toString());
                                                    }}
                                                    className="btn-xs btn-secondary"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="summary-row">
                                            <span className="summary-label">Extra Profit:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="summary-value text-success">{formatCurrency(selectedInvoice.extraProfit || 0)}</span>
                                                <button
                                                    onClick={() => setIsEditingExtraProfit(true)}
                                                    className="btn-xs btn-secondary"
                                                    style={{ padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px' }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="summary-row total-row">
                                        <span className="summary-label">Total Amount:</span>
                                        <span className="summary-value">{formatCurrency(selectedInvoice.totalPrice || selectedInvoice.price)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="summary-label">Amount Paid:</span>
                                        <span className="summary-value text-success">{formatCurrency(selectedInvoice.amountPaid)}</span>
                                    </div>
                                    <div className="summary-row pending-row">
                                        <span className="summary-label">Pending Amount:</span>
                                        <span className={`summary-value ${selectedInvoice.pendingAmount > 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatCurrency(selectedInvoice.pendingAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => generateInvoicePDF(selectedInvoice)}
                                className="btn-primary"
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={() => setShowInvoiceViewModal(false)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Process Return Modal */}
            {showReturnModal && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Process Machine Return</h2>
                            <button className="btn-close" onClick={() => setShowReturnModal(false)}>×</button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <form onSubmit={handleSearchSerialForReturn} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <div className="input-with-camera">
                                        <input
                                            type="text"
                                            placeholder="Enter Serial Number"
                                            value={returnSearchSerial}
                                            onChange={(e) => setReturnSearchSerial(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn-camera-scan"
                                            onClick={() => openScannerForReturn(returnSearchSerial)}
                                            title="Scan Serial Number using Camera"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                                <circle cx="12" cy="13" r="4"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary">
                                    Search
                                </button>
                            </form>

                            {foundInvoiceForReturn && foundItemForReturn ? (
                                <div style={{
                                    background: foundItemForReturn.returned ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                    border: `1px solid ${foundItemForReturn.returned ? '#ef4444' : '#10b981'}`,
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '10px', color: foundItemForReturn.returned ? '#ef4444' : '#10b981' }}>
                                        {foundItemForReturn.returned ? 'Machine Already Returned' : 'Machine Found'}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                        <div><strong>Model:</strong> {foundItemForReturn.laptopModel}</div>
                                        <div><strong>Specs:</strong> {foundItemForReturn.specs}</div>
                                        <div><strong>Price:</strong> {formatCurrency(foundItemForReturn.price)}</div>
                                        <div><strong>Client:</strong> {foundInvoiceForReturn.clientEmail}</div>
                                        <div><strong>Sale Date:</strong> {formatDateTime(foundInvoiceForReturn.saleDate)}</div>
                                    </div>

                                    {!foundItemForReturn.returned ? (
                                        <button
                                            onClick={() => handleReturnMachine(foundInvoiceForReturn.id, foundItemForReturn.serialNumber)}
                                            className="btn-primary"
                                            style={{ background: '#ef4444', borderColor: '#ef4444', width: '100%', marginTop: '15px' }}
                                            disabled={isProcessingReturn}
                                        >
                                            {isProcessingReturn ? 'Processing...' : 'Confirm Return & Deduct Price'}
                                        </button>
                                    ) : (
                                        <p style={{ color: '#ef4444', margin: '15px 0 0 0', fontWeight: '500', fontSize: '0.85rem', textAlign: 'center' }}>
                                            Price of {formatCurrency(foundItemForReturn.price)} was deducted from client's bill.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                                    Search for a machine by its serial number to verify purchase details and process the return.
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowReturnModal(false)} className="btn-secondary">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Apple Serial Number Camera Scanner Modal */}
            <SerialScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onConfirm={handleScanConfirm}
                initialValue={scannerInitialValue}
            />
        </div>
    );
};

export default AdminDashboard;
