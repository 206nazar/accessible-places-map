import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function EditPlaceScreen({ route, navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const placeId = route?.params?.placeId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId) {
      alert("Помилка: не передано placeId");
      navigation.goBack();
      return;
    }

    const loadPlace = async () => {
      try {
        const ref = doc(db, "places", placeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Точку не знайдено");
          navigation.goBack();
          return;
        }

        const data = snap.data();
        setTitle(data.title || "");
        setDescription(data.description || "");
      } catch (e) {
        alert(e?.message || "Помилка завантаження");
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [placeId, navigation]);

  const save = async () => {
    if (!title.trim()) return alert("Назва обовʼязкова");

    try {
      await updateDoc(doc(db, "places", placeId), {
        title: title.trim(),
        description: description.trim(),
        updatedAt: serverTimestamp(),
        status: "pending",
      });

      alert("Зміни збережено ✅ (status=pending)");
      navigation.goBack();
    } catch (e) {
      alert(e?.message || "Помилка збереження");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Редагувати місце</Text>

      <TextInput
        style={styles.input}
        placeholder="Назва"
        placeholderTextColor={c.muted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Опис"
        placeholderTextColor={c.muted}
        value={description}
        onChangeText={setDescription}
        multiline
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
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: c.text },
    muted: { color: c.muted, fontWeight: "700" },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      color: c.text,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    textArea: { height: 110, textAlignVertical: "top" },

    btn: { backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
    btnText: { color: "#fff", fontWeight: "bold" },
  });
}
