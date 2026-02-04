import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

import { useTheme } from "../theme/ThemeContext";

export default function CompanyHomeScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyPlaces = async () => {
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
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadMyPlaces);
    loadMyPlaces();
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Кабінет компанії</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate("AddPlace")}>
          <Text style={styles.btnPrimaryText}>+ Додати місце</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.navigate("Home")}>
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>Статус: {item.status || "pending"}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => navigation.navigate("EditPlace", { placeId: item.id })}
                >
                  <Text style={styles.smallBtnText}>Редагувати</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtnOutline}
                  onPress={() => navigation.navigate("Home", { focusPlaceId: item.id })}
                >
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
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: c.text },
    subtitle: { marginTop: 12, fontSize: 16, fontWeight: "800", color: c.text },
    gray: { color: c.muted, marginTop: 10 },

    actions: { flexDirection: "row", gap: 10 },

    btnPrimary: { flex: 1, backgroundColor: c.primary, padding: 12, borderRadius: 12, alignItems: "center" },
    btnPrimaryText: { color: "#fff", fontWeight: "bold" },

    btnGhost: {
      paddingHorizontal: 14,
      borderRadius: 12,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    btnGhostText: { fontWeight: "800", color: c.primary },

    card: { marginTop: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: 14, padding: 12 },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: c.text },
    cardMeta: { color: c.muted, marginTop: 4 },

    row: { flexDirection: "row", gap: 10, marginTop: 10 },

    smallBtn: { flex: 1, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    smallBtnText: { color: "#fff", fontWeight: "bold" },

    smallBtnOutline: { flex: 1, borderWidth: 1, borderColor: c.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    smallBtnOutlineText: { color: c.primary, fontWeight: "bold" },
  });
}
