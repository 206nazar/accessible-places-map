import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function AdminHomeScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      const u = user || auth.currentUser;
      if (!u) return setRole(null);
      const snap = await getDoc(doc(db, "users", u.uid));
      setRole(snap.exists() ? snap.data().role : null);
    })().catch(() => setRole(null));
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Увійди, щоб відкрити адмін.</Text>
      </View>
    );
  }

  if (role !== "admin") {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нема доступу (тільки admin).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Адмін панель</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("AdminPlaces")} activeOpacity={0.9}>
        <Text style={styles.btnText}>📍 Керування точками</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("AdminReviews")} activeOpacity={0.9}>
        <Text style={styles.btnText}>⭐ Модерація відгуків</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnOutline]}
        onPress={() => navigation.navigate("AddPlace")}
        activeOpacity={0.9}
      >
        <Text style={[styles.btnText, { color: c.text }]}>➕ Додати точку (як адмін)</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "800" },
    title: { color: c.text, fontWeight: "900", fontSize: 22, marginBottom: 12 },

    btn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 10,
    },
    btnText: { color: "#fff", fontWeight: "900" },

    btnOutline: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  });
}
