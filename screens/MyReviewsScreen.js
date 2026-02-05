import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function MyReviewsScreen({ user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Потрібно увійти.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Мої відгуки</Text>
      <Text style={styles.hint}>
        Тут далі зробимо: список відгуків, редагування/видалення, прив’язку до місць.
      </Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    h1: { fontSize: 20, fontWeight: "900", color: c.text, marginBottom: 12 },
    text: { color: c.text, fontWeight: "800" },
    hint: { marginTop: 8, color: c.muted, fontWeight: "700" },
  });
}
