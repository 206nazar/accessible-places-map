import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { auth, db, storage } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function MyProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [role, setRole] = useState("person");
  const [email, setEmail] = useState(user?.email || "");
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "person");
          setNickname(data.nickname || "");
          setPhotoUrl(data.photoUrl || "");
        }
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Потрібно увійти</Text>
        <Text style={styles.muted}>Зайди через меню → Вхід</Text>
      </View>
    );
  }

  const saveProfile = async () => {
    try {
      const refDoc = doc(db, "users", user.uid);
      await updateDoc(refDoc, {
        nickname: nickname.trim(),
        photoUrl: photoUrl || "",
      });
      alert("Збережено ✅");
    } catch (e) {
      alert(e.message);
    }
  };

  const uploadImageToStorage = async (uri) => {
    setUploading(true);
    try {
      // 1) blob з uri
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2) шлях у Storage
      const fileRef = ref(storage, `avatars/${user.uid}.jpg`);

      // 3) upload
      await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

      // 4) url
      const url = await getDownloadURL(fileRef);
      setPhotoUrl(url);

      // 5) збережемо в Firestore одразу
      await setDoc(
        doc(db, "users", user.uid),
        { photoUrl: url },
        { merge: true }
      );

      alert("Фото оновлено ✅");
    } catch (e) {
      alert(e?.message || "Помилка завантаження фото");
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert("Дай доступ до галереї.");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    await uploadImageToStorage(uri);
  };

  const takeFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return alert("Дай доступ до камери.");

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    await uploadImageToStorage(uri);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Мій профіль</Text>

      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={styles.avatarWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarIcon}>👤</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>Тип</Text>
            <Text style={styles.value}>{role === "company" ? "Компанія" : "Особа"}</Text>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={pickFromGallery} disabled={uploading}>
            <Text style={styles.btnPrimaryText}>{uploading ? "Завантаження..." : "🖼️ Галерея"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOutline} onPress={takeFromCamera} disabled={uploading}>
            <Text style={styles.btnOutlineText}>{uploading ? "..." : "📷 Камера"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Нікнейм</Text>
        <TextInput
          style={styles.input}
          placeholder="Напр. Назар"
          placeholderTextColor={c.muted}
          value={nickname}
          onChangeText={setNickname}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={uploading}>
          <Text style={styles.saveBtnText}>Зберегти</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Фото зберігається в Firebase Storage, а посилання — в Firestore (users/{user.uid}.photoUrl)
        </Text>
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    muted: { color: c.muted, marginTop: 8 },

    h1: { color: c.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      padding: 14,
    },

    rowTop: { flexDirection: "row", gap: 12, alignItems: "center" },

    avatarWrap: {
      width: 86,
      height: 86,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: { width: "100%", height: "100%" },
    avatarPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
    avatarIcon: { fontSize: 30 },

    label: { color: c.muted, fontWeight: "800", fontSize: 12 },
    value: { color: c.text, fontWeight: "900", fontSize: 14, marginTop: 2 },

    btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    btnPrimary: {
      flex: 1,
      backgroundColor: c.primary,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    btnPrimaryText: { color: "#fff", fontWeight: "900" },

    btnOutline: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    btnOutlineText: { color: c.text, fontWeight: "900" },

    section: { marginTop: 14, color: c.text, fontWeight: "900" },

    input: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      color: c.text,
      borderRadius: 14,
      padding: 12,
      fontWeight: "800",
    },

    saveBtn: {
      marginTop: 12,
      backgroundColor: c.primary,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    saveBtnText: { color: "#fff", fontWeight: "900" },

    hint: { marginTop: 10, color: c.muted, fontSize: 12, lineHeight: 16 },

    title: { color: c.text, fontWeight: "900", fontSize: 18 },
  });
}
