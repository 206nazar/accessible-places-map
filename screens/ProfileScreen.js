import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("person");
  const [nickname, setNickname] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) {
        navigation.goBack();
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setRole(data.role || "person");
        setNickname(data.nickname || "");
        setCompanyName(data.companyName || "");
      }
      setLoading(false);
    })().catch((e) => {
      alert(e?.message || "Помилка завантаження профілю");
      setLoading(false);
    });
  }, [navigation]);

  const save = async () => {
    if (!user) return;

    const payload = {
      role,
      email: user.email || "",
      updatedAt: new Date(),
    };

    if (role === "company") payload.companyName = companyName.trim();
    else payload.nickname = nickname.trim();

    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    alert("Профіль збережено ✅");
    navigation.goBack();
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мій профіль</Text>
      <Text style={styles.sub}>{user.email}</Text>

      {loading ? (
        <Text style={styles.muted}>Завантаження...</Text>
      ) : (
        <>
          <Text style={styles.label}>Роль</Text>
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
            <>
              <Text style={styles.label}>Назва компанії</Text>
              <TextInput
                style={styles.input}
                placeholder="Напр. Accessible Group"
                placeholderTextColor={c.muted}
                value={companyName}
                onChangeText={setCompanyName}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Нікнейм</Text>
              <TextInput
                style={styles.input}
                placeholder="Як вас будуть бачити"
                placeholderTextColor={c.muted}
                value={nickname}
                onChangeText={setNickname}
              />
            </>
          )}

          <TouchableOpacity style={styles.btn} onPress={save}>
            <Text style={styles.btnText}>Зберегти</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "bold", color: c.text },
    sub: { marginTop: 6, color: c.muted, marginBottom: 14 },

    muted: { color: c.muted },

    label: { marginTop: 10, marginBottom: 6, color: c.muted, fontWeight: "800" },

    roleRow: { flexDirection: "row", gap: 10 },
    roleBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: "center",
    },
    roleActive: { backgroundColor: c.primary, borderColor: c.primary },
    roleText: { fontWeight: "800", color: c.text },
    roleTextActive: { color: "#fff" },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },

    btn: { marginTop: 10, backgroundColor: c.primary, padding: 14, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },
  });
}
