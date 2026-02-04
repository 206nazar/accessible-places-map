import { useEffect, useMemo, useState } from "react";
import {
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

export default function HomeScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [role, setRole] = useState(null);
  const [places, setPlaces] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");
  const [catsOpen, setCatsOpen] = useState(false); // ✅ Варіант A

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

  const canAdd = !!user && role === "company";

  const activeLabel = useMemo(() => {
    const found = CATEGORIES.find((x) => x.key === activeCategory);
    return found ? found.label : "📍 Усі";
  }, [activeCategory]);

  // ✅ Фільтр по категорії
  const filteredPlaces = useMemo(() => {
    if (activeCategory === "all") return places;
    return places.filter((p) => p.category === activeCategory);
  }, [places, activeCategory]);

  const pickCategory = (key) => {
    setActiveCategory(key);
    setCatsOpen(false); // ✅ після вибору згортаємо
  };

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
        <View style={{ width: 40 }} />
        <Text style={styles.appTitle}>Accessible Places</Text>

        <TouchableOpacity style={styles.burgerBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Панель категорій: згорнуто/розгорнуто */}
      <View style={styles.catsHeader}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText} numberOfLines={1}>
            {activeLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.catsToggleBtn, catsOpen && styles.catsToggleBtnActive]}
          onPress={() => setCatsOpen((v) => !v)}
          activeOpacity={0.85}
        >
          <Text style={[styles.catsToggleText, catsOpen && styles.catsToggleTextActive]}>
            Категорії {catsOpen ? "▴" : "▾"}
          </Text>
        </TouchableOpacity>
      </View>

      {catsOpen ? (
        <View style={styles.catsWrap}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => pickCategory(cat.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.catText, active && styles.catTextActive]} numberOfLines={1}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

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
        <MapScreen navigation={navigation} places={filteredPlaces} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Accessible Places Map</Text>
      </View>
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
    burgerBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    burgerText: { fontSize: 18, fontWeight: "900", color: c.text },
    appTitle: { fontSize: 18, fontWeight: "bold", color: c.text },

    // ✅ Заголовок категорій (компактний)
    catsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 8,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    activePill: {
      flex: 1,
      height: 38,
      borderRadius: 999,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    activePillText: { color: c.text, fontWeight: "800", fontSize: 13 },

    catsToggleBtn: {
      height: 38,
      borderRadius: 999,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    catsToggleBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    catsToggleText: { color: c.text, fontWeight: "800", fontSize: 13 },
    catsToggleTextActive: { color: "#fff" },

    // ✅ Блок категорій (показується тільки коли catsOpen=true)
    catsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 8,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    catChip: {
      width: "31.5%",
      height: 38,
      borderRadius: 999,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    catChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    catText: { color: c.text, fontWeight: "800", fontSize: 13 },
    catTextActive: { color: "#fff" },

    actionsRow: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 6,
      backgroundColor: c.surface,
    },

    addBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
    },
    addBtnText: { color: "#fff", fontWeight: "bold" },

    badge: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    badgeText: { color: c.muted, fontWeight: "600", textAlign: "center" },

    footer: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    footerText: { textAlign: "center", color: c.muted, fontSize: 12 },
  });
}
