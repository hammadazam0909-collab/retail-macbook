# 🚀 Quick Reference Guide - MacBook Sales System

## 📋 Table of Contents
1. [Login Credentials](#login-credentials)
2. [Client Features](#client-features)
3. [Admin Features](#admin-features)
4. [Common Tasks](#common-tasks)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Login Credentials

### Admin Account
```
Email: admin@macbook.com
Password: admin123
```

### Client Accounts
```
Naveed:   Naveed@noreply.com   / Naveed123
Luqman:   Luqman@noreply.com   / Luqman123
Ali:      Ali@noreply.com      / Ali123
RedApple: RedApple@noreply.com / RedApple123
```

---

## 👤 Client Features

### 1. Place Query
**How to submit a laptop request:**
1. Login with client credentials
2. Go to "Place Query" tab
3. Select:
   - Laptop Model (e.g., MacBook Air M3)
   - Specs (e.g., 16GB/512GB)
   - Quantity
   - Budget (optional)
   - Notes (optional)
4. Click "Submit Query"

### 2. Track Query
**How to check query status:**
1. Go to "Track Query" tab
2. View all your submitted queries
3. Status indicators:
   - 🟡 **Pending** - Waiting for admin review
   - 🔵 **In Progress** - Being processed
   - 🟢 **Completed** - Fulfilled
   - 🔴 **Cancelled** - Not proceeding

### 3. View Invoices
**How to check your invoices:**
1. Go to "Invoices" tab
2. View table with:
   - Date of sale
   - Laptop model & specs
   - Total price
   - Amount paid
   - Pending amount
   - Payment status

**Note:** Clients cannot see extra profit amounts

---

## 👨‍💼 Admin Features

### 1. Client Queries Management
**How to manage queries:**
1. Login as admin
2. Click "Client Queries" in sidebar
3. View all client queries
4. Update status using dropdown:
   - Pending → In Progress → Completed
   - Or mark as Cancelled

### 2. Create Invoice
**How to create a new invoice:**
1. Click "Sales Record" in sidebar
2. Click "Create Invoice" button
3. Fill in:
   - **Client** (dropdown of registered clients)
   - **Laptop Model** (dropdown)
   - **Specs** (dropdown based on model)
   - **Price** (in PKR)
   - **Extra Profit** (admin's additional profit)
   - **Amount Paid** (initial payment)
4. System auto-calculates pending amount
5. Click "Create Invoice"

**Auto-calculated fields:**
- Pending Amount = Price - Amount Paid
- Month = Current month
- Sale Date = Today

### 3. Sales Record
**How to view all sales:**
1. Click "Sales Record" in sidebar
2. View complete table with:
   - Date, Client, Model, Specs
   - Price, Extra Profit
   - Paid, Pending amounts
3. Click "Refresh" to update

### 4. Share Distribution
**How to view monthly shares:**
1. Click "Share Distribution" in sidebar
2. Select month from dropdown
3. View:
   - **Summary**: Total sales, revenue, profit, paid
   - **Share Breakdown**:
     - Sehar: 30%
     - Nouman: 20%
     - Hammad: 50%

**Share Calculation:**
- Income per laptop = PKR 5,500
- Total income = Sales count × 5,500
- Each partner gets their percentage

### 5. Export Monthly PDF
**How to generate PDF report:**
1. Go to "Share Distribution"
2. Select desired month
3. Click "Export PDF"
4. PDF includes:
   - Summary statistics
   - All invoices for that month
   - Share distribution table

---

## 🔧 Common Tasks

### Add a New Client Manually
1. Go to Firebase Console → Authentication
2. Add user with email/password
3. Copy the User UID
4. Go to Firestore → users collection
5. Create document with:
   ```json
   {
     "email": "client@email.com",
     "role": "client",
     "displayName": "Client Name",
     "createdAt": [timestamp]
   }
   ```

### Update User Password
1. Firebase Console → Authentication
2. Find user by email
3. Click user row
4. Reset password

### View Database
1. Firebase Console → Firestore Database
2. Browse collections:
   - **users** - User accounts
   - **queries** - Client queries
   - **invoices** - All invoices

### Deploy Updates
```bash
npm run build
firebase deploy
```

---

## 🐛 Troubleshooting

### "Configuration not found" Error
**Problem:** Firebase Auth not enabled  
**Solution:**
1. Firebase Console → Authentication
2. Enable Email/Password sign-in method

### "Permission denied" Error
**Problem:** Firestore rules not set  
**Solution:**
1. Firebase Console → Firestore → Rules
2. Copy rules from `firestore.rules`
3. Publish

### Login Not Working
**Problem:** User not in Firestore  
**Solution:**
1. Check Firebase Console → Authentication (user exists?)
2. Check Firestore → users collection (document exists?)
3. Document ID must match User UID

### Queries/Invoices Not Loading
**Problem:** Missing indexes  
**Solution:**
1. Firebase Console → Firestore → Indexes
2. Firestore automatically prompts to create indexes
3. Or manually add from `firestore.indexes.json`

### PDF Not Generating
**Problem:** No sales data  
**Solution:**
- Create at least one invoice first
- Select a month with sales data

### Development Server Won't Start
**Problem:** Dependencies not installed  
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Laptop Models & Specs

### Available Models
```
MacBook Air M1
MacBook Air M2
MacBook Air M3
MacBook Pro 13" M1
MacBook Pro 13" M2
MacBook Pro 14" M1 Pro
MacBook Pro 14" M2 Pro
MacBook Pro 14" M3 Pro
MacBook Pro 16" M1 Pro
MacBook Pro 16" M2 Pro
MacBook Pro 16" M3 Pro
```

### Specs by Model
- **MacBook Air M1**: 8GB/256GB, 8GB/512GB, 16GB/512GB
- **MacBook Air M2**: 8GB/256GB, 8GB/512GB, 16GB/512GB, 24GB/512GB
- **MacBook Air M3**: 8GB/256GB, 16GB/512GB, 24GB/512GB
- **MacBook Pro 13" M1**: 8GB/256GB, 8GB/512GB, 16GB/512GB
- **MacBook Pro 13" M2**: 8GB/256GB, 16GB/512GB, 24GB/512GB
- **MacBook Pro 14" models**: 16GB/512GB, 16GB/1TB, 32GB/1TB, etc.
- **MacBook Pro 16" models**: Similar high-end configurations

---

## 💡 Tips & Best Practices

### For Clients
- ✅ Always check "Track Query" for updates
- ✅ Provide detailed notes in queries
- ✅ Check invoices regularly for payment status
- ✅ Contact admin if query status unclear

### For Admin
- ✅ Update query status promptly
- ✅ Double-check invoice amounts
- ✅ Generate monthly PDFs for records
- ✅ Review pending payments regularly
- ✅ Export data before month-end

### General
- 🔒 Never share login credentials
- 📧 Use strong, unique passwords
- 💾 Regular backup of important data
- 📊 Export monthly reports for accounting

---

## 📞 Support

For technical issues or questions:
- Check [SETUP.md](./SETUP.md) for detailed setup
- Review [README.md](./README.md) for overview
- Contact development team

---

**Last Updated:** January 2026  
**Version:** 1.0.0
