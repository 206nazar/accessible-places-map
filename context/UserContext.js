import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const UserContext = createContext({
  userName: "",
  setUserName: () => {},
  loadingUserName: true,
});

export function UserProvider({ children }) {
  const [userName, setUserName] = useState("");
  const [loadingUserName, setLoadingUserName] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUserName("");
          setLoadingUserName(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : null;

        const name =
          data?.nickname ||
          data?.displayName ||
          data?.companyName ||
          (u.email ? u.email.split("@")[0] : "");

        setUserName(name || "");
      } catch (e) {
        setUserName("");
      } finally {
        setLoadingUserName(false);
      }
    });

    return unsub;
  }, []);

  const value = useMemo(
    () => ({ userName, setUserName, loadingUserName }),
    [userName, loadingUserName]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
