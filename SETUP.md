# MacBook Sales System - Setup Guide

## 🚀 Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `macbook-sales-system`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### Step 3: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select your location (closest to you)
5. Click "Enable"

### Step 4: Update Security Rules

Go to the **Rules** tab and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read their own data, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Queries - clients can create and read their own, admins can read and update all
    match /queries/{queryId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Invoices - clients can read their own, admins can create and read all
    match /invoices/{invoiceId} {
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow read: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

Click **Publish**

### Step 5: Get Firebase Config

1. Go to **Project settings** (gear icon) → **General**
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app with nickname: `macbook-sales-web`
5. Copy the `firebaseConfig` object

### Step 6: Update Local Config

Open `src/firebase/config.js` and replace the config values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 👥 Create User Accounts

### Option 1: Using Firebase Console (Manual)

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Create admin account:
   - Email: `admin@macbook.com`
   - Password: `admin123`
4. After creating, note the **User UID**
5. Go to **Firestore Database**
6. Create a new collection called `users`
7. Add a document with ID = the User UID:
   ```json
   {
     "email": "admin@macbook.com",
     "role": "admin",
     "createdAt": [current timestamp]
   }
   ```

8. Repeat for each client account:
   - `Naveed@noreply.com` / `Naveed123` (role: client)
   - `Luqman@noreply.com` / `Luqman123` (role: client)
   - `Ali@noreply.com` / `Ali123` (role: client)
   - `RedApple@noreply.com` / `RedApple123` (role: client)

### Option 2: Using Setup Script (Automatic)

We'll create a Node.js script to automatically create all users.

**Important:** This requires Firebase Admin SDK

1. In Firebase Console, go to **Project settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in project root
4. Run the setup script:

```bash
npm run setup-users
```

## 🏗️ Firestore Schema

### Collections Structure

```
users/
  {userId}/
    - email: string
    - role: string (admin | client)
    - createdAt: timestamp

queries/
  {queryId}/
    - clientId: string
    - clientEmail: string
    - laptopModel: string
    - specs: string
    - quantity: number
    - budget: string (optional)
    - notes: string (optional)
    - status: string (Pending | In Progress | Completed | Cancelled)
    - createdAt: timestamp
    - updatedAt: timestamp

invoices/
  {invoiceId}/
    - clientId: string
    - clientEmail: string
    - laptopModel: string
    - specs: string
    - price: number
    - extraProfit: number
    - amountPaid: number
    - pendingAmount: number
    - month: string
    - saleDate: timestamp
    - createdAt: timestamp
```

## 🚀 Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## 📦 Deployment to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init
```
- Select: **Hosting**
- Use existing project: Select your project
- Public directory: `dist`
- Single-page app: **Yes**
- GitHub deploys: **No**

4. Build the project:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## 📝 User Accounts Reference

### Admin
- Email: `admin@macbook.com`
- Password: `admin123`
- Role: `admin`

### Clients
1. **Naveed**
   - Email: `Naveed@noreply.com`
   - Password: `Naveed123`
   - Role: `client`

2. **Luqman**
   - Email: `Luqman@noreply.com`
   - Password: `Luqman123`
   - Role: `client`

3. **Ali**
   - Email: `Ali@noreply.com`
   - Password: `Ali123`
   - Role: `client`

4. **RedApple**
   - Email: `RedApple@noreply.com`
   - Password: `RedApple123`
   - Role: `client`

## 🎨 Features

### Client Dashboard
- ✅ Place Query (submit laptop requests)
- ✅ Track Query (view status of submitted queries)
- ✅ Invoices (view purchase invoices without extra profit)

### Admin Dashboard
- ✅ Client Queries (view and update query status)
- ✅ Create Invoice (modal with auto-calculations)
- ✅ Sales Record (all invoices with extra profit visible)
- ✅ Share Distribution (monthly breakdown by partner)
- ✅ Monthly PDF Export (comprehensive sales report)

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Routing:** React Router DOM v6
- **PDF Generation:** jsPDF + jsPDF-AutoTable
- **Date Handling:** date-fns
- **Styling:** Custom CSS with modern dark theme

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1440px)
- Tablet (768px)
- Mobile (375px+)

---

**Need help?** Check Firebase documentation or contact the development team.
