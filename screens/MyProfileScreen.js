import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "../theme/ThemeContext";
import { useUser } from "../context/UserContext";

async function uriToBlob(uri) {
  const res = await fetch(uri);
  const blob = await res.blob();
  return blob;
}

async function uploadProfilePhotoAsync({ uid, uri }) {
  const path = `users/${uid}/avatar.jpg`;
  const storageRef = ref(storage, path);

  const blob = await uriToBlob(uri);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  if (blob && typeof blob.close === "function") blob.close();

  const url = await getDownloadURL(storageRef);
  return url;
}

export default function MyProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const { setUserName } = useUser();

  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");

  const loadProfile = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : null;

    setProfile(data);
    setNickname(data?.nickname || "");

    setUserName(data?.nickname || data?.companyName || "");

    setLoading(false);
  };

  useEffect(() => {
    loadProfile().catch((e) => {
      alert(e?.message || "Помилка завантаження профілю");
      setLoading(false);
    });
  }, []);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Треба увійти, щоб бачити профіль.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alert("Дай доступ до галереї.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        alert("Не вдалося отримати фото.");
        return;
      }

      const url = await uploadProfilePhotoAsync({ uid: user.uid, uri });

      await setDoc(
        doc(db, "users", user.uid),
        { photoUrl: url, updatedAt: new Date() },
        { merge: true }
      );

      setProfile((p) => ({ ...(p || {}), photoUrl: url }));
    } catch (e) {
      console.log("upload gallery error:", e);
      alert(e?.message || String(e));
    }
  };

  const takeFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        alert("Дай доступ до камери.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        alert("Не вдалося отримати фото.");
        return;
      }

      const url = await uploadProfilePhotoAsync({ uid: user.uid, uri });

      await setDoc(
        doc(db, "users", user.uid),
        { photoUrl: url, updatedAt: new Date() },
        { merge: true }
      );

      setProfile((p) => ({ ...(p || {}), photoUrl: url }));
    } catch (e) {
      console.log("upload camera error:", e);
      alert(e?.message || String(e));
    }
  };

  const saveNickname = async () => {
    const name = nickname.trim();
    if (!name) {
      alert("Введи нікнейм.");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          nickname: name,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setUserName(name);
      setProfile((p) => ({ ...(p || {}), nickname: name }));

      alert("Збережено ✅");
    } catch (e) {
      alert(e?.message || "Помилка збереження");
    }
  };

  const roleLabel = profile?.role === "company" ? "Компанія" : "Особа";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мій профіль</Text>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>👤</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>Тип</Text>
            <Text style={styles.value}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={pickFromGallery}>
            <Text style={styles.btnPrimaryText}>🖼️ Галерея</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOutline} onPress={takeFromCamera}>
            <Text style={styles.btnOutlineText}>📷 Камера</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.section}>Дані</Text>

      <Text style={styles.label}>Нікнейм</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="Введи нікнейм"
        placeholderTextColor={c.muted}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={saveNickname}>
        <Text style={styles.saveBtnText}>Зберегти</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    muted: { color: c.muted },

    title: { fontSize: 22, fontWeight: "900", color: c.text, marginBottom: 12 },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      padding: 14,
    },

    avatarWrap: { flexDirection: "row", gap: 12, alignItems: "center" },

    avatar: { width: 72, height: 72, borderRadius: 18 },
    avatarPlaceholder: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarPlaceholderText: { fontSize: 26 },

    label: { color: c.muted, fontWeight: "800", fontSize: 12 },
    value: { color: c.text, fontWeight: "900", fontSize: 14 },

    btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
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
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    btnOutlineText: { color: c.text, fontWeight: "900" },

    section: {
      marginTop: 16,
      color: c.text,
      fontWeight: "900",
      fontSize: 16,
      marginBottom: 8,
    },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 14,
      padding: 12,
    },

    saveBtn: {
      marginTop: 12,
      backgroundColor: c.primary,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    saveBtnText: { color: "#fff", fontWeight: "900" },
  });
}