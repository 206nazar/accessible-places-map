import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function MyReviewsScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const me = user || auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!me) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "reviews"), where("authorUid", "==", me.uid));
    const snap = await getDocs(q);
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    arr.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    setItems(arr);
    setLoading(false);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => load().catch((e) => alert(e.message)));
    load().catch((e) => alert(e.message));
    return unsub;
  }, [navigation]);

  if (!me) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Увійдіть, щоб бачити відгуки.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.btnText}>Вхід</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мої відгуки</Text>

      {loading ? (
        <Text style={styles.muted}>Завантаження...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.muted}>Поки немає відгуків.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ {item.rating || 0}</Text>
              <Text style={styles.cardText}>{item.text || "—"}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.btnSmall}
                  onPress={() => navigation.navigate("ReviewEdit", { mode: "edit", placeId: item.placeId, reviewId: item.id })}
                >
                  <Text style={styles.btnSmallText}>Редагувати</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSmallOutline}
                  onPress={() => navigation.navigate("PlaceDetails", { placeId: item.placeId })}
                >
                  <Text style={styles.btnSmallOutlineText}>Відкрити точку</Text>
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },

    title: { fontSize: 22, fontWeight: "900", color: c.text, marginBottom: 12 },

    card: {
      marginTop: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
    },
    cardTitle: { color: c.text, fontWeight: "900" },
    cardText: { color: c.text, marginTop: 6 },

    row: { flexDirection: "row", gap: 10, marginTop: 10 },
    btnSmall: { flex: 1, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    btnSmallText: { color: "#fff", fontWeight: "900" },

    btnSmallOutline: { flex: 1, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    btnSmallOutlineText: { color: c.text, fontWeight: "900" },

    btn: { marginTop: 12, backgroundColor: c.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },
  });
}
