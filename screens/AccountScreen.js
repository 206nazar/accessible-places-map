import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function AccountScreen({ navigation, user }) {
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ви не увійшли</Text>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.btnText}>Увійти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btn2]} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.btnText}>Реєстрація</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Вхід потрібен лише для додавання місць (для компаній).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ви увійшли</Text>
      <Text style={styles.email}>{user.email}</Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#eee" }]}
        onPress={async () => {
          await signOut(auth);
          navigation.popToTop();
        }}
      >
        <Text style={[styles.btnText, { color: "#000" }]}>Вийти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  email: { textAlign: "center", marginBottom: 20, color: "gray" },
  btn: { backgroundColor: "#1f7a8c", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  btn2: { backgroundColor: "#155e6b" },
  btnText: { color: "#fff", fontWeight: "bold" },
  note: { marginTop: 10, textAlign: "center", color: "gray" },
});
