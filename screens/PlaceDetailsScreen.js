import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function PlaceDetailsScreen({ route, navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const { placeId } = route.params;
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);

  const load = async () => {
    const snap = await getDoc(doc(db, "places", placeId));
    const placeData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    setPlace(placeData);

    const rq = query(collection(db, "reviews"), where("placeId", "==", placeId));
    const rs = await getDocs(rq);
    const items = rs.docs.map((d) => ({ id: d.id, ...d.data() }));

    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    setReviews(items);
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, [placeId]);

  if (!place) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {place.photoUrl ? <Image source={{ uri: place.photoUrl }} style={styles.photo} /> : null}

      <Text style={styles.title}>{place.title}</Text>
      <Text style={styles.sub}>Додав: {place.ownerName || place.ownerUid || "—"}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            if (!user) return navigation.navigate("Login");
            navigation.navigate("ReviewEdit", { mode: "add", placeId });
          }}
        >
          <Text style={styles.btnText}>Залишити відгук</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Опис</Text>
      <Text style={styles.text}>{place.description || "—"}</Text>

      <Text style={styles.section}>Доступність</Text>
      <Text style={styles.text}>{place.accessInfo || "—"}</Text>

      <Text style={styles.section}>Відгуки</Text>
      {reviews.length === 0 ? (
        <Text style={styles.muted}>Поки немає відгуків.</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>
              ⭐ {r.rating || 0} — {r.authorName || r.authorEmail || "Користувач"}
            </Text>
            <Text style={styles.reviewText}>{r.text || "—"}</Text>

            {r.reply?.text ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyTitle}>Відповідь компанії:</Text>
                <Text style={styles.replyText}>{r.reply.text}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    muted: { color: c.muted },

    photo: { width: "100%", height: 220 },
    title: { fontSize: 22, fontWeight: "bold", marginTop: 12, paddingHorizontal: 14, color: c.text },
    sub: { color: c.muted, marginTop: 4, paddingHorizontal: 14 },

    actionsRow: { paddingHorizontal: 14, marginTop: 12 },
    btn: { backgroundColor: c.primary, padding: 12, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },

    section: { marginTop: 16, paddingHorizontal: 14, fontWeight: "800", color: c.text },
    text: { paddingHorizontal: 14, marginTop: 6, color: c.text, lineHeight: 20 },

    reviewCard: {
      marginTop: 10,
      marginHorizontal: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 12,
    },
    reviewTitle: { color: c.text, fontWeight: "800" },
    reviewText: { color: c.text, marginTop: 6 },

    replyBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    replyTitle: { color: c.muted, fontWeight: "800" },
    replyText: { color: c.text, marginTop: 6 },
  });
}
