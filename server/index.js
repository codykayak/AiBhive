import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { processLeadJob } from './processing.js';
import nodemailer from 'nodemailer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (e) {
  console.warn("Could not initialize Firebase Admin automatically.", e.message);
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
}

const db = admin.firestore();
const storage = new Storage();
const bucketName = 'aibhive-media';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
  apiVersion: '2023-10-16',
});

// Middleware
app.use(cors());
app.use(express.json());

// Webhook endpoint needs raw body - must be before other middleware
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // ... ...
  // (I'm not repasting all 100+ lines of the webhook to save space - keep everything from your current webhook exactly as it is)
});

// Regular JSON middleware for other endpoints
app.use(express.json());

// Endpoint to create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  // ... ...
});

// === SERVE FRONTEND - THIS MUST BE AT THE BOTTOM ===
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/cody', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/cody/index.html'));
});

// Catch-all route - THIS MUST BE THE VERY LAST ROUTE
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
