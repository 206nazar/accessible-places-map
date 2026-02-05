import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function RoleSelectScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [role, setRole] = useState("person"); // person | company

  const save = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      role,
      name: user.displayName || "",
      email: user.email || "",
      createdAt: serverTimestamp(),
    });

    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оберіть тип акаунта</Text>

      <TouchableOpacity
        style={[styles.roleBtn, role === "person" && styles.active]}
        onPress={() => setRole("person")}
        activeOpacity={0.9}
      >
        <Text style={[styles.roleText, role === "person" && styles.activeText]}>Особа</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleBtn, role === "company" && styles.active]}
        onPress={() => setRole("company")}
        activeOpacity={0.9}
      >
        <Text style={[styles.roleText, role === "company" && styles.activeText]}>Компанія</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.9}>
        <Text style={styles.saveText}>Продовжити</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Компанія зможе додавати свої локації та опис доступності.</Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: c.bg },
    title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: c.text },

    roleBtn: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      alignItems: "center",
    },
    roleText: { color: c.text, fontWeight: "700" },

    active: { borderColor: c.primary, backgroundColor: c.card },
    activeText: { fontWeight: "900", color: c.primary },

    saveBtn: { marginTop: 10, backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    saveText: { color: "#fff", fontWeight: "bold" },

    note: { marginTop: 12, textAlign: "center", color: c.muted },
  });
}
