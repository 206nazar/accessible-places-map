import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("person"); // "person" | "company"
  const [companyName, setCompanyName] = useState("");
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    if (!email.trim() || !password) return alert("Введи email і пароль.");

    if (role === "company") {
      if (!companyName.trim()) return alert("Введи назву компанії.");
    } else {
      if (!nickname.trim()) return alert("Введи нікнейм.");
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // базові поля профілю
      const userDoc = {
        role,
        email: email.trim(),
        createdAt: serverTimestamp(),
      };

      // роль-залежні поля
      if (role === "company") {
        userDoc.companyName = companyName.trim();
      } else {
        userDoc.nickname = nickname.trim();
      }

      await setDoc(doc(db, "users", uid), userDoc);

      alert("Реєстрація успішна ✅");
      navigation.goBack();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація</Text>

      {/* роль */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "person" && styles.roleActive]}
          onPress={() => setRole("person")}
        >
          <Text style={[styles.roleText, role === "person" && styles.roleTextActive]}>Особа</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === "company" && styles.roleActive]}
          onPress={() => setRole("company")}
        >
          <Text style={[styles.roleText, role === "company" && styles.roleTextActive]}>Компанія</Text>
        </TouchableOpacity>
      </View>

      {/* поля для ролі */}
      {role === "company" ? (
        <TextInput
          style={styles.input}
          placeholder="Назва компанії"
          value={companyName}
          onChangeText={setCompanyName}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Нікнейм (як вас будуть бачити)"
          value={nickname}
          onChangeText={setNickname}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

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
  container: { flex: 1, padding: 18, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },

  roleRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  roleActive: { backgroundColor: "#1f7a8c", borderColor: "#1f7a8c" },
  roleText: { fontWeight: "700" },
  roleTextActive: { color: "#fff" },

  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 12, marginBottom: 10 },
  btn: { backgroundColor: "#1f7a8c", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
  btnText: { color: "#fff", fontWeight: "bold" },
  link: { textAlign: "center", marginTop: 14, color: "#1f7a8c", fontWeight: "700" },
});