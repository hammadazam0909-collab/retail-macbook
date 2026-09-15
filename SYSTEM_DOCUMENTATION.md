# 💻 MacBook Sales System — Comprehensive Architecture & Functional Documentation

## 📌 Overview
The **MacBook Sales System** is a production-ready, full-stack single-page web application (SPA) built using **React**, **Vite**, and **Firebase** (Authentication + Cloud Firestore). It acts as a dual-portal management system for wholesale and retail MacBook sales, client query tracking, automated invoicing, client-side Apple serial OCR camera scanning, and partner profit distribution.

---

## 🏗️ 1. High-Level Architecture & Tech Stack

```
                                  ┌───────────────────────────┐
                                  │      React Router v7      │
                                  └─────────────┬─────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             ┌───────────────────┐                             ┌───────────────────┐
             │   Client Portal   │                             │   Admin Portal    │
             └─────────┬─────────┘                             └─────────┬─────────┘
                       │                                                 │
  ┌────────────────────┼────────────────────┐        ┌───────────────────┼───────────────────┐
  ▼                    ▼                    ▼        ▼                   ▼                   ▼
┌──────────────┐ ┌──────────────┐ ┌───────────┐   ┌────────────┐ ┌───────────────┐ ┌───────────────────┐
│ Place Query  │ │ Track Query  │ │ Invoices  │   │ Client     │ │ Sales Record  │ │ Partner Share     │
│ Tab          │ │ Tab          │ │ Tab       │   │ Queries    │ │ & Invoices    │ │ & Monthly PDF     │
└──────────────┘ └──────────────┘ └───────────┘   └────────────┘ └───────┬───────┘ └───────────────────┘
                                                                         │
                                                                         ▼
                                                               ┌───────────────────┐
                                                               │  Tesseract.js OCR │
                                                               │  Camera Scanner   │
                                                               └───────────────────┘
```

### Stack Components:
* **Frontend Framework**: React 19 + Vite 7 (Single Page Application)
* **Routing & Access Control**: `react-router-dom` v7 with role-based route guards (`App.jsx`)
* **Authentication**: Firebase Authentication (Email / Password) (`AuthContext.jsx`)
* **Database**: Cloud Firestore (Real-time data synchronization for users, queries, invoices)
* **OCR & Computer Vision**: `tesseract.js` + WebRTC Browser Camera API (`SerialScannerModal.jsx`)
* **PDF Export Engine**: `jsPDF` + `jspdf-autotable`

---

## 🔐 2. Authentication & Security Infrastructure

### Key Files:
* `src/pages/Login.jsx` — User interface for email/password sign-in. Includes pre-configured quick login buttons for admin (`admin@macbook.com`) and client accounts (`Naveed`, `Luqman`, `Ali`, `RedApple`).
* `src/contexts/AuthContext.jsx` — React Context provider managing user sessions with `onAuthStateChanged`. Fetches custom user roles (`admin` or `client`) from the Firestore `users` collection upon login.
* `src/components/ProtectedRoute.jsx` — Higher-Order Component / Route Guard that inspects the logged-in user's role before rendering routes. Redirects unauthorized users to `/login` or their authorized home page.
* `firestore.rules` — Backend database security rules enforcing collection-level and field-level permissions.

---

## 👤 3. Client Portal (`/client`)

Managed by `src/pages/ClientDashboard.jsx`, the Client Portal is split into **3 dedicated tabs**:

### 🟢 Tab 1: Place Query
* **Purpose**: Allows clients to request quotes or check inventory for specific MacBook configurations.
* **Features**:
  * **Dynamic Model Dropdown**: Select from 30+ Apple MacBook models ranging from M1 Air up to M5 Max Pro (`src/utils/constants.js`).
  * **Dynamic Specifications**: Auto-populates official RAM & SSD combinations tailored to the selected model (e.g. 8GB/256GB up to 128GB/8TB).
  * **Order Details**: Select quantity, target budget in PKR, and enter custom notes.
  * **Database Sync**: Creates a new record in the Firestore `queries` collection with `status: 'Pending'`.

### 🟡 Tab 2: Track Queries
* **Purpose**: Real-time status tracker for all queries submitted by the active client.
* **Features**:
  * Lists submission timestamp, laptop model, specifications, budget, notes, and current status badge.
  * **Status Lifecycle**: `Pending` ➔ `Available` / `Not Available` ➔ `Completed` / `Cancelled`.
  * Real-time and manual refresh controls.

### 🔵 Tab 3: My Invoices
* **Purpose**: Financial transparency view for completed client purchases.
* **Features**:
  * Displays invoice date, MacBook model, serial numbers, total price, amount paid, and pending balance.
  * **Data Privacy**: Internal financial details (extra profit, base profit, and partner distribution) are strictly excluded from client views.

---

## 👑 4. Admin Portal (`/admin`)

Managed by `src/pages/AdminDashboard.jsx`, the Admin Portal provides comprehensive control across **3 core sections**:

