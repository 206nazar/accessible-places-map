import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");

export default function PlaceDetailsScreen({ route, navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const { placeId } = route.params;

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [routeModal, setRouteModal] = useState(false);

  const [profiles, setProfiles] = useState({});
  const profilesRef = useRef({});

  const load = async () => {
    const snap = await getDoc(doc(db, "places", placeId));
    const placeData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    setPlace(placeData);

    const rq = query(collection(db, "reviews"), where("placeId", "==", placeId));
    const rs = await getDocs(rq);
    const items = rs.docs.map((d) => ({ id: d.id, ...d.data() }));

    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    setReviews(items);

    const uids = Array.from(
      new Set(items.map((r) => r.authorUid || r.userUid || r.uid).filter(Boolean))
    );

    const cache = profilesRef.current || {};
    const missing = uids.filter((uid) => !cache[uid]);

    if (missing.length) {
      const entries = await Promise.all(
        missing.map(async (uid) => {
          try {
            const us = await getDoc(doc(db, "users", uid));
            const data = us.exists() ? us.data() : null;

            const name =
              data?.nickname ||
              data?.companyName ||
              data?.displayName ||
              data?.name ||
              "Користувач";

            const photoUrl = data?.photoUrl || "";

            return [uid, { name, photoUrl }];
          } catch {
            return [uid, { name: "Користувач", photoUrl: "" }];
          }
        })
      );

      const next = { ...cache };
      for (const [uid, info] of entries) next[uid] = info;

      profilesRef.current = next;
      setProfiles(next);
    } else {
      if (Object.keys(profiles).length === 0 && Object.keys(cache).length) {
        setProfiles(cache);
      }
    }
  };

  // ✅ первинне завантаження
  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, [placeId]);

  // ✅ дуже важливо: коли повернувся з екрану додавання/редагування відгуку — оновити
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      load().catch(() => {});
    });
    return unsub;
  }, [navigation, placeId]);

  if (!place) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Завантаження...</Text>
      </View>
    );
  }

  const startRoute = (mode) => {
    setRouteModal(false);
    navigation.navigate("Home", {
      routeToPlaceId: place.id,
      routeMode: mode,
    });
  };

  const photos =
    Array.isArray(place.photoUrls) && place.photoUrls.length
      ? place.photoUrls
      : place.photoUrl
      ? [place.photoUrl]
      : [];

  const ReviewHeader = ({ r }) => {
    const uid = r.authorUid || r.userUid || r.uid;
    const info = uid ? profiles[uid] : null;

    const name =
      info?.name ||
      r.authorName ||
      r.authorEmail ||
      r.userEmail ||
      "Користувач";

    const avatar = info?.photoUrl || r.authorPhotoUrl || "";

    return (
      <View style={styles.reviewHead}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPh}>
            <Text style={styles.avatarPhText}>👤</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.reviewTitle} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.reviewMeta}>⭐ {r.rating || 0}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {photos.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {photos.map((url, idx) => (
              <Image key={`${url}_${idx}`} source={{ uri: url }} style={styles.photo} />
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.title}>{place.title}</Text>
        <Text style={styles.sub}>Додав: {place.ownerName || place.ownerUid || "—"}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              if (!user) return navigation.navigate("Login");
              // ✅ ВАЖЛИВО: екран "ReviewEdit" має бути доданий в App.js
              navigation.navigate("ReviewEdit", { mode: "add", placeId });
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>Залишити відгук</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline, { marginTop: 10 }]}
            onPress={() => setRouteModal(true)}
            activeOpacity={0.9}
          >
            <Text style={[styles.btnText, { color: c.text }]}>🧭 Прокласти маршрут</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Опис</Text>
        <Text style={styles.text}>{place.description || "—"}</Text>

        <Text style={styles.section}>Доступність</Text>
        <Text style={styles.text}>{place.accessInfo || "—"}</Text>

        <Text style={styles.section}>Відгуки</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>Поки немає відгуків.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <ReviewHeader r={r} />
              <Text style={styles.reviewText}>{r.text || "—"}</Text>

              {r.reply?.text ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyTitle}>Відповідь компанії:</Text>
                  <Text style={styles.replyText}>{r.reply.text}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={routeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRouteModal(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Як прокласти маршрут?</Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={() => startRoute("WALKING")}
              activeOpacity={0.9}
            >
              <Text style={styles.modalBtnPrimaryText}>🚶 Пішки</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={() => startRoute("DRIVING")}
              activeOpacity={0.9}
            >
              <Text style={styles.modalBtnPrimaryText}>🚗 Машиною</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalClose} onPress={() => setRouteModal(false)}>
              <Text style={styles.modalCloseText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700", paddingHorizontal: 14, marginTop: 10 },

    photo: { width: SCREEN_W, height: 220 },

    title: { fontSize: 22, fontWeight: "bold", marginTop: 12, paddingHorizontal: 14, color: c.text },
    sub: { color: c.muted, marginTop: 4, paddingHorizontal: 14 },

    actionsRow: { paddingHorizontal: 14, marginTop: 12 },
    btn: { backgroundColor: c.primary, padding: 12, borderRadius: 14, alignItems: "center" },
    btnOutline: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
    btnText: { color: "#fff", fontWeight: "bold" },

    section: { marginTop: 16, paddingHorizontal: 14, fontWeight: "800", color: c.text },
    text: { paddingHorizontal: 14, marginTop: 6, color: c.text, lineHeight: 20 },

    reviewCard: {
      marginTop: 10,
      marginHorizontal: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 12,
    },

    reviewHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    avatar: { width: 40, height: 40, borderRadius: 12 },
    avatarPh: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarPhText: { fontSize: 18 },

    reviewTitle: { color: c.text, fontWeight: "900" },
    reviewMeta: { color: c.muted, fontWeight: "800", marginTop: 2 },

    reviewText: { color: c.text, marginTop: 6 },

    replyBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    replyTitle: { color: c.muted, fontWeight: "800" },
    replyText: { color: c.text, marginTop: 6 },

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

    modalBtn: {
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    modalBtnPrimary: { backgroundColor: c.primary },
    modalBtnPrimaryText: { color: "#fff", fontWeight: "900" },

    modalClose: { paddingVertical: 10, alignItems: "center" },
    modalCloseText: { color: c.muted, fontWeight: "800" },
  });
}