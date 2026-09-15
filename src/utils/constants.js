// Application Constants

// Hardcoded Client Accounts
export const CLIENT_ACCOUNTS = [
    { email: 'Naveed@noreply.com', password: 'Naveed123', name: 'Naveed' },
    { email: 'Luqman@noreply.com', password: 'Luqman123', name: 'Luqman' },
    { email: 'Ali@noreply.com', password: 'Ali123', name: 'Ali' },
    { email: 'RedApple@noreply.com', password: 'RedApple123', name: 'RedApple' }
];

// User Roles
export const ROLES = {
    ADMIN: 'admin',
    CLIENT: 'client'
};

// Laptop Models (Hardcoded)
export const LAPTOP_MODELS = [
    'MacBook Air 13" M1',
    'MacBook Air 13" M2',
    'MacBook Air 15" M2',
    'MacBook Air 13" M3',
    'MacBook Air 15" M3',
    'MacBook Air 13" M4',
    'MacBook Air 15" M4',
    'MacBook Air 13" M5',
    'MacBook Air 15" M5',
    'MacBook Pro 13" M1',
    'MacBook Pro 13" M2',
    'MacBook Pro 14" M1 Pro',
    'MacBook Pro 14" M1 Max',
    'MacBook Pro 14" M2 Pro',
    'MacBook Pro 14" M2 Max',
    'MacBook Pro 14" M3',
    'MacBook Pro 14" M3 Pro',
    'MacBook Pro 14" M3 Max',
    'MacBook Pro 14" M4',
    'MacBook Pro 14" M4 Pro',
    'MacBook Pro 14" M4 Max',
    'MacBook Pro 14" M5',
    'MacBook Pro 14" M5 Pro',
    'MacBook Pro 14" M5 Max',
    'MacBook Pro 16" M1 Pro',
    'MacBook Pro 16" M1 Max',
    'MacBook Pro 16" M2 Pro',
    'MacBook Pro 16" M2 Max',
    'MacBook Pro 16" M3 Pro',
    'MacBook Pro 16" M3 Max',
    'MacBook Pro 16" M4 Pro',
    'MacBook Pro 16" M4 Max',
    'MacBook Pro 16" M5 Pro',
    'MacBook Pro 16" M5 Max'
];

