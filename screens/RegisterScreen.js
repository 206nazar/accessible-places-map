import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("person"); // person | company
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    if (!name.trim()) return alert("Введи ім'я/назву.");
    if (!email.trim()) return alert("Введи email.");
    if (password.length < 6) return alert("Пароль має бути мінімум 6 символів.");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        role,
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      // onAuthStateChanged сам перекине на Home
    } catch (e) {
        console.log("REGISTER ERROR:", e.code, e.message);
        alert(`${e.code}\n${e.message}`);
        }

  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація</Text>

      <Text style={styles.label}>Хто ви?</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "person" && styles.roleBtnActive]}
          onPress={() => setRole("person")}
        >
          <Text style={[styles.roleText, role === "person" && styles.roleTextActive]}>Особа</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === "company" && styles.roleBtnActive]}
          onPress={() => setRole("company")}
        >
          <Text style={[styles.roleText, role === "company" && styles.roleTextActive]}>Компанія</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={role === "company" ? "Назва компанії" : "Ваше ім’я"}
        value={name}
        onChangeText={setName}
      />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Пароль (>=6)" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={register}>
        <Text style={styles.btnText}>Зареєструватися</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Вже є акаунт? Увійти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  label: { marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  roleBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, alignItems: "center" },
  roleBtnActive: { borderColor: "#1f7a8c" },
  roleText: { color: "#333" },
  roleTextActive: { fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 10 },
  btn: { backgroundColor: "#1f7a8c", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  link: { textAlign: "center", marginTop: 12, color: "#1f7a8c" },
});
