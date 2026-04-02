import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

// ВСТАВ СЮДИ СВІЙ WEB CLIENT ID ІЗ GOOGLE CLOUD
GoogleSignin.configure({
  webClientId: "631076943092-0eu18ba9me53e44oe94518kcgoutopbb.apps.googleusercontent.com",
});

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goByProfile = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const profile = snap.data();

      navigation.reset({
        index: 0,
        routes: [{ name: profile.role === "company" ? "CompanyHome" : "Home" }],
      });
    } else {
      navigation.navigate("RoleSelect");
    }
  };

  const login = async () => {
    if (!email.trim() || !password) {
      alert("Введи email і пароль.");
      return;
    }

    try {
      setLoading(true);

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await goByProfile(result.user);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices();

      const signInResult = await GoogleSignin.signIn();

      let idToken = signInResult?.data?.idToken || signInResult?.idToken;

      if (!idToken) {
        throw new Error("Не вдалося отримати Google token.");
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      await goByProfile(userCredential.user);
    } catch (e) {
      alert(e.message || "Помилка входу через Google.");
    } finally {
      setLoading(false);
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
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor={c.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Увійти</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleBtn} onPress={loginWithGoogle} disabled={loading}>
        <Text style={styles.googleBtnText}>Увійти через Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
        <Text style={styles.link}>Немає акаунту? Реєстрація</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 18,
      backgroundColor: c.bg,
      justifyContent: "center",
    },

    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
      color: c.text,
    },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      color: c.text,
      backgroundColor: c.surface,
    },

    btn: {
      backgroundColor: c.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
    },

    btnText: {
      color: "#fff",
      fontWeight: "bold",
    },

    googleBtn: {
      backgroundColor: "#ffffff",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.border,
    },

    googleBtnText: {
      color: "#111",
      fontWeight: "bold",
    },

    link: {
      textAlign: "center",
      marginTop: 14,
      color: c.primary,
      fontWeight: "700",
    },
  });
}