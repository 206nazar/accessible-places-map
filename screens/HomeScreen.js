import { useEffect, useState } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";
import MapScreen, { fetchPlaces } from "./MapScreen";
import SideMenu from "../components/SideMenu";

export default function HomeScreen({ navigation, user }) {
  const [role, setRole] = useState(null);
  const [places, setPlaces] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadRole = async () => {
    if (!user) return setRole(null);
    const snap = await getDoc(doc(db, "users", user.uid));
    setRole(snap.exists() ? snap.data().role : null);
  };

  const loadPlaces = async () => {
    const data = await fetchPlaces();
    setPlaces(data);
  };

  useEffect(() => { loadRole().catch(() => {}); }, [user]);
  useEffect(() => { loadPlaces().catch((e) => alert(e.message)); }, []);

  const canAdd = !!user && role === "company";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topPadding} />

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} user={user} role={role} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.burgerBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.appTitle}>Accessible Places</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.actionsRow}>
        {canAdd ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("AddPlace")}>
            <Text style={styles.addBtnText}>+ Додати місце</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Перегляд без входу ✅</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <MapScreen navigation={navigation} places={places} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Accessible Places Map</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topPadding: { height: Platform.OS === "android" ? StatusBar.currentHeight : 0 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  burgerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center" },
  burgerText: { fontSize: 18, fontWeight: "900" },
  appTitle: { fontSize: 18, fontWeight: "bold" },

  actionsRow: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, backgroundColor: "#fff" },
  addBtn: { backgroundColor: "#1f7a8c", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "bold" },

  badge: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee" },
  badgeText: { color: "gray", fontWeight: "600", textAlign: "center" },

  footer: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
  footerText: { textAlign: "center", color: "gray", fontSize: 12 },
});
