import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function AccountScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);

  // ✅ якщо увійшов — не показуємо цей екран, а одразу в профіль
  useEffect(() => {
    if (user) {
      navigation.replace("MyProfile");
    }
  }, [user, navigation]);

  // Поки редірект не встиг — можна нічого не рендерити
  if (user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ви не увійшли</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.btnText}>Вхід</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate("Register")}>
        <Text style={[styles.btnText, styles.btnOutlineText]}>Реєстрація</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Вхід потрібен для додавання місць (для компаній) та відгуків.
      </Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 14, color: c.text },

    btn: { backgroundColor: c.primary, padding: 14, borderRadius: 16, alignItems: "center", marginBottom: 12 },
    btnText: { color: "#fff", fontWeight: "900" },

    btnOutline: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
    btnOutlineText: { color: c.text },

    note: { marginTop: 10, textAlign: "center", color: c.muted, fontWeight: "700" },
  });
}
