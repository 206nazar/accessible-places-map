import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
} from "react-native";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

const CATEGORY_OPTIONS = [
  { key: "food", label: "🍽️ Заклади харчування" },
  { key: "gov", label: "🏛️ Держ. установи" },
  { key: "medical", label: "🏥 Медицина" },
  { key: "shops", label: "🛒 Магазини" },
  { key: "education", label: "🎓 Освіта" },
  { key: "services", label: "🧰 Послуги" },
  { key: "sport", label: "🏟️ Спорт" },
  { key: "parks", label: "🌳 Парки" },
  { key: "transport", label: "🚌 Транспорт" },
];

function getCategoryLabel(key) {
  return CATEGORY_OPTIONS.find((x) => x.key === key)?.label || "—";
}

export default function AddPlaceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const presetCategory = route?.params?.presetCategory;
  const initialCategory = presetCategory && presetCategory !== "all" ? presetCategory : "food";
  const [category, setCategory] = useState(initialCategory);
  const [catModal, setCatModal] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [accessInfo, setAccessInfo] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [lat, setLat] = useState("50.6199");
  const [lng, setLng] = useState("26.2516");

  const [ramp, setRamp] = useState(true);
  const [wideDoor, setWideDoor] = useState(true);
  const [stairs, setStairs] = useState(false);
  const [accessibleToilet, setAccessibleToilet] = useState(false);
  const [elevator, setElevator] = useState(false);

  const meetsBasicNorms = useMemo(() => ramp && wideDoor && !stairs, [ramp, wideDoor, stairs]);

  const getOwnerName = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return "Компанія";
      const data = snap.data();
      return data.companyName || data.displayName || data.name || "Компанія";
    } catch {
      return "Компанія";
    }
  };

  const save = async () => {
    if (!title.trim()) return alert("Введи назву місця.");
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return alert("Координати некоректні.");

    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Треба увійти як компанія, щоб додавати місця.");

    try {
      const ownerName = await getOwnerName(uid);

      await addDoc(collection(db, "places"), {
        ownerUid: uid,
        ownerName,

        category, // ✅ категорія

        title: title.trim(),
        description: desc.trim(),
        accessInfo: accessInfo.trim(),
        photoUrl: photoUrl.trim(),

        latitude,
        longitude,

        accessibility: { ramp, wideDoor, stairs, accessibleToilet, elevator },
        meetsBasicNorms,

        status: "approved",
        createdAt: serverTimestamp(),
      });

      alert("Додано ✅");
      navigation.goBack();
    } catch (e) {
      alert(e?.message || "Помилка збереження");
    }
  };

  const pickCategory = (key) => {
    setCategory(key);
    setCatModal(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Додати місце</Text>

        <Text style={styles.section}>Категорія</Text>

        {/* ✅ Замість Picker — свій селект */}
        <TouchableOpacity style={styles.select} onPress={() => setCatModal(true)} activeOpacity={0.85}>
          <Text style={styles.selectText} numberOfLines={1}>
            {getCategoryLabel(category)}
          </Text>
          <Text style={styles.chev}>▾</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Назва"
          placeholderTextColor={c.muted}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Короткий опис"
          placeholderTextColor={c.muted}
          value={desc}
          onChangeText={setDesc}
        />

        <TextInput
          style={[styles.input, { height: 90 }]}
          placeholder="Повний опис доступності (пандус, вхід, туалет, ліфт і т.д.)"
          placeholderTextColor={c.muted}
          value={accessInfo}
          onChangeText={setAccessInfo}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Фото (URL) — поки так"
          placeholderTextColor={c.muted}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          autoCapitalize="none"
        />

        <Text style={styles.section}>Координати</Text>
        <TextInput
          style={styles.input}
          placeholder="Latitude"
          placeholderTextColor={c.muted}
          value={lat}
          onChangeText={setLat}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Longitude"
          placeholderTextColor={c.muted}
          value={lng}
          onChangeText={setLng}
          keyboardType="numeric"
        />

        <Text style={styles.section}>Норми (базові)</Text>
        <Row label="Є пандус" value={ramp} onChange={setRamp} styles={styles} />
        <Row label="Широкі двері (≥ 90 см)" value={wideDoor} onChange={setWideDoor} styles={styles} />
        <Row label="Немає сходів" value={!stairs} onChange={(v) => setStairs(!v)} styles={styles} />

        <Text style={styles.section}>Додатково</Text>
        <Row label="Доступний туалет" value={accessibleToilet} onChange={setAccessibleToilet} styles={styles} />
        <Row label="Є ліфт" value={elevator} onChange={setElevator} styles={styles} />

        <Text style={styles.hint}>
          Відповідає базовим нормам: {meetsBasicNorms ? "✅ так" : "❌ ні"}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={save} activeOpacity={0.9}>
          <Text style={styles.btnText}>Зберегти</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Модалка вибору категорії */}
      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCatModal(false)} />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Категорія</Text>

            {CATEGORY_OPTIONS.map((x) => {
              const active = x.key === category;
              return (
                <TouchableOpacity
                  key={x.key}
                  style={[styles.modalItem, active && styles.modalItemActive]}
                  onPress={() => pickCategory(x.key)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.modalItemText, active && styles.modalItemTextActive]} numberOfLines={1}>
                    {x.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.modalClose} onPress={() => setCatModal(false)}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Row({ label, value, onChange, styles }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { padding: 20, paddingBottom: 40, backgroundColor: c.bg },
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: c.text },

    section: { marginTop: 10, marginBottom: 6, fontWeight: "bold", color: c.text },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      backgroundColor: c.surface,
      color: c.text,
    },

    // ✅ селект
    select: {
      height: 48,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: { color: c.text, fontWeight: "700", flex: 1, paddingRight: 10 },
    chev: { color: c.muted, fontSize: 16, fontWeight: "900" },

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    rowText: { flex: 1, paddingRight: 10, color: c.text, fontWeight: "600" },

    hint: { marginTop: 6, color: c.muted },

    btn: { marginTop: 14, backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },

    // ✅ modal
    modalOverlay: { flex: 1, justifyContent: "center", padding: 18 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },

    modalCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    modalTitle: { fontSize: 16, fontWeight: "900", color: c.text, marginBottom: 10 },

    modalItem: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    modalItemActive: { backgroundColor: c.primary, borderColor: c.primary },
    modalItemText: { color: c.text, fontWeight: "800" },
    modalItemTextActive: { color: "#fff" },

    modalClose: { marginTop: 6, paddingVertical: 12, alignItems: "center" },
    modalCloseText: { color: c.muted, fontWeight: "800" },
  });
}
