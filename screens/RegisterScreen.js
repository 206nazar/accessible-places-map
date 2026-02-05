import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [role, setRole] = useState("person");
  const [companyName, setCompanyName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    if (!email.trim() || !password) return alert("Введи email і пароль.");

    if (role === "company" && !companyName.trim()) {
      return alert("Введи назву компанії.");
    }
    if (role === "person" && !nickname.trim()) {
      return alert("Введи нікнейм.");
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      const userDoc = {
        role,
        email: email.trim(),
        createdAt: serverTimestamp(),
        ...(role === "company"
          ? { companyName: companyName.trim() }
          : { nickname: nickname.trim() }),
      };

      await setDoc(doc(db, "users", uid), userDoc);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація</Text>

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

      {role === "company" ? (
        <TextInput
          style={styles.input}
          placeholder="Назва компанії"
          placeholderTextColor={c.muted}
          value={companyName}
          onChangeText={setCompanyName}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Нікнейм"
          placeholderTextColor={c.muted}
          value={nickname}
          onChangeText={setNickname}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={c.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor={c.muted}
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

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 18, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: c.text },

    roleRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    roleBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    roleActive: { backgroundColor: c.primary, borderColor: c.primary },
    roleText: { fontWeight: "700", color: c.text },
    roleTextActive: { color: "#fff" },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      color: c.text,
      backgroundColor: c.surface,
    },

    btn: { backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },

    link: { textAlign: "center", marginTop: 14, color: c.primary, fontWeight: "700" },
  });
}
