import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const UserContext = createContext({
  ready: false,
  user: null,
  role: null,
  userName: "",
  userPhotoUrl: "",
  setUserName: () => {},
});

export function UserProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        setUserName("");
        setUserPhotoUrl("");
        setReady(true);
        return;
      }

      setUser(u);

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : null;

        setRole(data?.role || null);

        const resolvedName =
          data?.nickname ||
          data?.companyName ||
          data?.displayName ||
          data?.name ||
          u.displayName ||
          (u.email ? u.email.split("@")[0] : "");

        setUserName(resolvedName || "");
        setUserPhotoUrl(data?.photoUrl || u.photoURL || "");
      } catch (error) {
        setRole(null);
        setUserName(u.displayName || (u.email ? u.email.split("@")[0] : ""));
        setUserPhotoUrl(u.photoURL || "");
      } finally {
        setReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      role,
      userName,
      userPhotoUrl,
      setUserName,
    }),
    [ready, user, role, userName, userPhotoUrl]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}