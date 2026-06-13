// Mock Database specifically for Web Preview to prevent expo-sqlite WebAssembly errors
import { Platform } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db as firestore } from './firebase';

export type Receipt = {
  id?: number;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  imageUri: string;
};

// We use some mock data so the UI isn't completely empty on the web browser
let mockReceipts: Receipt[] = [
  { id: 1, vendor: 'Starbucks', amount: 5.40, date: '2026-06-06', category: 'Food & Dining', imageUri: '' },
  { id: 2, vendor: 'Uber', amount: 15.20, date: '2026-06-05', category: 'Transportation', imageUri: '' },
  { id: 3, vendor: 'Apple Store', amount: 199.99, date: '2026-06-01', category: 'Software', imageUri: '' },
];

export async function getDBConnection() {
  return null;
}

export async function initDB() {
  console.log('Web mock DB initialized');
}

export async function insertReceipt(receipt: Receipt) {
  const newReceipt = { ...receipt, id: mockReceipts.length + 1 };
  mockReceipts = [newReceipt, ...mockReceipts]; // Add to top
  
  // -- CLOUD SYNC LOGIC --
  try {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(firestore, `users/${user.uid}/receipts`), {
        localId: newReceipt.id,
        vendor: receipt.vendor,
        amount: receipt.amount,
        date: receipt.date,
        category: receipt.category,
        syncedAt: new Date().toISOString()
      });
      console.log('Web Receipt successfully synced to Firestore!');
    }
  } catch (error) {
    console.error('Silent fail: Could not sync web receipt to cloud.', error);
  }

  return newReceipt.id;
}

export async function getReceipts(): Promise<Receipt[]> {
  return mockReceipts;
}