### 📋 Section 1: Client Queries Management
* **Purpose**: Master view and workflow manager for all client requests across all users.
* **Features**:
  * Filter queries by status (`Pending`, `Available`, `Not Available`, `Completed`, `Cancelled`) or search by client email.
  * Status dropdown to update query state in real-time.
  * **One-Click Invoice Conversion**: Convert any client query directly into a sales invoice with pre-filled specs.

### 💰 Section 2: Sales Record & Invoice Ledger
* **Purpose**: Comprehensive database of all sales, payments, extra profit margins, and invoice records.
* **Features**:
  * **KPI Summary Header**: Displays Total Sales Count, Total Revenue (PKR), Total Extra Profit (Admin cut), and Outstanding Pending Balances.
  * **Invoice Creation Modal**: Interface to log new sales, record client details, price, extra profit, payment status, and Apple Serial Numbers.
  * **Serial Number OCR Integration**: Trigger the live camera OCR scanner directly from the serial number field.
  * **Payment Updater**: Modal to update client payments (`amountPaid` vs `pendingAmount`).

### 📊 Section 3: Partner Share & Profit Distribution
* **Purpose**: Automated monthly revenue calculation and profit distribution among business partners.
* **Business Logic Rules**:
  * **Fixed Base Profit**: PKR 5,500 per laptop sold (`src/utils/constants.js`).
  * **Admin Extra Profit**: Added directly to the monthly pool per invoice.
  * **Partner Revenue Split**:
    * 👑 **Hammad**: **50%** share of monthly pool
    * 👩‍💼 **Sehar**: **30%** share of monthly pool
    * 👨‍💼 **Nouman**: **20%** share of monthly pool
* **PDF Report Generation**: Uses `jsPDF` and `jspdf-autotable` to produce a downloadable, professionally formatted monthly PDF report featuring transaction breakdown tables, total sales stats, and partner share calculations.

---

## 📷 5. Apple Serial Number Camera Scanner

Located in `src/components/SerialScannerModal.jsx`, this component provides instant client-side camera scanning for Apple serial numbers during invoice creation.

```
       ┌────────────────────────┐
       │   Browser WebRTC Cam   │
       └───────────┬────────────┘
                   │ Video Stream Frame
                   ▼
       ┌────────────────────────┐
       │  Tesseract.js OCR      │
       └───────────┬────────────┘
                   │ Raw Extracted Text
                   ▼
       ┌────────────────────────┐
       │ Apple Serial Regex     │ ◄── Validates 12-char (Legacy)
       │ Regex Validation       │     or 10-char (Modern) formats
       └───────────┬────────────┘
                   │ Clean Serial Number
                   ▼
       ┌────────────────────────┐
       │ Form Input Auto-Fill   │
       └────────────────────────┘
```

1. **WebRTC Integration**: Accesses the device camera using `navigator.mediaDevices.getUserMedia()`.
2. **Real-time Optical Character Recognition**: Processes video frames using a dedicated `tesseract.js` OCR worker.
3. **Format Validation**: Validates recognized strings against Apple serial number patterns (12-char legacy like `C02...` or 10-char modern like `FVF...`).
4. **Direct Form Injection**: Inserts validated serial numbers directly into the invoice form field.

---

## 🗄️ 6. Cloud Firestore Database Schema

```
Cloud Firestore
├── 📂 users (Collection)
│   └── 📄 {uid} -> { displayName, email, role: 'admin'|'client', createdAt }
├── 📂 queries (Collection)
│   └── 📄 {queryId} -> { clientId, clientEmail, laptopModel, specs, quantity, budget, notes, status, createdAt }
└── 📂 invoices (Collection)
    └── 📄 {invoiceId} -> { clientId, clientEmail, laptopModel, specs, price, extraProfit, amountPaid, pendingAmount, serialNumber, month, saleDate }
```

---

## 📑 7. Summary Table of Files & Roles

| File Path | Description / Key Responsibility |
| :--- | :--- |
| `src/App.jsx` | App entry point, routing setup, and role-based route guard assignments |
| `src/contexts/AuthContext.jsx` | Authentication state provider managing user session and Firestore role fetching |
| `src/components/ProtectedRoute.jsx` | Higher-order wrapper component for route permissions |
| `src/pages/Login.jsx` | Sign-in page with quick-fill demo buttons |
| `src/pages/ClientDashboard.jsx` | Client portal (Place Query, Track Query, My Invoices) |
| `src/pages/AdminDashboard.jsx` | Admin portal (Queries management, Sales record, Profit distribution & PDF export) |
| `src/components/SerialScannerModal.jsx` | Client-side camera scanner with Tesseract OCR for Apple serial numbers |
| `src/utils/constants.js` | App constants (models, specs mapping, 50/30/20 share split, PKR 5,500 base profit) |
| `src/utils/helpers.js` | Formatting utility functions (currency, dates, unique invoice IDs) |
| `src/firebase/config.js` | Firebase initialization (Auth, Firestore, Storage) |
