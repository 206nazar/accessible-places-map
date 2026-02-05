import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email.trim() || !password) return alert("Введи email і пароль.");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

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
      <Text style={styles.title}>Вхід</Text>

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

      <TouchableOpacity style={styles.btn} onPress={login}>
        <Text style={styles.btnText}>Увійти</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Немає акаунту? Реєстрація</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 18, backgroundColor: c.bg, justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center", color: c.text },

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
