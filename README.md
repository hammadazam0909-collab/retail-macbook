# 🖥️ MacBook Sales System

A full-stack web application for managing MacBook sales, client queries, invoices, and profit distribution built with React and Firebase.

🌐 **Live Application**: [https://ar-macbook.web.app](https://ar-macbook.web.app)

![React](https://img.shields.io/badge/React-19.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.8-orange)
![Vite](https://img.shields.io/badge/Vite-7.2-purple)
![Live Demo](https://img.shields.io/badge/Live--Demo-ar--macbook.web.app-brightgreen)

## ✨ Features

### 👤 Client Dashboard
- **Place Query**: Submit laptop purchase requests with model, specs, quantity, and budget
- **Track Query**: Monitor query status (Pending, In Progress, Completed, Cancelled)
- **Invoices**: View purchase invoices with pricing and payment details

### 👨‍💼 Admin Dashboard
- **Client Queries**: View all client queries and update their status
- **Create Invoice**: Generate invoices with automatic calculations for pending amounts
- **Sales Record**: Complete sales history with extra profit visibility
- **Share Distribution**: Monthly profit sharing breakdown among partners
- **PDF Export**: Generate comprehensive monthly sales reports

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
```bash
cd /Users/hammad/Desktop/ArMacbook
git clone <your-repo-url>
cd macbook-sales-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Setup**
   
   Follow the detailed instructions in [SETUP.md](./SETUP.md) to:
   - Create Firebase project
   - Enable Authentication
   - Setup Firestore
   - Configure security rules
   - Get credentials

4. **Update Firebase Config**

   Edit `src/firebase/config.js` with your Firebase credentials:
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

5. **Create User Accounts**

   Either manually in Firebase Console or use the automated script:
   ```bash
   # Download service account key from Firebase Console first
   npm run setup-users
   ```

6. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔐 User Authentication

Sign in using your authorized Firebase Authentication credentials (Admin or Client role). User accounts are created and managed via the Admin Dashboard or Firebase Console.

## 📁 Project Structure

```
macbook-sales-system/
├── src/
│   ├── components/         # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── firebase/          # Firebase configuration
│   │   └── config.js
│   ├── pages/            # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminDashboard.css
│   │   ├── ClientDashboard.jsx
│   │   ├── ClientDashboard.css
│   │   ├── Login.jsx
│   │   └── Login.css
│   ├── utils/            # Utility functions
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx           # Main app component
│   ├── App.css           # Global styles
│   └── main.jsx          # Entry point
├── scripts/              # Utility scripts
│   └── setupUsers.js     # User creation script
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── SETUP.md             # Detailed setup guide
├── package.json
└── README.md
```

## 🎨 Technology Stack

- **Frontend Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Routing**: React Router DOM 7.12
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Date Handling**: date-fns
- **Styling**: Custom CSS with modern dark theme

## 💾 Database Schema

### Users Collection
```javascript
{
  uid: string,
  email: string,
  role: "admin" | "client",
  displayName: string,
  createdAt: timestamp
}
```

### Queries Collection
```javascript
{
  id: string,
  clientId: string,
  clientEmail: string,
  laptopModel: string,
  specs: string,
  quantity: number,
  budget: string,
  notes: string,
  status: "Pending" | "In Progress" | "Completed" | "Cancelled",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Invoices Collection
```javascript
{
  id: string,
  clientId: string,
  clientEmail: string,
  laptopModel: string,
  specs: string,
  price: number,
  extraProfit: number,
  amountPaid: number,
  pendingAmount: number,
  month: string,
  saleDate: timestamp,
  createdAt: timestamp
}
```

## 🚀 Deployment

**Live Production URL**: [https://ar-macbook.web.app/login](https://ar-macbook.web.app/login)

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm run deploy
```

Or manually:
```bash
firebase login
firebase init
npm run build
firebase deploy
```

## 📊 Business Logic & Profit Sharing

### Partner Profit Distribution
The system automatically calculates monthly partner share splits based on configurable percentage allocations:
- **Partner A**: 50%
- **Partner B**: 30%
- **Partner C**: 20%

### Income Calculation
- **Fixed Commission**: Standard commission amount per laptop sold (e.g., PKR 5,500)
- **Monthly Revenue**: `Number of Sales × Fixed Commission`
- **Partner Payout**: `Monthly Revenue × Partner Percentage`

## 🔒 Security

- Role-based access control (Admin/Client)
- Firestore security rules
- Protected routes
- Email/Password authentication
- Secure session management

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Design

Fully responsive across all devices:
- Desktop (1920px+)
- Laptop (1440px)
- Tablet (768px)
- Mobile (375px+)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run setup-users` - Create user accounts (requires service key)
- `npm run deploy` - Build and deploy to Firebase

### Code Style

- ESLint for code quality
- Functional React components
- Modern ES6+ JavaScript
- CSS custom properties for theming
- Mobile-first responsive design

## 📝 License

This project is proprietary and confidential.

## 👥 Authors

- **Hammad** - Full-stack Developer

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- React team for the amazing framework
- Vite for lightning-fast builds

---

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

**Need help? Contact the development team.**
