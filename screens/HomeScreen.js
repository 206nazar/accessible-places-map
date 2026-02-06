import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";
import MapScreen, { fetchPlaces } from "./MapScreen";
import SideMenu from "../components/SideMenu";
import { useTheme } from "../theme/ThemeContext";

const CATEGORIES = [
  { key: "all", label: "📍 Усі" },
  { key: "food", label: "🍽️ Харчування" },
  { key: "gov", label: "🏛️ Держ. установи" },
  { key: "medical", label: "🏥 Медицина" },
  { key: "education", label: "🎓 Освіта" },
  { key: "shops", label: "🛒 Магазини" },
  { key: "services", label: "🧰 Послуги" },
  { key: "sport", label: "🏟️ Спорт" },
  { key: "parks", label: "🌳 Парки" },
  { key: "transport", label: "🚌 Транспорт" },
];

export default function HomeScreen({ navigation, user, route }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [role, setRole] = useState(null);
  const [places, setPlaces] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");
  const [catsOpen, setCatsOpen] = useState(false);

  // ✅ маршрут на карті
  const [routeToPlaceId, setRouteToPlaceId] = useState(null);
  const [routeMode, setRouteMode] = useState("WALKING"); // WALKING | DRIVING

  const loadRole = async () => {
    if (!user) return setRole(null);
    const snap = await getDoc(doc(db, "users", user.uid));
    setRole(snap.exists() ? snap.data().role : null);
  };

  const loadPlaces = async () => {
    const data = await fetchPlaces();
    setPlaces(data);
  };

  useEffect(() => {
    loadRole().catch(() => {});
  }, [user]);

  useEffect(() => {
    loadPlaces().catch((e) => alert(e.message));
  }, []);

  // ✅ приймаємо параметри маршруту з PlaceDetails
  useEffect(() => {
    const pid = route?.params?.routeToPlaceId;
    const mode = route?.params?.routeMode;

    if (pid) setRouteToPlaceId(pid);
    if (mode) setRouteMode(mode);

    // щоб не застосовувалось повторно при кожному ререндері
    if (pid || mode) {
      navigation.setParams({ routeToPlaceId: undefined, routeMode: undefined });
    }
  }, [route?.params?.routeToPlaceId, route?.params?.routeMode]);

  const canAdd = !!user && role === "company";

  const filteredPlaces = useMemo(() => {
    if (activeCategory === "all") return places;
    return places.filter((p) => p.category === activeCategory);
  }, [places, activeCategory]);

  const activeLabel = useMemo(() => {
    return CATEGORIES.find((x) => x.key === activeCategory)?.label || "📍 Усі";
  }, [activeCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topPadding} />

      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={navigation}
        user={user}
        role={role}
      />

      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Accessible Places</Text>

        <TouchableOpacity style={styles.burgerBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.activeCat} onPress={() => setCatsOpen(true)} activeOpacity={0.9}>
          <Text style={styles.activeCatText} numberOfLines={1}>
            {activeLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.catBtn} onPress={() => setCatsOpen(true)} activeOpacity={0.9}>
          <Text style={styles.catBtnText}>Категорії ▾</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ якщо є маршрут — покажемо зверху кнопку скинути */}
      {routeToPlaceId ? (
        <View style={styles.routeRow}>
          <Text style={styles.routeText}>🧭 Маршрут увімкнено ({routeMode === "DRIVING" ? "машина" : "пішки"})</Text>

          <TouchableOpacity
            style={styles.routeClearBtn}
            onPress={() => setRouteToPlaceId(null)}
            activeOpacity={0.9}
          >
            <Text style={styles.routeClearText}>Скинути</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {canAdd ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddPlace", { presetCategory: activeCategory })}
          >
            <Text style={styles.addBtnText}>+ Додати місце</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <MapScreen
          navigation={navigation}
          places={filteredPlaces}
          routeToPlaceId={routeToPlaceId}
          routeMode={routeMode}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Accessible Places Map</Text>
      </View>

      <Modal visible={catsOpen} transparent animationType="fade" onRequestClose={() => setCatsOpen(false)}>
        <View style={styles.catOverlay}>
          <TouchableOpacity style={styles.catBackdrop} activeOpacity={1} onPress={() => setCatsOpen(false)} />

          <View style={styles.catSheet}>
            <Text style={styles.catTitle}>Категорії</Text>

            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => {
                const active = cat.key === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => {
                      setActiveCategory(cat.key);
                      setCatsOpen(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]} numberOfLines={1}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.catClose} onPress={() => setCatsOpen(false)}>
              <Text style={styles.catCloseText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    topPadding: { height: Platform.OS === "android" ? StatusBar.currentHeight : 0 },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    appTitle: { fontSize: 18, fontWeight: "900", color: c.text },

    burgerBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    burgerText: { fontSize: 18, fontWeight: "900", color: c.text },

    filterRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    activeCat: {
      flex: 1,
      height: 44,
      borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    activeCatText: { color: c.text, fontWeight: "900" },

    catBtn: {
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
    },
    catBtnText: { color: c.text, fontWeight: "900" },

    // ✅ плашка маршруту
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 10,
    },
    routeText: { flex: 1, color: c.text, fontWeight: "800" },
    routeClearBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    routeClearText: { color: c.text, fontWeight: "900" },

    actionsRow: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    addBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: "center",
    },
    addBtnText: { color: "#fff", fontWeight: "900" },

    footer: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    footerText: { textAlign: "center", color: c.muted, fontSize: 12 },

    // modal categories
    catOverlay: { flex: 1, justifyContent: "center", paddingHorizontal: 18 },
    catBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },

    catSheet: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    catTitle: { color: c.text, fontWeight: "900", fontSize: 18, marginBottom: 12 },

    catGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    catChip: {
      width: "48%",
      height: 44,
      borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    catChipActive: { backgroundColor: c.primary, borderColor: c.primary },

    catChipText: { color: c.text, fontWeight: "900" },
    catChipTextActive: { color: "#fff" },

    catClose: { marginTop: 12, paddingVertical: 10, alignItems: "center" },
    catCloseText: { color: c.muted, fontWeight: "800" },
  });
}
