const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

const firebaseConfig = {
  apiKey: 'AIzaSyAXli7z32GDS3SD7gQzhx1IeUkc-HQXdUQ',
  authDomain: 'trupaddy-6f0f4.firebaseapp.com',
  projectId: 'trupaddy-6f0f4',
  storageBucket: 'trupaddy-6f0f4.appspot.com',
  messagingSenderId: '532348360741',
  appId: '1:532348360741:web:0a1fa5918f1b67892dc7cc',
  measurementId: 'G-RBXJE61WS2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { app, db, storage };
