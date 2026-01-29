import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEJuE9-rxXkYqIuCVGJ28yBOeBtrbMiy4",
  authDomain: "accessible-places-map.firebaseapp.com",
  projectId: "accessible-places-map",
  storageBucket: "accessible-places-map.appspot.com",
  messagingSenderId: "631076943092",
  appId: "1:631076943092:web:27cb093d42bebd29475aa1",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export default app;