// Specs Options — every officially offered RAM/SSD combination per model
export const SPECS_OPTIONS = {

    // ── MacBook Air ──────────────────────────────────────────────────────────

    // M1 Air 13" (2020): 8/16 GB RAM · 256/512/1TB/2TB SSD
    'MacBook Air 13" M1': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB'
    ],

    // M2 Air 13" (2022): 8/16/24 GB · 256/512/1TB/2TB
    'MacBook Air 13" M2': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // M2 Air 15" (2023): 8/16/24 GB · 256/512/1TB/2TB
    'MacBook Air 15" M2': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // M3 Air 13" (2024): 8/16/24 GB · 256/512/1TB/2TB
    'MacBook Air 13" M3': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // M3 Air 15" (2024): 8/16/24 GB · 256/512/1TB/2TB
    'MacBook Air 15" M3': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // M4 Air 13" (2025): 16/24/32 GB · 256/512/1TB/2TB
    'MacBook Air 13" M4': [
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/256GB', '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // M4 Air 15" (2025): 16/24/32 GB · 256/512/1TB/2TB
    'MacBook Air 15" M4': [
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/256GB', '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // M5 Air 13" (2026): 16/24/32 GB · 256/512/1TB/2TB
    'MacBook Air 13" M5': [
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/256GB', '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // M5 Air 15" (2026): 16/24/32 GB · 256/512/1TB/2TB
    'MacBook Air 15" M5': [
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/256GB', '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // ── MacBook Pro 13" ──────────────────────────────────────────────────────

    // M1 Pro 13" (2020): 8/16 GB · 256/512/1TB/2TB
    'MacBook Pro 13" M1': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB'
    ],

    // M2 Pro 13" (2022): 8/16/24 GB · 256/512/1TB/2TB
    'MacBook Pro 13" M2': [
        '8GB/256GB', '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/256GB', '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/256GB', '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // ── MacBook Pro 14" ──────────────────────────────────────────────────────

    // M1 Pro 14" (2021): 16/32 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 14" M1 Pro': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB', '16GB/4TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB', '32GB/8TB'
    ],

    // M1 Max 14" (2021): 32/64 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 14" M1 Max': [
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB',
        '64GB/512GB', '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB'
    ],

    // M2 Pro 14" (2023): 16/32 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 14" M2 Pro': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB', '16GB/4TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB', '32GB/8TB'
    ],

    // M2 Max 14" (2023): 32/64/96 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 14" M2 Max': [
        '32GB/1TB', '32GB/2TB', '32GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '96GB/1TB', '96GB/2TB', '96GB/4TB', '96GB/8TB'
    ],

    // M3 base 14" (2023): 8/16/24 GB · 512/1TB/2TB
    'MacBook Pro 14" M3': [
        '8GB/512GB', '8GB/1TB', '8GB/2TB',
        '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/512GB', '24GB/1TB', '24GB/2TB'
    ],

    // M3 Pro 14" (2023): 18/36 GB · 512/1TB/2TB/4TB
    'MacBook Pro 14" M3 Pro': [
        '18GB/512GB', '18GB/1TB', '18GB/2TB',
        '36GB/512GB', '36GB/1TB', '36GB/2TB', '36GB/4TB'
    ],

    // M3 Max 14" (2023): 36/48/64/96/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 14" M3 Max': [
        '36GB/1TB', '36GB/2TB', '36GB/4TB',
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '96GB/1TB', '96GB/2TB', '96GB/4TB', '96GB/8TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ],

    // M4 base 14" (2024): 16/24/32 GB · 512/1TB/2TB
    'MacBook Pro 14" M4': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // M4 Pro 14" (2024): 24/48 GB · 512/1TB/2TB/4TB
    'MacBook Pro 14" M4 Pro': [
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '48GB/512GB', '48GB/1TB', '48GB/2TB', '48GB/4TB'
    ],

    // M4 Max 14" (2024): 36/48/64/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 14" M4 Max': [
        '36GB/1TB', '36GB/2TB', '36GB/4TB',
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ],

    // M5 base 14" (2026): 16/24/32 GB · 512/1TB/2TB
    'MacBook Pro 14" M5': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB',
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB'
    ],

    // M5 Pro 14" (2026): 24/48/64 GB · 512/1TB/2TB/4TB
    'MacBook Pro 14" M5 Pro': [
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '48GB/512GB', '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB'
    ],

    // M5 Max 14" (2026): 48/64/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 14" M5 Max': [
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ],

    // ── MacBook Pro 16" ──────────────────────────────────────────────────────

    // M1 Pro 16" (2021): 16/32 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 16" M1 Pro': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB', '16GB/4TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB', '32GB/8TB'
    ],

    // M1 Max 16" (2021): 32/64 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 16" M1 Max': [
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB',
        '64GB/512GB', '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB'
    ],

    // M2 Pro 16" (2023): 16/32 GB · 512/1TB/2TB/4TB/8TB
    'MacBook Pro 16" M2 Pro': [
        '16GB/512GB', '16GB/1TB', '16GB/2TB', '16GB/4TB',
        '32GB/512GB', '32GB/1TB', '32GB/2TB', '32GB/4TB', '32GB/8TB'
    ],

    // M2 Max 16" (2023): 32/64/96 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 16" M2 Max': [
        '32GB/1TB', '32GB/2TB', '32GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '96GB/1TB', '96GB/2TB', '96GB/4TB', '96GB/8TB'
    ],

    // M3 Pro 16" (2023): 18/36 GB · 512/1TB/2TB/4TB
    'MacBook Pro 16" M3 Pro': [
        '18GB/512GB', '18GB/1TB', '18GB/2TB',
        '36GB/512GB', '36GB/1TB', '36GB/2TB', '36GB/4TB'
    ],

    // M3 Max 16" (2023): 36/48/64/96/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 16" M3 Max': [
        '36GB/1TB', '36GB/2TB', '36GB/4TB',
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '96GB/1TB', '96GB/2TB', '96GB/4TB', '96GB/8TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ],

    // M4 Pro 16" (2024): 24/48 GB · 512/1TB/2TB/4TB
    'MacBook Pro 16" M4 Pro': [
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '48GB/512GB', '48GB/1TB', '48GB/2TB', '48GB/4TB'
    ],

    // M4 Max 16" (2024): 36/48/64/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 16" M4 Max': [
        '36GB/1TB', '36GB/2TB', '36GB/4TB',
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB', '64GB/8TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ],

    // M5 Pro 16" (2026): 24/48/64 GB · 512/1TB/2TB/4TB
    'MacBook Pro 16" M5 Pro': [
        '24GB/512GB', '24GB/1TB', '24GB/2TB',
        '48GB/512GB', '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB'
    ],

    // M5 Max 16" (2026): 48/64/128 GB · 1TB/2TB/4TB/8TB
    'MacBook Pro 16" M5 Max': [
        '48GB/1TB', '48GB/2TB', '48GB/4TB',
        '64GB/1TB', '64GB/2TB', '64GB/4TB',
        '128GB/1TB', '128GB/2TB', '128GB/4TB', '128GB/8TB'
    ]
};

// Provider Deal Types
export const DEAL_TYPES = {
    CHEAP_RATE: 'cheap_rate',       // bought outright, variable profit (price - costPrice)
    COMMISSION: 'commission'         // fixed provider commission (PKR 5,500)
};

export const COMMISSION_AMOUNT = 5500; // Fixed provider commission per laptop

// Sale Channels
export const SALE_CHANNEL = {
    DEALER: 'dealer',   // dealer / registered client accounts
    WALKIN: 'walkin'    // walk-in retail customer (no account required)
};

// Share Distribution for Commission Sales (50/30/20)
export const SHARE_DISTRIBUTION_COMMISSION = {
    Hammad: 0.50,   // 50%
    Sehar: 0.30,    // 30%
    Nouman: 0.20    // 20%
};

// Share Distribution for Extra Profit (33.33 / 33.33 / 33.33)
export const SHARE_DISTRIBUTION_EXTRA_PROFIT = {
    Hammad: 1 / 3,   // 33.33%
    Sehar: 1 / 3,    // 33.33%
    Nouman: 1 / 3    // 33.34%
};

// Share Distribution for Cheap Rate Sales (30/30/30 + 10% Expense)
export const SHARE_DISTRIBUTION_CHEAP_RATE = {
    Hammad: 0.30,   // 30%
    Sehar: 0.30,    // 30%
    Nouman: 0.30,   // 30%
    Expense: 0.10   // 10% Expense Pool
};

// Legacy Share Distribution (Fallback)
export const SHARE_DISTRIBUTION = {
    Sehar: 0.30,   // 30%
    Nouman: 0.20,  // 20%
    Hammad: 0.50   // 50%
};

// Income per laptop
export const INCOME_PER_LAPTOP = 5500;

// Query Status Options
export const QUERY_STATUS = {
    PENDING: 'Pending',
    AVAILABLE: 'Available',
    NOT_AVAILABLE: 'Not Available',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

