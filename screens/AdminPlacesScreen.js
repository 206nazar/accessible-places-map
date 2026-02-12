import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function AdminPlacesScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const q = query(collection(db, "places"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, []);

  const removePlace = async (placeId) => {
    Alert.alert("Видалити точку?", "Це видалить саму точку. Відгуки до неї — окремо (можемо теж чистити).", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "places", placeId));
            setItems((prev) => prev.filter((x) => x.id !== placeId));
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
      <View style={styles.topRow}>
        <Text style={styles.title}>Точки</Text>
        <TouchableOpacity style={styles.refresh} onPress={load} activeOpacity={0.9}>
          <Text style={styles.refreshText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.muted}>Завантаження...</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || "Без назви"}</Text>
              <Text style={styles.cardMeta}>
                {item.category || "—"} • {item.ownerName || item.ownerUid || "—"}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => navigation.navigate("PlaceDetails", { placeId: item.id })}
                >
                  <Text style={styles.btnText}>Відкрити</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnOutline} onPress={() => removePlace(item.id)}>
                  <Text style={styles.btnOutlineText}>Видалити</Text>
                </TouchableOpacity>
              </View>
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

    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    title: { color: c.text, fontWeight: "900", fontSize: 20 },
    refresh: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    refreshText: { color: c.text, fontWeight: "900", fontSize: 16 },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    cardTitle: { color: c.text, fontWeight: "900", fontSize: 16 },
    cardMeta: { color: c.muted, marginTop: 4, fontWeight: "700" },

    row: { flexDirection: "row", gap: 10, marginTop: 12 },
    btn: { flex: 1, backgroundColor: c.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },

    btnOutline: {
      flex: 1,
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
