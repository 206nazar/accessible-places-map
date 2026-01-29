import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

import { db } from "../firebaseConfig";

export default function CompanyHomeScreen({ navigation, user }) {
  const [myPlaces, setMyPlaces] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPlaces = async () => {
    if (!user) {
      setMyPlaces([]);
      return;
    }

    // Якщо orderBy(createdAt) буде падати через відсутність createdAt у старих точках,
    // можна прибрати orderBy. Але в нових ти createdAt додаєш.
    const q = query(
      collection(db, "places"),
      where("ownerUid", "==", user.uid)
    );

    const snap = await getDocs(q);
    setMyPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadMyPlaces().catch((e) => alert(e.message));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMyPlaces();
    } finally {
      setRefreshing(false);
    }
  };

  const fmtDate = (ts) => {
    try {
      if (!ts?.toDate) return "";
      const d = ts.toDate();
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    } catch {
      return "";
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Кабінет компанії</Text>
        <Text style={styles.text}>Увійдіть як компанія, щоб бачити свої місця.</Text>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Account")}>
          <Text style={styles.btnText}>Перейти до акаунту</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSmall} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.btnSmallText}>На карту</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Мої місця</Text>

        <TouchableOpacity style={styles.btnSmall} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.btnSmallText}>На карту</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("AddPlace")}>
        <Text style={styles.btnText}>+ Додати нове місце</Text>
      </TouchableOpacity>

      <FlatList
        data={myPlaces}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("PlaceDetails", { placeId: item.id })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title || "Без назви"}</Text>
              <View style={[styles.statusPill, item.status === "approved" ? styles.ok : styles.pending]}>
                <Text style={styles.statusText}>{item.status || "—"}</Text>
              </View>
            </View>

            <Text style={styles.cardSub} numberOfLines={2}>
              {item.description || item.accessInfo || "Без опису"}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Дата: {fmtDate(item.createdAt) || "—"}</Text>
              <Text style={styles.metaText}>
                Норми: {item.meetsBasicNorms ? "✅" : "❌"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.text}>
            Поки немає місць. Натисни “Додати нове місце” 🙂
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },

  title: { fontSize: 20, fontWeight: "bold" },
  text: { color: "gray", marginTop: 10, lineHeight: 20 },

  btn: { marginVertical: 10, backgroundColor: "#1f7a8c", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },

  btnSmall: { backgroundColor: "#f2f2f2", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, alignItems: "center" },
  btnSmallText: { fontWeight: "bold" },

  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 14, padding: 12, backgroundColor: "#fafafa" },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontWeight: "bold", flex: 1 },

  cardSub: { color: "gray", marginTop: 6 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  metaText: { color: "gray", fontSize: 12 },

  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  ok: { backgroundColor: "#e9fff0", borderColor: "#b7f0c7" },
  pending: { backgroundColor: "#fff7e6", borderColor: "#ffe0a3" },
  statusText: { fontWeight: "800", fontSize: 12 },
});