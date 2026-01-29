import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function PlaceDetailsScreen({ route }) {
  const { placeId } = route.params;
  const [place, setPlace] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "places", placeId));
      setPlace(snap.exists() ? snap.data() : null);
    })().catch((e) => alert(e.message));
  }, [placeId]);

  if (!place) {
    return (
      <View style={styles.center}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {place.photoUrl ? <Image source={{ uri: place.photoUrl }} style={styles.photo} /> : null}

      <Text style={styles.title}>{place.title}</Text>
      <Text style={styles.sub}>Додав: {place.ownerName || place.ownerUid || "—"}</Text>

      <Text style={styles.section}>Опис</Text>
      <Text style={styles.text}>{place.description || "—"}</Text>

      <Text style={styles.section}>Доступність</Text>
      <Text style={styles.text}>{place.accessInfo || "—"}</Text>

      <Text style={styles.section}>Відгуки</Text>
      <Text style={styles.text}>Скоро додамо відгуки ⭐</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  photo: { width: "100%", height: 220 },
  title: { fontSize: 22, fontWeight: "bold", marginTop: 12, paddingHorizontal: 14 },
  sub: { color: "gray", marginTop: 4, paddingHorizontal: 14 },

  section: { marginTop: 16, paddingHorizontal: 14, fontWeight: "800", color: "#222" },
  text: { paddingHorizontal: 14, marginTop: 6, color: "#333", lineHeight: 20, paddingBottom: 10 },
});
