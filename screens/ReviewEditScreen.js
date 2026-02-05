import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function ReviewEditScreen({ route, navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const placeId = route?.params?.placeId;

  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [place, setPlace] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "places", placeId));
      setPlace(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    })().catch((e) => alert(e.message));
  }, [placeId]);

  const save = async () => {
    if (!user) return navigation.navigate("Login");
    if (!placeId) return alert("placeId missing");
    if (!text.trim()) return alert("Напиши текст відгуку.");
    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) return alert("Рейтинг має бути 1..5");

    if (!place) return alert("Точка не знайдена");

    try {
      await addDoc(collection(db, "reviews"), {
        placeId,
        placeTitle: place.title || "",
        ownerUid: place.ownerUid || "",

        authorUid: user.uid,
        authorEmail: user.email || "",
        authorName: user.email || "Користувач",

        rating: r,
        text: text.trim(),
        createdAt: serverTimestamp(),

        reply: null,
      });

      alert("Відгук додано ✅");
      navigation.goBack();
    } catch (e) {
      alert(e?.message || "Помилка збереження");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Відгук</Text>

      <Text style={styles.label}>Рейтинг (1..5)</Text>
      <TextInput
        style={styles.input}
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
        placeholder="5"
        placeholderTextColor={c.muted}
      />

      <Text style={styles.label}>Текст</Text>
      <TextInput
        style={[styles.input, { height: 120 }]}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Напиши коротко, що добре/погано..."
        placeholderTextColor={c.muted}
      />

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Зберегти</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "bold", color: c.text, marginBottom: 12 },
    label: { color: c.muted, fontWeight: "800", marginTop: 10, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 12,
      padding: 12,
    },
    btn: { marginTop: 14, backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },
  });
}
