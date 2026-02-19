import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
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

function pickAuthorUid(r) {
  return r.authorUid || r.userUid || r.ownerUid || r.uid || null;
}

export default function CompanyReviewsScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const me = user || auth.currentUser;

  const [loading, setLoading] = useState(true);

  // ✅ точки компанії
  const [myPlaces, setMyPlaces] = useState([]); // [{id,title,photoUrl,photoUrls}]
  const [placeModal, setPlaceModal] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all"); // "all" або конкретний id

  // ✅ відгуки
  const [items, setItems] = useState([]);

  // ✅ reply state
  const [replyDraft, setReplyDraft] = useState({}); // { reviewId: text }
  const [replyUris, setReplyUris] = useState({}); // { reviewId: [uri] }
  const [sending, setSending] = useState({}); // { reviewId: bool }

  const loadMyPlaces = async () => {
    if (!me) return [];
    const pq = query(collection(db, "places"), where("ownerUid", "==", me.uid));
    const ps = await getDocs(pq);
    const places = ps.docs.map((d) => ({ id: d.id, ...d.data() }));
    // щоб в селекті було красиво (по назві)
    places.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    setMyPlaces(places);
    return places;
  };

  const loadReviews = async (placesList) => {
    if (!me) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const places = placesList || myPlaces;
    const allowedPlaceIds = places.map((p) => p.id);

    // ✅ якщо вибрана конкретна точка — фільтруємо
    const targetPlaceIds =
      selectedPlaceId === "all"
        ? allowedPlaceIds
        : allowedPlaceIds.includes(selectedPlaceId)
        ? [selectedPlaceId]
        : [];

    if (targetPlaceIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // 1) збираємо всі відгуки по точках
    const all = [];
    for (const pid of targetPlaceIds) {
      const rq = query(collection(db, "reviews"), where("placeId", "==", pid));
      const rs = await getDocs(rq);
      rs.docs.forEach((d) => all.push({ id: d.id, ...d.data() }));
    }

    all.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    // 2) підтягнути профілі авторів (нік + фото)
    const uids = Array.from(new Set(all.map((r) => pickAuthorUid(r)).filter(Boolean)));

    const profiles = {}; // uid -> { name, photoUrl }
    await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          const data = snap.exists() ? snap.data() : null;

          const name =
            data?.nickname || data?.companyName || data?.displayName || data?.name || "";

          profiles[uid] = {
            name,
            photoUrl: data?.photoUrl || "",
          };
        } catch {
          profiles[uid] = { name: "", photoUrl: "" };
        }
      })
    );

    // 3) збагатити items
    const enriched = all.map((r) => {
      const uid = pickAuthorUid(r);
      return {
        ...r,
        authorUid: uid || r.authorUid,
        authorProfile: uid ? profiles[uid] : null,
      };
    });

    setItems(enriched);
    setLoading(false);
  };

  const loadAll = async () => {
    try {
      const places = await loadMyPlaces();
      await loadReviews(places);
    } catch (e) {
      alert(e?.message || "Помилка завантаження");
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => loadAll());
    loadAll();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  // ✅ якщо змінили вибір точки — перезавантажити відгуки
  useEffect(() => {
    if (!me) return;
    loadReviews().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId]);

  const selectedPlaceLabel = useMemo(() => {
    if (selectedPlaceId === "all") return "📌 Усі мої точки";
    const p = myPlaces.find((x) => x.id === selectedPlaceId);
    return p?.title ? `📍 ${p.title}` : "📍 Обрана точка";
  }, [selectedPlaceId, myPlaces]);

  // ===== reply images helpers =====
  const addUris = (reviewId, uris) => {
    setReplyUris((p) => {
      const prev = p[reviewId] || [];
      const merged = [...prev, ...uris].slice(0, 4);
      return { ...p, [reviewId]: merged };
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
    setReplyUris((p) => ({
      ...p,
      [reviewId]: (p[reviewId] || []).filter((x) => x !== uri),
    }));
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

      await loadReviews();
      alert("Відповідь додано ✅");
    } catch (e) {
      alert(e?.message || "Помилка відповіді");
    } finally {
      setSending((p) => ({ ...p, [reviewId]: false }));
    }
  };

  const renderAuthorLine = (item) => {
    const name =
      item.authorProfile?.name || item.authorName || item.authorEmail || "Користувач";
    const photoUrl = item.authorProfile?.photoUrl || item.authorPhotoUrl || "";

    return (
      <View style={styles.authorRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.authorAvatar} />
        ) : (
          <View style={styles.authorAvatarPh}>
            <Text style={styles.authorAvatarPhText}>👤</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            ⭐ {item.rating || 0} — {name}
          </Text>
          {item.authorEmail ? (
            <Text style={styles.authorSub} numberOfLines={1}>
              {item.authorEmail}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Відгуки на мої точки</Text>

      {/* ✅ селект точки */}
      <TouchableOpacity style={styles.select} onPress={() => setPlaceModal(true)} activeOpacity={0.9}>
        <Text style={styles.selectText} numberOfLines={1}>
          {selectedPlaceLabel}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </TouchableOpacity>

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
                {renderAuthorLine(item)}
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

      {/* ✅ модалка вибору точки (тільки мої) */}
      <Modal visible={placeModal} transparent animationType="fade" onRequestClose={() => setPlaceModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPlaceModal(false)} />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Вибери точку</Text>

            <TouchableOpacity
              style={[styles.modalItem, selectedPlaceId === "all" && styles.modalItemActive]}
              onPress={() => {
                setSelectedPlaceId("all");
                setPlaceModal(false);
              }}
              activeOpacity={0.9}
            >
              <Text style={[styles.modalItemText, selectedPlaceId === "all" && styles.modalItemTextActive]}>
                📌 Усі мої точки
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 360 }}>
              {myPlaces.map((p) => {
                const active = p.id === selectedPlaceId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.modalItem, active && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedPlaceId(p.id);
                      setPlaceModal(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.modalItemText, active && styles.modalItemTextActive]} numberOfLines={2}>
                      📍 {p.title || "Без назви"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalClose} onPress={() => setPlaceModal(false)}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },
    title: { fontSize: 22, fontWeight: "900", color: c.text, marginBottom: 12 },

    // ✅ select
    select: {
      height: 48,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      marginBottom: 6,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: { color: c.text, fontWeight: "900", flex: 1, paddingRight: 10 },
    chev: { color: c.muted, fontSize: 16, fontWeight: "900" },

    card: {
      marginTop: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
    },

    authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    authorAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.surface },
    authorAvatarPh: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    authorAvatarPhText: { fontSize: 18 },
    authorSub: { color: c.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },

    cardTitle: { color: c.text, fontWeight: "900" },
    cardText: { color: c.text, marginTop: 8 },

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
    modalTitle: { fontSize: 16, fontWeight: "900", color: c.text, marginBottom: 12 },

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
    modalItemText: { color: c.text, fontWeight: "900" },
    modalItemTextActive: { color: "#fff" },

    modalClose: { marginTop: 6, paddingVertical: 10, alignItems: "center" },
    modalCloseText: { color: c.muted, fontWeight: "800" },
  });
}
