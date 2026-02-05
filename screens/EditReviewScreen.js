import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

export default function EditReviewScreen({ route, navigation }) {
  const { mode, placeId, reviewId } = route.params; // mode: "add" | "edit"
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    (async () => {
      if (mode !== "edit") return;

      const ref = doc(db, "places", placeId, "reviews", reviewId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("Відгук не знайдено");
        navigation.goBack();
        return;
      }
      const data = snap.data();
      setRating(String(data.rating ?? 5));
      setText(data.text || "");
    })()
      .catch((e) => alert(e?.message || "Помилка"))
      .finally(() => setLoading(false));
  }, [mode, placeId, reviewId, navigation]);

  const getAuthorName = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return "Користувач";
      const u = snap.data();
      return u.role === "company" ? u.companyName || "Компанія" : u.nickname || "Користувач";
    } catch {
      return "Користувач";
    }
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Спочатку увійдіть");

    const r = clamp(rating, 1, 5);
    if (!text.trim()) return alert("Напишіть текст відгуку");

    const authorName = await getAuthorName(uid);

    const id = mode === "edit" ? reviewId : uid; 
    // ✅ робимо reviewId = uid, щоб “1 користувач = 1 відгук на місце”
    // (так легше редагувати “свій” відгук)
    const ref = doc(db, "places", placeId, "reviews", id);

    await setDoc(
      ref,
      {
        uid,
        authorName,
        rating: r,
        text: text.trim(),
        updatedAt: serverTimestamp(),
        createdAt: mode === "edit" ? undefined : serverTimestamp(),
      },
      { merge: true }
    );

    navigation.goBack();
  };

  const remove = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "places", placeId, "reviews", reviewId);
    await deleteDoc(ref);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.gray}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === "edit" ? "Редагувати відгук" : "Додати відгук"}</Text>

      <Text style={styles.label}>Оцінка (1–5)</Text>
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
        placeholder="Напишіть відгук…"
        placeholderTextColor={c.muted}
      />

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Зберегти</Text>
      </TouchableOpacity>

      {mode === "edit" ? (
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={remove}>
          <Text style={styles.btnText}>Видалити</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: c.text },
    gray: { color: c.muted },

    label: { marginTop: 10, marginBottom: 6, fontWeight: "800", color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      color: c.text,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },

    btn: { backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
    btnDanger: { backgroundColor: "#b00020" },
    btnText: { color: "#fff", fontWeight: "bold" },
  });
}
