import { format } from 'date-fns';
import {
    COMMISSION_AMOUNT,
    DEAL_TYPES,
    SALE_CHANNEL,
    SHARE_DISTRIBUTION_COMMISSION,
    SHARE_DISTRIBUTION_EXTRA_PROFIT,
    SHARE_DISTRIBUTION_CHEAP_RATE
} from './constants';

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'MMM dd, yyyy');
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'MMM dd, yyyy hh:mm a');
};

/**
 * Get current month name
 */
export const getCurrentMonth = () => {
    return format(new Date(), 'MMMM yyyy');
};

/**
 * Get month from date
 */
export const getMonth = (date) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'MMMM yyyy');
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

/**
 * Calculate pending amount
 */
export const calculatePending = (total, paid) => {
    return (total || 0) - (paid || 0);
};

/**
 * Calculate shares based on income per laptop
 */
export const calculateShares = (incomePerLaptop, shareDistribution) => {
    return Object.entries(shareDistribution).map(([name, percentage]) => ({
        name,
        percentage: percentage * 100,
        amount: incomePerLaptop * percentage
    }));
};

/**
 * Get profit for a single laptop item with fallback for legacy items
 * Get profit for a single invoice item based on deal type
 */
export const getItemProfit = (item) => {
    if (!item) return 0;
    if (item.returned) return 0;
    if (item.dealType === DEAL_TYPES.CHEAP_RATE) {
        const sale = parseFloat(item.price) || 0;
        const cost = parseFloat(item.costPrice) || 0;
        return Math.max(0, sale - cost);
    }
    // Commission deal default
    return COMMISSION_AMOUNT;
};

/**
 * Calculate total real profit for an array of invoices
 */
export const sumInvoiceProfit = (invoices = []) => {
    if (!Array.isArray(invoices)) return 0;
    return invoices.reduce((total, inv) => {
        const items = (inv.items || []).filter(i => !i.returned);
        const itemsProfit = items.reduce((s, i) => s + getItemProfit(i), 0);
        return total + itemsProfit + (parseFloat(inv.extraProfit) || 0);
    }, 0);
};

/**
 * Calculate combined share distribution for commission & cheap-rate pools
 */
export const calculateCombinedShares = (invoices = []) => {
    let commissionBaseProfit = 0;
    let extraProfit = 0;
    let cheapProfit = 0;
    let commissionCount = 0;
    let cheapCount = 0;

    invoices.forEach(inv => {
        const items = (inv.items || []).filter(i => !i.returned);
        items.forEach(item => {
            const profit = getItemProfit(item);
            if (item.dealType === DEAL_TYPES.CHEAP_RATE) {
                cheapProfit += profit;
                cheapCount += 1;
            } else {
                commissionBaseProfit += profit;
                commissionCount += 1;
            }
        });
        // Extra profit only exists on commission invoices
        const invExtra = parseFloat(inv.extraProfit) || 0;
        extraProfit += invExtra;
    });

    const commissionBaseShares = calculateShares(commissionBaseProfit, SHARE_DISTRIBUTION_COMMISSION);
    const extraShares = calculateShares(extraProfit, SHARE_DISTRIBUTION_EXTRA_PROFIT);
    const cheapShares = calculateShares(cheapProfit, SHARE_DISTRIBUTION_CHEAP_RATE);

    const totalSharesMap = {
        Hammad: { name: 'Hammad', commissionBaseAmount: 0, extraProfitAmount: 0, cheapAmount: 0, totalAmount: 0, commPct: '50%', extraPct: '33.33%', cheapPct: '30%' },
        Sehar: { name: 'Sehar', commissionBaseAmount: 0, extraProfitAmount: 0, cheapAmount: 0, totalAmount: 0, commPct: '30%', extraPct: '33.33%', cheapPct: '30%' },
        Nouman: { name: 'Nouman', commissionBaseAmount: 0, extraProfitAmount: 0, cheapAmount: 0, totalAmount: 0, commPct: '20%', extraPct: '33.33%', cheapPct: '30%' },
        Expense: { name: 'Expense Pool', commissionBaseAmount: 0, extraProfitAmount: 0, cheapAmount: 0, totalAmount: 0, commPct: '0%', extraPct: '0%', cheapPct: '10%' }
    };

    commissionBaseShares.forEach(({ name, amount }) => {
        if (totalSharesMap[name]) {
            totalSharesMap[name].commissionBaseAmount = amount;
            totalSharesMap[name].totalAmount += amount;
        }
    });

    extraShares.forEach(({ name, amount }) => {
        if (totalSharesMap[name]) {
            totalSharesMap[name].extraProfitAmount = amount;
            totalSharesMap[name].totalAmount += amount;
        }
    });

    cheapShares.forEach(({ name, amount }) => {
        if (totalSharesMap[name]) {
            totalSharesMap[name].cheapAmount = amount;
            totalSharesMap[name].totalAmount += amount;
        }
    });

    const breakdown = {
        Hammad: totalSharesMap.Hammad.totalAmount,
        Sehar: totalSharesMap.Sehar.totalAmount,
        Nouman: totalSharesMap.Nouman.totalAmount,
        Expense: totalSharesMap.Expense.totalAmount
    };

    const commissionProfit = commissionBaseProfit + extraProfit;

    return {
        commissionBaseProfit,
        extraProfit,
        commissionProfit,
        cheapProfit,
        commissionCount,
        cheapCount,
        totalProfit: commissionProfit + cheapProfit,
        commissionBaseShares,
        extraShares,
        cheapShares,
        totalShares: Object.values(totalSharesMap),
        breakdown
    };
};

/**
 * Format customer display label (Walk-in vs Dealer)
 */
export const getInvoiceCustomerLabel = (invoice) => {
    if (!invoice) return 'Unknown Client';
    if (invoice.saleChannel === SALE_CHANNEL.WALKIN) {
        const name = invoice.walkinCustomer?.name || 'Walk-in Customer';
        return `${name} (Walk-in)`;
    }
    return invoice.clientEmail || 'Client';
};

/**
 * Group invoices by month
 */
export const groupByMonth = (invoices) => {
    const grouped = {};

    invoices.forEach(invoice => {
        const month = getMonth(invoice.saleDate);
        if (!grouped[month]) {
            grouped[month] = [];
        }
        grouped[month].push(invoice);
    });

    return grouped;
};

/**
 * Calculate monthly totals
 */
export const calculateMonthlyTotals = (invoices) => {
    return invoices.reduce((acc, invoice) => {
        return {
            totalSales: acc.totalSales + (invoice.price || 0),
            totalProfit: acc.totalProfit + (invoice.extraProfit || 0),
            totalPaid: acc.totalPaid + (invoice.amountPaid || 0),
            count: acc.count + 1
        };
    }, {
        totalSales: 0,
        totalProfit: 0,
        totalPaid: 0,
        count: 0
    });
};

