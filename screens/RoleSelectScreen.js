import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

export default function RoleSelectScreen({ navigation }) {
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
      >
        <Text style={[styles.roleText, role === "person" && styles.activeText]}>Особа</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleBtn, role === "company" && styles.active]}
        onPress={() => setRole("company")}
      >
        <Text style={[styles.roleText, role === "company" && styles.activeText]}>Компанія</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Продовжити</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Компанія зможе додавати свої локації та опис доступності.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  roleBtn: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 14, marginBottom: 10, alignItems: "center" },
  roleText: { color: "#333" },
  active: { borderColor: "#1f7a8c" },
  activeText: { fontWeight: "bold" },
  saveBtn: { marginTop: 10, backgroundColor: "#1f7a8c", padding: 14, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
  note: { marginTop: 12, textAlign: "center", color: "gray" },
});
