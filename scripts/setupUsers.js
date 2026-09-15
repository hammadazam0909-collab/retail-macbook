/**
 * Firebase User Setup Script
 * This script creates all required user accounts for the MacBook Sales System
 * 
 * IMPORTANT: This requires Firebase Admin SDK
 * Before running:
 * 1. Download service account key from Firebase Console
 * 2. Save as serviceAccountKey.json in project root
 * 3. Run: node scripts/setupUsers.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// User accounts to create
const users = [
    {
        email: 'admin@macbook.com',
        password: 'admin123',
        role: 'admin',
        displayName: 'Admin'
    },
    {
        email: 'Naveed@noreply.com',
        password: 'Naveed123',
        role: 'client',
        displayName: 'Naveed'
    },
    {
        email: 'Luqman@noreply.com',
        password: 'Luqman123',
        role: 'client',
        displayName: 'Luqman'
    },
    {
        email: 'Ali@noreply.com',
        password: 'Ali123',
        role: 'client',
        displayName: 'Ali'
    },
    {
        email: 'RedApple@noreply.com',
        password: 'RedApple123',
        role: 'client',
        displayName: 'RedApple'
    }
];

async function createUser(userData) {
    try {
        // Check if user already exists
        try {
            const existingUser = await auth.getUserByEmail(userData.email);
            console.log(`✓ User ${userData.email} already exists (UID: ${existingUser.uid})`);

            // Update Firestore document
            await db.collection('users').doc(existingUser.uid).set({
                email: userData.email,
                role: userData.role,
                displayName: userData.displayName,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return existingUser.uid;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // User doesn't exist, create new
                const userRecord = await auth.createUser({
                    email: userData.email,
                    password: userData.password,
                    displayName: userData.displayName,
                    emailVerified: true
                });

                console.log(`✓ Created user ${userData.email} (UID: ${userRecord.uid})`);

                // Add user document to Firestore
                await db.collection('users').doc(userRecord.uid).set({
                    email: userData.email,
                    role: userData.role,
                    displayName: userData.displayName,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`✓ Created Firestore document for ${userData.email}`);

                return userRecord.uid;
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error(`✗ Error creating user ${userData.email}:`, error.message);
        throw error;
    }
}

async function setupUsers() {
    console.log('\n🚀 Starting user setup...\n');

    try {
        const results = [];

        for (const userData of users) {
            const uid = await createUser(userData);
            results.push({ ...userData, uid });
        }

        console.log('\n✅ User setup completed successfully!\n');
        console.log('Created/Updated users:');
        console.log('─────────────────────────────────────────────');

        results.forEach(user => {
            console.log(`${user.displayName.padEnd(15)} | ${user.email.padEnd(25)} | ${user.role.padEnd(10)} | ${user.uid}`);
        });

        console.log('─────────────────────────────────────────────\n');
        console.log('You can now login to the application with these credentials.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ User setup failed:', error);
        process.exit(1);
    }
}

// Run the setup
setupUsers();
