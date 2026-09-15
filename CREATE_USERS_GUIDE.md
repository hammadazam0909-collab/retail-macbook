# 🔐 Quick User Account Setup Guide

## Why You Can't Login

The user accounts don't exist in Firebase yet! You need to create them first.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Enable Email/Password Authentication

1. Open: https://console.firebase.google.com/project/ar-macbook/authentication/providers
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **"Enable"** ON
5. Click **"Save"**

### Step 2: Create Firestore Database

1. Open: https://console.firebase.google.com/project/ar-macbook/firestore
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your region (e.g., asia-south1)
5. Click **"Enable"**

### Step 3: Update Firestore Rules

1. After Firestore is created, go to the **"Rules"** tab
2. **Delete all existing content**
3. **Paste this** (copy from here):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow write: if isAdmin();
    }
    
    match /queries/{queryId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated() && (resource.data.clientId == request.auth.uid || isAdmin());
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    match /invoices/{invoiceId} {
      allow create: if isAdmin();
      allow read: if isAuthenticated() && (resource.data.clientId == request.auth.uid || isAdmin());
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

4. Click **"Publish"**

### Step 4: Create User Accounts

#### A. Create Admin Account

1. Go to: https://console.firebase.google.com/project/ar-macbook/authentication/users
2. Click **"Add user"**
3. Enter:
   - Email: `admin@macbook.com`
   - Password: `admin123`
4. Click **"Add user"**
5. **COPY THE UID** (the long code like `abc123xyz...`)

Now add to Firestore:
1. Go to: https://console.firebase.google.com/project/ar-macbook/firestore/databases/-default-/data
2. Click **"Start collection"**
3. Collection ID: `users`
4. Click **"Next"**
5. Document ID: **PASTE THE UID YOU COPIED**
6. Add fields:
   - Field: `email`, Type: string, Value: `admin@macbook.com`
   - Click "+ Add field"
   - Field: `role`, Type: string, Value: `admin`
   - Click "+ Add field"  
   - Field: `displayName`, Type: string, Value: `Admin`
   - Click "+ Add field"
   - Field: `createdAt`, Type: timestamp, Value: (click to set current time)
7. Click **"Save"**

#### B. Create Client Accounts (Repeat for each)

**For Naveed:**
1. Authentication → Add user:
   - Email: `Naveed@noreply.com`
   - Password: `Naveed123`
2. Copy the UID
3. Firestore → users collection → Add document:
   - Document ID: PASTE UID
   - email: `Naveed@noreply.com`
   - role: `client`
   - displayName: `Naveed`
   - createdAt: (current timestamp)

**For Luqman:**
1. Authentication → Add user:
   - Email: `Luqman@noreply.com`
   - Password: `Luqman123`
2. Copy UID
3. Firestore → Add document with UID, role: `client`, etc.

**For Ali:**
1. Authentication → Add user:
   - Email: `Ali@noreply.com`
   - Password: `Ali123`
2. Copy UID
3. Firestore → Add document with UID, role: `client`, etc.

**For RedApple:**
1. Authentication → Add user:
   - Email: `RedApple@noreply.com`
   - Password: `RedApple123`
2. Copy UID
3. Firestore → Add document with UID, role: `client`, etc.

---

## ✅ Done! Now You Can Login

Visit: http://localhost:5173 or https://ar-macbook.web.app

Login with:
- **Admin:** admin@macbook.com / admin123
- **Client:** Naveed@noreply.com / Naveed123

---

## 🎨 What's New in Client Dashboard

The Client Dashboard now has a **premium, clean design** matching the Admin Dashboard:

✅ Larger, bolder headings with gradient underlines
✅ Enhanced card designs with subtle gradients
✅ Better spacing and padding
✅ Improved hover effects with smooth animations
✅ Premium detail boxes with background colors
✅ Beautiful table design with gradient headers
✅ Consistent styling throughout

**The interface now looks professional and polished!**

---

Need help? Check the Firebase Console links above!
