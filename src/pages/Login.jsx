import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, CLIENT_ACCOUNTS } from '../utils/constants';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setError('');
            setLoading(true);

            const { role } = await signIn(email, password);

            // Redirect based on role
            if (role === ROLES.ADMIN) {
                navigate('/admin');
            } else if (role === ROLES.CLIENT) {
                navigate('/client');
            }
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (email, password) => {
        setEmail(email);
        setPassword(password);
    };

    const initializeUsers = async () => {
        if (!window.confirm('This will attempt to create the default user accounts. Continue?')) return;

        setLoading(true);
        try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { auth, db } = await import('../firebase/config');

            const users = [
                { email: 'admin@macbook.com', password: 'admin123', role: 'admin', name: 'Admin' },
                ...CLIENT_ACCOUNTS
            ];

            let created = 0;
            let errors = 0;

            for (const user of users) {
                try {
                    // Try to create user
                    const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);

                    // Create Firestore doc
                    await setDoc(doc(db, 'users', userCredential.user.uid), {
                        email: user.email,
                        role: user.role || 'client',
                        displayName: user.name,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    created++;
                } catch (err) {
                    if (err.code === 'auth/email-already-in-use') {
                        console.log(`User ${user.email} already exists.`);
                        // Optional: Update firestore anyway? tricky without auth.
                    } else {
                        console.error(`Failed to create ${user.email}:`, err);
                        errors++;
                    }
                }
            }
            alert(`Setup complete. Created ${created} new users. ${errors} errors.`);
        } catch (error) {
            console.error('Setup failed:', error);
            alert('Setup failed. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>AR-MacBook</h1>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {/* Initialize Database Section - Commented Out */}
                    {/* <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>First time here?</p>
                        <button
                            type="button"
                            onClick={initializeUsers}
                            className="btn-secondary"
                            style={{ width: '100%', background: '#4f46e5', color: 'white', borderColor: '#4f46e5' }}
                        >
                            Initialize Database & Create Users
                        </button>
                    </div> */}
                </form>

                {/* Quick Access Section - Commented Out */}
                {/* <div className="quick-access">
                    <h3>Quick Access</h3>
                    <div className="quick-access-grid">
                        <div className="quick-access-card">
                            <h4>Admin Account</h4>
                            <p className="credentials">admin@macbook.com</p>
                            <button
                                onClick={() => quickLogin('admin@macbook.com', 'admin123')}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                Use Admin Login
                            </button>
                        </div>
                        {/* Rest of quick access cards (mapped or static) */}
                {/* {CLIENT_ACCOUNTS.map((account, index) => (
                            <div key={index} className="quick-access-card">
                                <h4>{account.name}</h4>
                                <p className="credentials">{account.email}</p>
                                <button
                                    onClick={() => quickLogin(account.email, account.password)}
                                    className="btn-secondary"
                                    disabled={loading}
                                >
                                    Use This Account
                                </button>
                            </div>
                        ))} */}
                {/* </div>
                </div> */}
            </div>
        </div>
    );
};

export default Login;
