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

  // якщо десь треба вручну (рідко)
  setUserName: () => {},
});

export function UserProvider({ children }) {
  const [ready, setReady] = useState(false);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [userName, setUserName] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);

      // reset (на вихід)
      if (!u) {
        setRole(null);
        setUserName("");
        setUserPhotoUrl("");
        setReady(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : null;

        setRole(data?.role || null);

        const name =
          data?.nickname ||
          data?.companyName ||
          data?.displayName ||
          data?.name ||
          u.displayName ||
          (u.email ? u.email.split("@")[0] : "");

        setUserName(name || "");
        setUserPhotoUrl(data?.photoUrl || "");
      } catch (e) {
        // fallback
        setRole(null);
        setUserName(u.email ? u.email.split("@")[0] : "");
        setUserPhotoUrl("");
      } finally {
        setReady(true);
      }
    });

    return unsub;
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
