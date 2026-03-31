import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as Location from "expo-location";

import { db, auth, storage } from "../firebaseConfig";
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

async function uploadPlacePhotoAsync({ uid, placeId, index, uri }) {
  const path = `places/${uid}/${placeId}_${Date.now()}_${index}.jpg`;
  const storageRef = ref(storage, path);

  const blob = await uriToBlob(uri);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  if (blob && typeof blob.close === "function") blob.close();

  return await getDownloadURL(storageRef);
}

export default function EditPlaceScreen({ route, navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const placeId = route?.params?.placeId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState("food");
  const [catModal, setCatModal] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [accessInfo, setAccessInfo] = useState("");

  // ✅ локація
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("50.6199");
  const [lng, setLng] = useState("26.2516");

  const [photoUrls, setPhotoUrls] = useState([]);
  const [photoUris, setPhotoUris] = useState([]);

  const [ramp, setRamp] = useState(true);
  const [wideDoor, setWideDoor] = useState(true);
  const [stairs, setStairs] = useState(false);
  const [accessibleToilet, setAccessibleToilet] = useState(false);
  const [elevator, setElevator] = useState(false);

  const meetsBasicNorms = useMemo(() => ramp && wideDoor && !stairs, [ramp, wideDoor, stairs]);

  // ✅ прийом з PickLocation
  useEffect(() => {
    const picked = route?.params?.pickedLocation;
    if (!picked) return;

    setLat(String(picked.latitude));
    setLng(String(picked.longitude));

    navigation.setParams({ pickedLocation: null });
  }, [route?.params?.pickedLocation, navigation]);

  useEffect(() => {
    if (!placeId) {
      alert("Помилка: не передано placeId");
      navigation.goBack();
      return;
    }

    const loadPlace = async () => {
      try {
        const snap = await getDoc(doc(db, "places", placeId));
        if (!snap.exists()) {
          alert("Точку не знайдено");
          navigation.goBack();
          return;
        }

        const data = snap.data();

        setCategory(data.category || "food");
        setTitle(data.title || "");
        setDesc(data.description || "");
        setAccessInfo(data.accessInfo || "");

        setAddress(data.address || "");
        setLat(String(data.latitude ?? "50.6199"));
        setLng(String(data.longitude ?? "26.2516"));

        const acc = data.accessibility || {};
        setRamp(!!acc.ramp);
        setWideDoor(!!acc.wideDoor);
        setStairs(!!acc.stairs);
        setAccessibleToilet(!!acc.accessibleToilet);
        setElevator(!!acc.elevator);

        const urls =
          Array.isArray(data.photoUrls) && data.photoUrls.length
            ? data.photoUrls
            : data.photoUrl
            ? [data.photoUrl]
            : [];

        setPhotoUrls(urls);
      } catch (e) {
        alert(e?.message || "Помилка завантаження");
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [placeId, navigation]);

  const addLocalUris = (uris) => {
    setPhotoUris((prev) => {
      const set = new Set(prev);
      for (const u of uris) set.add(u);
      return Array.from(set).slice(0, 8);
    });
  };

  const removeLocalUri = (uri) => setPhotoUris((prev) => prev.filter((x) => x !== uri));
  const removeUrl = (url) => setPhotoUrls((prev) => prev.filter((x) => x !== url));

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

      addLocalUris(uris);
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

      addLocalUris([uri]);
    } catch (e) {
      console.log("camera error:", e);
      alert(e?.message || String(e));
    }
  };

  // ✅ локація: знайти по адресі
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

  const save = async () => {
    if (!title.trim()) return alert("Назва обовʼязкова");

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return alert("Координати некоректні.");

    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Треба увійти, щоб редагувати.");

    setSaving(true);
    try {
      const uploaded = [];
      for (let i = 0; i < photoUris.length; i++) {
        const url = await uploadPlacePhotoAsync({
          uid,
          placeId,
          index: i + 1,
          uri: photoUris[i],
        });
        uploaded.push(url);
      }

      const nextPhotoUrls = [...photoUrls, ...uploaded].slice(0, 8);
      const photoUrlCompat = nextPhotoUrls[0] || "";

      await updateDoc(doc(db, "places", placeId), {
        category,

        title: title.trim(),
        description: desc.trim(),
        accessInfo: accessInfo.trim(),

        address: address.trim(),
        latitude,
        longitude,

        photoUrls: nextPhotoUrls,
        photoUrl: photoUrlCompat,

        accessibility: { ramp, wideDoor, stairs, accessibleToilet, elevator },
        meetsBasicNorms,

        updatedAt: serverTimestamp(),
      });

      alert("Зміни збережено ✅");
      navigation.goBack();
    } catch (e) {
      console.log("save place error:", e);
      alert(e?.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const pickCategory = (key) => {
    setCategory(key);
    setCatModal(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Редагувати місце</Text>

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
          style={[styles.input, styles.textArea]}
          placeholder="Повний опис доступності (пандус, вхід, туалет, ліфт і т.д.)"
          placeholderTextColor={c.muted}
          value={accessInfo}
          onChangeText={setAccessInfo}
          multiline
        />

        {/* ✅ ЛОКАЦІЯ */}
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

        {photoUrls.length || photoUris.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={styles.thumbRow}>
              {photoUrls.map((url) => (
                <View key={url} style={styles.thumbWrap}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => removeUrl(url)} activeOpacity={0.9}>
                    <Text style={styles.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {photoUris.map((uri) => (
                <View key={uri} style={[styles.thumbWrap, { opacity: 0.85 }]}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>NEW</Text>
                  </View>
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => removeLocalUri(uri)} activeOpacity={0.9}>
                    <Text style={styles.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.hintSmall}>Додай фото з галереї або камери.</Text>
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

        <TouchableOpacity style={styles.btnSave} onPress={save} activeOpacity={0.9} disabled={saving}>
          {saving ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={styles.btnSaveText}>Зберігаю...</Text>
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },

    title: { fontSize: 22, fontWeight: "900", marginBottom: 12, color: c.text },

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
    textArea: { height: 110, textAlignVertical: "top" },

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

    // ✅ location row
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

    hint: { marginTop: 6, color: c.muted },

    // thumbs
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
    localBadge: {
      position: "absolute",
      left: 6,
      top: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    localBadgeText: { color: "#fff", fontWeight: "900", fontSize: 10 },

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

    btnSave: { marginTop: 14, backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnSaveText: { color: "#fff", fontWeight: "bold" },

    // modal
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
