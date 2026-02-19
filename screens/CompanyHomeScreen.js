import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

function statusLabel(status) {
  if (status === "approved") return "✅ Підтверджено";
  if (status === "pending") return "⏳ На модерації";
  if (status === "rejected") return "❌ Відхилено";
  return status ? String(status) : "⏳ На модерації";
}

export default function CompanyHomeScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPlaces = useCallback(async () => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "places"),
        where("ownerUid", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("loadMyPlaces error:", e);
      alert(e?.message || "Помилка завантаження точок");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMyPlaces();
    } finally {
      setRefreshing(false);
    }
  }, [loadMyPlaces]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadMyPlaces);
    loadMyPlaces();
    return unsub;
  }, [navigation, loadMyPlaces]);

  const openMap = (focusPlaceId) => {
    navigation.navigate("Home", focusPlaceId ? { focusPlaceId } : undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Кабінет компанії</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate("AddPlace")}>
          <Text style={styles.btnPrimaryText}>+ Додати місце</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => openMap()}>
          <Text style={styles.btnGhostText}>На карту</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Мої точки</Text>

      {loading ? (
        <Text style={styles.gray}>Завантаження...</Text>
      ) : places.length === 0 ? (
        <Text style={styles.gray}>Поки немає точок. Натисни “Додати місце”.</Text>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || "Місце"}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
                </View>
              </View>

              {item.address ? (
                <Text style={styles.cardMeta} numberOfLines={2}>
                  📍 {item.address}
                </Text>
              ) : (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  Координати: {Number(item.latitude || 0).toFixed(4)}, {Number(item.longitude || 0).toFixed(4)}
                </Text>
              )}

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => navigation.navigate("EditPlace", { placeId: item.id })}
                >
                  <Text style={styles.smallBtnText}>Редагувати</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallBtnOutline} onPress={() => openMap(item.id)}>
                  <Text style={styles.smallBtnOutlineText}>Показати</Text>
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
    title: { fontSize: 22, fontWeight: "900", marginBottom: 10, color: c.text },
    subtitle: { marginTop: 12, fontSize: 16, fontWeight: "900", color: c.text },
    gray: { color: c.muted, marginTop: 10, fontWeight: "700" },

    actions: { flexDirection: "row", gap: 10 },

    btnPrimary: {
      flex: 1,
      backgroundColor: c.primary,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    btnPrimaryText: { color: "#fff", fontWeight: "900" },

    btnGhost: {
      paddingHorizontal: 14,
      borderRadius: 12,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    btnGhostText: { fontWeight: "900", color: c.primary },

    card: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 12,
    },

    cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    cardTitle: { flex: 1, fontSize: 16, fontWeight: "900", color: c.text },

    badge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    badgeText: { color: c.text, fontWeight: "900", fontSize: 12 },

    cardMeta: { color: c.muted, marginTop: 6, fontWeight: "700" },

    row: { flexDirection: "row", gap: 10, marginTop: 10 },

    smallBtn: { flex: 1, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    smallBtnText: { color: "#fff", fontWeight: "900" },

    smallBtnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.primary,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: "transparent",
    },
    smallBtnOutlineText: { color: c.primary, fontWeight: "900" },
  });
}
