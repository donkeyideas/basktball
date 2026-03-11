import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAc6bTd2eOnMSmltb8B_dSZtX_kEsxVrCQ",
  authDomain: "basktball-13cf5.firebaseapp.com",
  projectId: "basktball-13cf5",
  storageBucket: "basktball-13cf5.firebasestorage.app",
  messagingSenderId: "818441073299",
  appId: "1:818441073299:web:a65d6c6f300c9ba4791366",
  measurementId: "G-CEQQ05PSWE",
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
