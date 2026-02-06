import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAEJuE9-rxXkYqIuCVGJ28yBOeBtrbMiy4",
  authDomain: "accessible-places-map.firebaseapp.com",
  projectId: "accessible-places-map",

  // ✅ bucket має збігатися з тим, що показує Storage у консолі
  storageBucket: "accessible-places-map.firebasestorage.app",

  messagingSenderId: "631076943092",
  appId: "1:631076943092:web:27cb093d42bebd29475aa1",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
