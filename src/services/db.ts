import * as SQLite from 'expo-sqlite';
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

// Open the database
export async function getDBConnection() {
  return await SQLite.openDatabaseAsync('smartreceipt.db');
}

// Initialize tables
export async function initDB() {
  const db = await getDBConnection();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT,
      amount REAL,
      date TEXT,
      category TEXT,
      imageUri TEXT
    );
  `);
}

// Insert a new receipt
export async function insertReceipt(receipt: Receipt) {
  const db = await getDBConnection();
  const result = await db.runAsync(
    'INSERT INTO receipts (vendor, amount, date, category, imageUri) VALUES (?, ?, ?, ?, ?)',
    receipt.vendor, receipt.amount, receipt.date, receipt.category, receipt.imageUri
  );
  
  // -- CLOUD SYNC LOGIC --
  try {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(firestore, `users/${user.uid}/receipts`), {
        localId: result.lastInsertRowId,
        vendor: receipt.vendor,
        amount: receipt.amount,
        date: receipt.date,
        category: receipt.category,
        // imageUri omitted to save space, or we could upload to Firebase Storage later
        syncedAt: new Date().toISOString()
      });
      console.log('Receipt successfully synced to Firestore!');
    }
  } catch (error) {
    console.error('Silent fail: Could not sync receipt to cloud.', error);
  }

  return result.lastInsertRowId;
}

// Fetch all receipts
export async function getReceipts(): Promise<Receipt[]> {
  const db = await getDBConnection();
  const allRows = await db.getAllAsync('SELECT * FROM receipts ORDER BY id DESC');
  return allRows as Receipt[];
}
