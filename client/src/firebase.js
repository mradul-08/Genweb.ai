import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "genwebai-dca16.firebaseapp.com",
  projectId: "genwebai-dca16",
  storageBucket: "genwebai-dca16.firebasestorage.app",
  messagingSenderId: "350304621044",
  appId: "1:350304621044:web:bc4551ca81620c8a6a29a1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };