import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCzPMgSc5OaJhK9o3dY4b4v9WdS7T0mg2Q',
  authDomain: 'scm-kikes.firebaseapp.com',
  projectId: 'scm-kikes',
  storageBucket: 'scm-kikes.appspot.com', // Corregido: 'firebasestorage.app' es incorrecto para el SDK
  messagingSenderId: '918237344547',
  appId: '1:918237344547:web:d055dd89073222bc83d296',
  measurementId: 'G-6ST8CW6S2R',
};

// Inicialización de Firebase (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
