const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore/lite');

const firebaseConfig = {
  apiKey: "AIzaSyAnpXwM5uP-AEofDIRpU93_qSinxTcsF0M",
  authDomain: "resumeiq-8af5f.firebaseapp.com",
  projectId: "resumeiq-8af5f",
  storageBucket: "resumeiq-8af5f.firebasestorage.app",
  messagingSenderId: "686911293132",
  appId: "1:686911293132:web:fb820445242ea384aea469"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const database = {
  async run(sql, params, callback) {
    try {
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const [username, email, password_hash] = params;

        const q = query(collection(firestore, 'users'), where('email', '==', email));
        const existing = await getDocs(q);
        if (!existing.empty) {
          return callback(new Error('UNIQUE constraint failed'));
        }

        const userRef = doc(collection(firestore, 'users'));
        const user = { id: userRef.id, username, email, password_hash, created_at: new Date().toISOString() };
        await setDoc(userRef, user);
        callback.call({ lastID: userRef.id }, null);
      }
    } catch (err) {
      callback(err);
    }
  },

  async get(sql, params, callback) {
    try {
      const email = params[0];
      const q = query(collection(firestore, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return callback(null, null);
      const data = snapshot.docs[0].data();
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }
};

module.exports = database;
