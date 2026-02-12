import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function AdminReviewsScreen({ user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, []);

  const removeReview = async (reviewId) => {
    Alert.alert("Видалити відгук?", "Дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reviews", reviewId));
            setItems((prev) => prev.filter((x) => x.id !== reviewId));
          } catch (e) {
            alert(e?.message || "Помилка видалення");
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Увійди.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Відгуки</Text>

      {loading ? (
        <Text style={styles.muted}>Завантаження...</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ {item.rating || 0}</Text>
              <Text style={styles.cardMeta}>
                {item.authorName || item.authorEmail || "Користувач"} • placeId: {item.placeId || "—"}
              </Text>
              <Text style={styles.cardText} numberOfLines={4}>
                {item.text || "—"}
              </Text>

              <TouchableOpacity style={styles.btnOutline} onPress={() => removeReview(item.id)}>
                <Text style={styles.btnOutlineText}>Видалити</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "800" },
    title: { color: c.text, fontWeight: "900", fontSize: 20, marginBottom: 10 },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    cardTitle: { color: c.text, fontWeight: "900" },
    cardMeta: { color: c.muted, marginTop: 4, fontWeight: "700" },
    cardText: { color: c.text, marginTop: 8, lineHeight: 20 },

    btnOutline: {
      marginTop: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    btnOutlineText: { color: c.text, fontWeight: "900" },
  });
}
