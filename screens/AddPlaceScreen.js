import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView } from "react-native";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";

import { auth, db } from "../firebaseConfig";

const CATEGORY_OPTIONS = [
  { key: "food", label: "🍽️ Заклади харчування" },
  { key: "gov", label: "🏛️ Держ. установи" },
  { key: "medical", label: "🏥 Медицина" },
  { key: "shops", label: "🛒 Магазини" },
  { key: "education", label: "🎓 Освіта" },
  { key: "sport", label: "🏟️ Спорт" },
  { key: "parks", label: "🌳 Парки" },
];

export default function AddPlaceScreen({ navigation, route }) {
  const presetCategory = route?.params?.presetCategory;
  const initialCategory = presetCategory && presetCategory !== "all" ? presetCategory : "food";

  const [category, setCategory] = useState(initialCategory);

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

        // ✅ категорія
        category,

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
      alert(e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Додати місце</Text>

      <Text style={styles.section}>Категорія</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
          {CATEGORY_OPTIONS.map((x) => (
            <Picker.Item key={x.key} label={x.label} value={x.key} />
          ))}
        </Picker>
      </View>

      <TextInput style={styles.input} placeholder="Назва" value={title} onChangeText={setTitle} />

      <TextInput style={styles.input} placeholder="Короткий опис" value={desc} onChangeText={setDesc} />

      <TextInput
        style={[styles.input, { height: 90 }]}
        placeholder="Повний опис доступності (пандус, вхід, туалет, ліфт і т.д.)"
        value={accessInfo}
        onChangeText={setAccessInfo}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Фото (URL) — поки так"
        value={photoUrl}
        onChangeText={setPhotoUrl}
        autoCapitalize="none"
      />

      <Text style={styles.section}>Координати</Text>
      <TextInput style={styles.input} placeholder="Latitude" value={lat} onChangeText={setLat} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Longitude" value={lng} onChangeText={setLng} keyboardType="numeric" />

      <Text style={styles.section}>Норми (базові)</Text>
      <Row label="Є пандус" value={ramp} onChange={setRamp} />
      <Row label="Широкі двері (≥ 90 см)" value={wideDoor} onChange={setWideDoor} />
      <Row label="Немає сходів" value={!stairs} onChange={(v) => setStairs(!v)} />

      <Text style={styles.section}>Додатково</Text>
      <Row label="Доступний туалет" value={accessibleToilet} onChange={setAccessibleToilet} />
      <Row label="Є ліфт" value={elevator} onChange={setElevator} />

      <Text style={styles.hint}>Відповідає базовим нормам: {meetsBasicNorms ? "✅ так" : "❌ ні"}</Text>

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Зберегти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, onChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 10 },

  section: { marginTop: 10, marginBottom: 6, fontWeight: "bold" },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  picker: { height: 48 },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  rowText: { flex: 1, paddingRight: 10 },
  hint: { marginTop: 6, color: "gray" },
  btn: { marginTop: 14, backgroundColor: "#1f7a8c", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
