import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "../theme/ThemeContext";

async function uriToBlob(uri) {
  const res = await fetch(uri);
  return await res.blob();
}

async function uploadImagesAsync({ folderPath, uris }) {
  const out = [];
  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    const blob = await uriToBlob(uri);

    const fileRef = ref(storage, `${folderPath}/${Date.now()}_${i}.jpg`);
    await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

    if (blob && typeof blob.close === "function") blob.close();

    const url = await getDownloadURL(fileRef);
    out.push(url);
  }
  return out;
}

function Stars({ value, onChange, c }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, paddingVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.8}>
            <Text style={{ fontSize: 30, color: active ? "#f5c518" : c.muted, fontWeight: "900" }}>
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ReviewEditScreen({ route, navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const mode = route?.params?.mode || "add"; // add | edit
  const placeId = route?.params?.placeId;
  const reviewId = route?.params?.reviewId;

  const me = user || auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const [images, setImages] = useState([]); // saved urls
  const [newUris, setNewUris] = useState([]); // local uris
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!me) {
        navigation.replace("Login");
        return;
      }
      if (!placeId) {
        alert("Помилка: немає placeId");
        navigation.goBack();
        return;
      }

      if (mode === "edit" && reviewId) {
        const snap = await getDoc(doc(db, "reviews", reviewId));
        if (!snap.exists()) {
          alert("Відгук не знайдено");
          navigation.goBack();
          return;
        }
        const d = snap.data();

        if (d.authorUid && d.authorUid !== me.uid) {
          alert("Це не ваш відгук");
          navigation.goBack();
          return;
        }

        setRating(Number(d.rating || 0) || 0);
        setText(d.text || "");
        setImages(Array.isArray(d.images) ? d.images : []);
      }

      setLoading(false);
    })().catch((e) => {
      alert(e?.message || "Помилка");
      setLoading(false);
    });
  }, [mode, reviewId, placeId]);

  const addUris = (uris) => {
    if (!uris?.length) return;
    setNewUris((p) => [...p, ...uris].slice(0, 6));
  };

  const pickImagesFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert("Дай доступ до галереї.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });

    if (result.canceled) return;
    const uris = (result.assets || []).map((a) => a.uri).filter(Boolean);
    addUris(uris);
  };

  const takePhotoFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return alert("Дай доступ до камери.");

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    addUris([uri]);
  };

  const removeNewUri = (uri) => setNewUris((p) => p.filter((x) => x !== uri));
  const removeSavedUrl = (url) => setImages((p) => p.filter((x) => x !== url));

  const save = async () => {
    if (!me) return;
    if (!placeId) return;

    if (!text.trim()) return alert("Напиши текст відгуку");
    if (rating < 1 || rating > 5) return alert("Рейтинг має бути 1..5");

    try {
      setSaving(true);

      let uploaded = [];
      if (newUris.length > 0) {
        const folder = `reviews/${placeId}/${me.uid}`;
        uploaded = await uploadImagesAsync({ folderPath: folder, uris: newUris });
      }

      const finalImages = [...images, ...uploaded].slice(0, 6);

      if (mode === "edit" && reviewId) {
        await updateDoc(doc(db, "reviews", reviewId), {
          rating,
          text: text.trim(),
          images: finalImages,
          updatedAt: serverTimestamp(),
        });
        alert("Оновлено ✅");
      } else {
        await addDoc(collection(db, "reviews"), {
          placeId,
          rating,
          text: text.trim(),

          authorUid: me.uid,
          authorEmail: me.email || "",
          authorName: "",

          images: finalImages,
          createdAt: serverTimestamp(),
        });
        alert("Додано ✅");
      }

      navigation.goBack();
    } catch (e) {
      alert(e?.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>{mode === "edit" ? "Редагувати відгук" : "Новий відгук"}</Text>

      <Text style={styles.label}>Оцінка</Text>
      <Stars value={rating} onChange={setRating} c={c} />
      <Text style={styles.smallMuted}>Натисни на зірочку (1..5)</Text>

      <Text style={[styles.label, { marginTop: 12 }]}>Текст</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={text}
        onChangeText={setText}
        placeholder="Напишіть ваш відгук..."
        placeholderTextColor={c.muted}
        multiline
      />

      <Text style={[styles.label, { marginTop: 12 }]}>Фото (до 6)</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={pickImagesFromGallery} activeOpacity={0.9}>
          <Text style={styles.btnOutlineText}>🖼️ Галерея</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={takePhotoFromCamera} activeOpacity={0.9}>
          <Text style={styles.btnOutlineText}>📷 Камера</Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 ? (
        <>
          <Text style={styles.smallMuted}>Збережені:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {images.map((url) => (
              <View key={url} style={styles.thumbWrap}>
                <Image source={{ uri: url }} style={styles.thumb} />
                <TouchableOpacity style={styles.thumbX} onPress={() => removeSavedUrl(url)}>
                  <Text style={styles.thumbXText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {newUris.length > 0 ? (
        <>
          <Text style={[styles.smallMuted, { marginTop: 10 }]}>Нові (ще не завантажені):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {newUris.map((uri) => (
              <View key={uri} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.thumbX} onPress={() => removeNewUri(uri)}>
                  <Text style={styles.thumbXText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      <TouchableOpacity style={styles.btn} onPress={save} disabled={saving} activeOpacity={0.9}>
        <Text style={styles.btnText}>{saving ? "Збереження..." : "Зберегти"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },

    title: { fontSize: 22, fontWeight: "900", color: c.text, marginBottom: 12 },
    label: { color: c.muted, fontWeight: "900", marginBottom: 6 },
    smallMuted: { color: c.muted, fontWeight: "800", marginTop: 6 },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 14,
      padding: 12,
    },
    textArea: { height: 130, textAlignVertical: "top" },

    btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },

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

    btn: { marginTop: 14, backgroundColor: c.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },

    thumbWrap: { width: 84, height: 84, borderRadius: 14, overflow: "hidden", marginRight: 10, position: "relative" },
    thumb: { width: "100%", height: "100%" },
    thumbX: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    thumbXText: { color: "#fff", fontWeight: "900" },
  });
}
