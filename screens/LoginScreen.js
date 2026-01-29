import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // беремо роль з Firestore
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "person";

      Alert.alert("Готово", "Ви увійшли ✅");

      // 🔥 перекидаємо на потрібний екран
      if (role === "company") {
        navigation.reset({
          index: 0,
          routes: [{ name: "CompanyHome" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
    } catch (e) {
      Alert.alert("Помилка входу", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вхід</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Увійти</Text>
      </TouchableOpacity>

      <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
        Немає акаунту? Реєстрація
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, marginBottom: 10 },
  btn: { backgroundColor: "#1f7a8c", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
  btnText: { color: "#fff", fontWeight: "bold" },
  link: { color: "#1f7a8c", textAlign: "center", marginTop: 14, fontWeight: "600" },
});
