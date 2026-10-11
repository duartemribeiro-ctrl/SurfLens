import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGcQ1XfD7ypkBH0IxH7WiC_RC5Oo2HDmU",
  authDomain: "surflens-7539b.firebaseapp.com",
  projectId: "surflens-7539b",
  storageBucket: "surflens-7539b.firebasestorage.app",
  messagingSenderId: "109199479428",
  appId: "1:109199479428:web:28618b2b9d8c03d066a8d1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);