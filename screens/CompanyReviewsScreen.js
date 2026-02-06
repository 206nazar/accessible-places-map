import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ScrollView, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { collection, doc, getDocs, query, updateDoc, where, serverTimestamp } from "firebase/firestore";
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

export default function CompanyReviewsScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const me = user || auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [replyDraft, setReplyDraft] = useState({}); // { reviewId: text }
  const [replyUris, setReplyUris] = useState({}); // { reviewId: [uri] }
  const [sending, setSending] = useState({}); // { reviewId: bool }

  const load = async () => {
    if (!me) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const pq = query(collection(db, "places"), where("ownerUid", "==", me.uid));
    const ps = await getDocs(pq);
    const placeIds = ps.docs.map((d) => d.id);

    if (placeIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const all = [];
    for (const pid of placeIds) {
      const rq = query(collection(db, "reviews"), where("placeId", "==", pid));
      const rs = await getDocs(rq);
      rs.docs.forEach((d) => all.push({ id: d.id, ...d.data() }));
    }

    all.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => load().catch((e) => alert(e.message)));
    load().catch((e) => alert(e.message));
    return unsub;
  }, [navigation]);

  const addUris = (reviewId, uris) => {
    setReplyUris((p) => {
      const prev = p[reviewId] || [];
      return { ...p, [reviewId]: [...prev, ...uris].slice(0, 4) };
    });
  };

  const pickReplyImagesFromGallery = async (reviewId) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert("Дай доступ до галереї.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    });

    if (result.canceled) return;
    const uris = (result.assets || []).map((a) => a.uri).filter(Boolean);
    if (uris.length === 0) return;

    addUris(reviewId, uris);
  };

  const takeReplyPhotoFromCamera = async (reviewId) => {
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

    addUris(reviewId, [uri]);
  };

  const removeReplyUri = (reviewId, uri) => {
    setReplyUris((p) => ({ ...p, [reviewId]: (p[reviewId] || []).filter((x) => x !== uri) }));
  };

  const sendReply = async (review) => {
    const reviewId = review.id;
    const text = (replyDraft[reviewId] || "").trim();
    const uris = replyUris[reviewId] || [];

    if (!text && uris.length === 0) return alert("Напиши відповідь або додай фото.");

    try {
      setSending((p) => ({ ...p, [reviewId]: true }));

      let uploaded = [];
      if (uris.length > 0) {
        const folder = `review_replies/${review.placeId}/${me.uid}/${reviewId}`;
        uploaded = await uploadImagesAsync({ folderPath: folder, uris });
      }

      await updateDoc(doc(db, "reviews", reviewId), {
        reply: {
          text,
          images: uploaded,
          companyUid: me.uid,
          createdAt: serverTimestamp(),
        },
      });

      setReplyDraft((p) => ({ ...p, [reviewId]: "" }));
      setReplyUris((p) => ({ ...p, [reviewId]: [] }));

      await load();
      alert("Відповідь додано ✅");
    } catch (e) {
      alert(e?.message || "Помилка відповіді");
    } finally {
      setSending((p) => ({ ...p, [reviewId]: false }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Відгуки на мої точки</Text>

      {loading ? (
        <Text style={styles.muted}>Завантаження...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.muted}>Поки немає відгуків.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => navigation.navigate("PlaceDetails", { placeId: item.placeId })}>
                <Text style={styles.cardTitle}>
                  ⭐ {item.rating || 0} — {item.authorName || item.authorEmail || "Користувач"}
                </Text>
                <Text style={styles.cardText}>{item.text || "—"}</Text>
              </TouchableOpacity>

              {Array.isArray(item.images) && item.images.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {item.images.map((url) => (
                    <Image key={url} source={{ uri: url }} style={styles.thumb} />
                  ))}
                </ScrollView>
              ) : null}

              {item.reply?.text || (Array.isArray(item.reply?.images) && item.reply.images.length > 0) ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyTitle}>Ваша відповідь:</Text>
                  {item.reply?.text ? <Text style={styles.replyText}>{item.reply.text}</Text> : null}

                  {Array.isArray(item.reply?.images) && item.reply.images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                      {item.reply.images.map((url) => (
                        <Image key={url} source={{ uri: url }} style={styles.thumb} />
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    style={styles.input}
                    value={replyDraft[item.id] || ""}
                    onChangeText={(v) => setReplyDraft((p) => ({ ...p, [item.id]: v }))}
                    placeholder="Відповідь компанії..."
                    placeholderTextColor={c.muted}
                    multiline
                  />

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={() => pickReplyImagesFromGallery(item.id)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.btnOutlineText}>🖼️ Галерея</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={() => takeReplyPhotoFromCamera(item.id)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.btnOutlineText}>📷 Камера</Text>
                    </TouchableOpacity>
                  </View>

                  {(replyUris[item.id] || []).length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                      {(replyUris[item.id] || []).map((uri) => (
                        <View key={uri} style={styles.thumbWrap}>
                          <Image source={{ uri }} style={styles.thumb2} />
                          <TouchableOpacity style={styles.thumbX} onPress={() => removeReplyUri(item.id, uri)}>
                            <Text style={styles.thumbXText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  ) : null}

                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => sendReply(item)}
                    disabled={!!sending[item.id]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.btnText}>{sending[item.id] ? "Відправка..." : "Відповісти"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },
    title: { fontSize: 22, fontWeight: "900", color: c.text, marginBottom: 12 },

    card: {
      marginTop: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
    },
    cardTitle: { color: c.text, fontWeight: "900" },
    cardText: { color: c.text, marginTop: 6 },

    replyBox: {
      marginTop: 12,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    replyTitle: { color: c.muted, fontWeight: "900" },
    replyText: { color: c.text, marginTop: 6 },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 14,
      padding: 12,
      minHeight: 70,
      textAlignVertical: "top",
    },

    btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },

    btnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingVertical: 10,
      borderRadius: 14,
      alignItems: "center",
    },
    btnOutlineText: { color: c.text, fontWeight: "900" },

    btn: { marginTop: 10, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },

    thumb: { width: 84, height: 84, borderRadius: 14, marginRight: 10 },

    thumbWrap: { width: 84, height: 84, borderRadius: 14, overflow: "hidden", marginRight: 10, position: "relative" },
    thumb2: { width: "100%", height: "100%" },
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
