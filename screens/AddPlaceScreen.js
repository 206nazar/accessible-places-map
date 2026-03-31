import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as Location from "expo-location";

import { auth, db, storage } from "../firebaseConfig";
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

async function uriToBlob(uri) {
  const res = await fetch(uri);
  return await res.blob();
}

async function uploadPlacePhotoAsync({ uid, placeTempId, index, uri }) {
  const path = `places/${uid}/${placeTempId}_${index}.jpg`;
  const storageRef = ref(storage, path);

  const blob = await uriToBlob(uri);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  if (blob && typeof blob.close === "function") blob.close();

  return await getDownloadURL(storageRef);
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

  // ✅ ЛОКАЦІЯ
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("50.6199");
  const [lng, setLng] = useState("26.2516");

  // ✅ ФОТО
  const [photoUris, setPhotoUris] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [ramp, setRamp] = useState(true);
  const [wideDoor, setWideDoor] = useState(true);
  const [stairs, setStairs] = useState(false);
  const [accessibleToilet, setAccessibleToilet] = useState(false);
  const [elevator, setElevator] = useState(false);

  const meetsBasicNorms = useMemo(() => ramp && wideDoor && !stairs, [ramp, wideDoor, stairs]);

  // ✅ ПІДХОПЛЮЄМО КООРДИНАТИ З PickLocation (через params у попередньому екрані)
  useEffect(() => {
    const picked = route?.params?.pickedLocation;
    const stamp = route?.params?._pickedAt;

    if (!picked) return;

    setLat(String(picked.latitude));
    setLng(String(picked.longitude));

    // ✅ очищаємо params, щоб не “липло”
    navigation.setParams({ pickedLocation: null, _pickedAt: null });
  }, [route?.params?.pickedLocation, route?.params?._pickedAt, navigation]);

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

  // ---------- ФОТО helpers ----------
  const addUris = (uris) => {
    setPhotoUris((prev) => {
      const set = new Set(prev);
      for (const u of uris) set.add(u);
      return Array.from(set).slice(0, 8);
    });
  };

  const removeUri = (uri) => setPhotoUris((prev) => prev.filter((x) => x !== uri));

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return alert("Дай доступ до галереї.");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 8,
      });

      if (result.canceled) return;

      const uris = (result.assets || []).map((a) => a?.uri).filter(Boolean);
      if (!uris.length) return alert("Не вдалося отримати фото.");

      addUris(uris);
    } catch (e) {
      console.log("pick gallery error:", e);
      alert(e?.message || String(e));
    }
  };

  const takeFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return alert("Дай доступ до камери.");

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return alert("Не вдалося отримати фото.");

      addUris([uri]);
    } catch (e) {
      console.log("camera error:", e);
      alert(e?.message || String(e));
    }
  };

  // ---------- ЛОКАЦІЯ helpers ----------
  const geocodeByAddress = async () => {
    if (!address.trim()) return alert("Введи адресу.");

    try {
      await Location.requestForegroundPermissionsAsync();

      const res = await Location.geocodeAsync(address.trim());
      if (!res || res.length === 0) return alert("Не знайшов адресу. Спробуй точніше.");

      setLat(String(res[0].latitude));
      setLng(String(res[0].longitude));
      alert("Знайдено ✅ Координати підставлено.");
    } catch (e) {
      console.log("geocode error:", e);
      alert(e?.message || "Помилка пошуку адреси");
    }
  };

  const openPickOnMap = () => {
    navigation.navigate("PickLocation", {
      initial: {
        latitude: Number(lat) || 50.6199,
        longitude: Number(lng) || 26.2516,
      },
      onPick: (picked) => {
        setLat(String(picked.latitude));
        setLng(String(picked.longitude));
      },
    });
  };

  // ---------- SAVE ----------
  const save = async () => {
    if (!title.trim()) return alert("Введи назву місця.");

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return alert("Координати некоректні.");

    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Треба увійти як компанія, щоб додавати місця.");

    setUploading(true);
    try {
      const ownerName = await getOwnerName(uid);

      const placeTempId = `p_${Date.now()}`;
      const photoUrls = [];
      for (let i = 0; i < photoUris.length; i++) {
        const url = await uploadPlacePhotoAsync({
          uid,
          placeTempId,
          index: i + 1,
          uri: photoUris[i],
        });
        photoUrls.push(url);
      }

      const photoUrl = photoUrls[0] || "";

      await addDoc(collection(db, "places"), {
        ownerUid: uid,
        ownerName,

        category,

        title: title.trim(),
        description: desc.trim(),
        accessInfo: accessInfo.trim(),

        address: address.trim(),

        photoUrls,
        photoUrl,

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
      console.log("save place error:", e);
      alert(e?.message || "Помилка збереження");
    } finally {
      setUploading(false);
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

        <Text style={styles.section}>Локація</Text>

        <TextInput
          style={styles.input}
          placeholder="Адреса (наприклад: Рівне, Соборна 12)"
          placeholderTextColor={c.muted}
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.locRow}>
          <TouchableOpacity style={styles.locBtnPrimary} onPress={geocodeByAddress} activeOpacity={0.9}>
            <Text style={styles.locBtnPrimaryText}>🔎 Знайти по адресі</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.locBtnOutline} onPress={openPickOnMap} activeOpacity={0.9}>
            <Text style={styles.locBtnOutlineText}>🗺️ Вибрати на карті</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hintSmall}>
          Координати: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
        </Text>

        <Text style={styles.section}>Фото (до 8)</Text>

        {photoUris.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={styles.thumbRow}>
              {photoUris.map((uri) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => removeUri(uri)} activeOpacity={0.9}>
                    <Text style={styles.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.hintSmall}>Можна додати кілька фото (галерея) або по одному (камера).</Text>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={pickFromGallery} activeOpacity={0.9}>
            <Text style={styles.btnPrimaryText}>🖼️ Галерея</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOutline} onPress={takeFromCamera} activeOpacity={0.9}>
            <Text style={styles.btnOutlineText}>📷 Камера</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Норми (базові)</Text>
        <Row label="Є пандус" value={ramp} onChange={setRamp} styles={styles} />
        <Row label="Широкі двері (≥ 90 см)" value={wideDoor} onChange={setWideDoor} styles={styles} />
        <Row label="Немає сходів" value={!stairs} onChange={(v) => setStairs(!v)} styles={styles} />

        <Text style={styles.section}>Додатково</Text>
        <Row label="Доступний туалет" value={accessibleToilet} onChange={setAccessibleToilet} styles={styles} />
        <Row label="Є ліфт" value={elevator} onChange={setElevator} styles={styles} />

        <Text style={styles.hint}>Відповідає базовим нормам: {meetsBasicNorms ? "✅ так" : "❌ ні"}</Text>

        <TouchableOpacity style={styles.btnSave} onPress={save} activeOpacity={0.9} disabled={uploading}>
          {uploading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={styles.btnSaveText}>Завантажую...</Text>
            </View>
          ) : (
            <Text style={styles.btnSaveText}>Зберегти</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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

    locRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
    locBtnPrimary: { flex: 1, backgroundColor: c.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
    locBtnPrimaryText: { color: "#fff", fontWeight: "900" },
    locBtnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    locBtnOutlineText: { color: c.text, fontWeight: "900" },

    hintSmall: { color: c.muted, marginBottom: 10, fontWeight: "700" },

    thumbRow: { flexDirection: "row", gap: 10, paddingRight: 12 },
    thumbWrap: {
      width: 96,
      height: 72,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    thumb: { width: "100%", height: "100%" },
    thumbRemove: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbRemoveText: { color: "#fff", fontWeight: "900" },

    btnRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
    btnPrimary: { flex: 1, backgroundColor: c.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
    btnPrimaryText: { color: "#fff", fontWeight: "900" },
    btnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    btnOutlineText: { color: c.text, fontWeight: "900" },

    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
    rowText: { flex: 1, paddingRight: 10, color: c.text, fontWeight: "600" },

    hint: { marginTop: 6, color: c.muted },

    btnSave: { marginTop: 14, backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnSaveText: { color: "#fff", fontWeight: "bold" },

    modalOverlay: { flex: 1, justifyContent: "center", padding: 18 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    modalCard: { backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14 },
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